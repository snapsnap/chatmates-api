const jwt = require('jsonwebtoken');
const db = require('../config/database');

// Menyimpan mapping userId -> socketId
const onlineUsers = new Map();

module.exports = (io) => {
  io.use((socket, next) => {
    // Middleware untuk authenticate socket connection
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.userId;
    console.log(`User ${userId} connected with socket ${socket.id}`);

    // Simpan user sebagai online
    onlineUsers.set(userId, socket.id);
    
    // Broadcast presence ke semua user
    io.emit('presence', { userId, online: true });

    // Authenticate (legacy, sudah dilakukan di middleware)
    socket.on('authenticate', async (data) => {
      try {
        const { token } = data;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.userId;
        console.log(`User ${socket.userId} authenticated`);
      } catch (error) {
        socket.emit('error', { message: 'Authentication failed' });
        socket.disconnect();
      }
    });

    // Join chat room
    socket.on('join_chat', async (data) => {
      try {
        const { chatId } = data;

        // Verifikasi user adalah member
        const [members] = await db.query(
          'SELECT id FROM chat_members WHERE chat_id = ? AND user_id = ?',
          [chatId, userId]
        );

        if (members.length === 0) {
          socket.emit('error', { message: 'Not a member of this chat' });
          return;
        }

        socket.join(`chat_${chatId}`);
        console.log(`User ${userId} joined chat ${chatId}`);
      } catch (error) {
        console.error('Join chat error:', error);
        socket.emit('error', { message: 'Failed to join chat' });
      }
    });

    // Leave chat room
    socket.on('leave_chat', (data) => {
      const { chatId } = data;
      socket.leave(`chat_${chatId}`);
      console.log(`User ${userId} left chat ${chatId}`);
    });

    // Typing indicator
    socket.on('typing', (data) => {
      const { chatId, isTyping } = data;
      socket.to(`chat_${chatId}`).emit('typing', {
        chatId,
        userId,
        isTyping
      });
    });

    // Send message
    socket.on('send_message', async (data) => {
      const conn = await db.getConnection();
      try {
        const { chatId, body, attachments, replyToMessageId } = data;

        // Verifikasi member
        const [members] = await conn.query(
          'SELECT id FROM chat_members WHERE chat_id = ? AND user_id = ?',
          [chatId, userId]
        );

        if (members.length === 0) {
          socket.emit('error', { message: 'Not a member of this chat' });
          return;
        }

        await conn.beginTransaction();

        // Insert message
        const [messageResult] = await conn.query(
          'INSERT INTO messages (chat_id, sender_id, body, reply_to_message_id) VALUES (?, ?, ?, ?)',
          [chatId, userId, body || null, replyToMessageId || null]
        );

        const messageId = messageResult.insertId;

        // Insert attachments jika ada
        if (attachments && attachments.length > 0) {
          for (const att of attachments) {
            await conn.query(
              'INSERT INTO attachments (message_id, type, url, filename, size) VALUES (?, ?, ?, ?, ?)',
              [messageId, att.type, att.url, att.filename, att.size || 0]
            );
          }
        }

        // Get all members kecuali sender untuk receipts
        const [chatMembers] = await conn.query(
          'SELECT user_id FROM chat_members WHERE chat_id = ? AND user_id != ?',
          [chatId, userId]
        );

        // Create receipt records
        for (const member of chatMembers) {
          await conn.query(
            'INSERT INTO message_receipts (message_id, user_id) VALUES (?, ?)',
            [messageId, member.user_id]
          );
        }

        await conn.commit();

        // Get complete message data
        const [messages] = await conn.query(`
          SELECT 
            m.*,
            u.name as sender_name, u.avatar as sender_avatar,
            (SELECT JSON_ARRAYAGG(JSON_OBJECT('id', a.id, 'type', a.type, 'url', a.url, 'filename', a.filename, 'size', a.size))
             FROM attachments a WHERE a.message_id = m.id) as attachments
          FROM messages m
          INNER JOIN users u ON m.sender_id = u.id
          WHERE m.id = ?
        `, [messageId]);

        const message = messages[0];
        message.attachments = message.attachments ? JSON.parse(message.attachments) : [];

        // Broadcast ke semua member di chat room
        io.to(`chat_${chatId}`).emit('message', { message });

        console.log(`Message ${messageId} sent to chat ${chatId}`);
      } catch (error) {
        await conn.rollback();
        console.error('Send message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      } finally {
        conn.release();
      }
    });

    // Acknowledge message (delivered/read)
    socket.on('ack_message', async (data) => {
      try {
        const { messageId, status } = data; // status: 'delivered' or 'read'

        if (status === 'delivered') {
          await db.query(
            'UPDATE message_receipts SET delivered_at = NOW() WHERE message_id = ? AND user_id = ?',
            [messageId, userId]
          );
        } else if (status === 'read') {
          await db.query(
            'UPDATE message_receipts SET delivered_at = COALESCE(delivered_at, NOW()), read_at = NOW() WHERE message_id = ? AND user_id = ?',
            [messageId, userId]
          );

          // Update last_read_message_id
          const [messages] = await db.query('SELECT chat_id FROM messages WHERE id = ?', [messageId]);
          if (messages.length > 0) {
            await db.query(
              'UPDATE chat_members SET last_read_message_id = ? WHERE chat_id = ? AND user_id = ?',
              [messageId, messages[0].chat_id, userId]
            );
          }
        }

        // Get message detail untuk broadcast
        const [messages] = await db.query('SELECT chat_id, sender_id FROM messages WHERE id = ?', [messageId]);
        
        if (messages.length > 0) {
          const message = messages[0];
          
          // Broadcast receipt ke sender
          const senderSocketId = onlineUsers.get(message.sender_id);
          if (senderSocketId) {
            io.to(senderSocketId).emit('receipt', {
              messageId,
              userId,
              delivered_at: status === 'delivered' ? new Date() : undefined,
              read_at: status === 'read' ? new Date() : undefined
            });
          }
        }

      } catch (error) {
        console.error('Ack message error:', error);
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`User ${userId} disconnected`);
      onlineUsers.delete(userId);
      
      // Broadcast offline status
      io.emit('presence', { userId, online: false });
    });
  });
};

module.exports.getOnlineUsers = () => onlineUsers;