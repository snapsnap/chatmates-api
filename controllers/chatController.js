const db = require('../config/database');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * Create new chat (1-on-1 or group)
 */
const createChat = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { userIds, title, isGroup } = req.body;
    const createdBy = req.userId;

    await conn.beginTransaction();

    // For 1-on-1, check if chat already exists
    if (!isGroup && userIds.length === 1) {
      const otherUserId = userIds[0];
      const [existing] = await conn.query(`
        SELECT c.id FROM chats c
        INNER JOIN chat_members cm1 ON c.id = cm1.chat_id AND cm1.user_id = ?
        INNER JOIN chat_members cm2 ON c.id = cm2.chat_id AND cm2.user_id = ?
        WHERE c.is_group = 0
      `, [createdBy, otherUserId]);

      if (existing.length > 0) {
        await conn.commit();
        return successResponse(res, 'Chat already exists', { 
          chatId: existing[0].id 
        });
      }
    }

    // Create new chat
    const [chatResult] = await conn.query(
      'INSERT INTO chats (title, is_group, created_by) VALUES (?, ?, ?)',
      [title || null, isGroup ? 1 : 0, createdBy]
    );

    const chatId = chatResult.insertId;

    // Add creator as member
    await conn.query(
      'INSERT INTO chat_members (chat_id, user_id) VALUES (?, ?)',
      [chatId, createdBy]
    );

    // Add other users as members
    for (const userId of userIds) {
      if (userId !== createdBy) {
        await conn.query(
          'INSERT INTO chat_members (chat_id, user_id) VALUES (?, ?)',
          [chatId, userId]
        );
      }
    }

    await conn.commit();

    return successResponse(res, 'Chat created successfully', { chatId }, 201);
  } catch (error) {
    await conn.rollback();
    console.error('Create chat error:', error);
    return errorResponse(res, 'Failed to create chat', 500);
  } finally {
    conn.release();
  }
};

/**
 * Get all chats for current user
 */
const getChats = async (req, res) => {
  try {
    const [chats] = await db.query(`
      SELECT 
        c.id, c.title, c.is_group, c.created_at,
        (SELECT body FROM messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
        (SELECT created_at FROM messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_time,
        (SELECT COUNT(*) FROM messages m 
         LEFT JOIN message_receipts mr ON m.id = mr.message_id AND mr.user_id = ?
         WHERE m.chat_id = c.id AND m.sender_id != ? AND mr.read_at IS NULL) as unread_count
      FROM chats c
      INNER JOIN chat_members cm ON c.id = cm.chat_id
      WHERE cm.user_id = ?
      ORDER BY last_message_time DESC
    `, [req.userId, req.userId, req.userId]);

    return successResponse(res, 'Chats retrieved successfully', { chats });
  } catch (error) {
    console.error('Get chats error:', error);
    return errorResponse(res, 'Failed to retrieve chats', 500);
  }
};

/**
 * Get chat details and members
 */
const getChatById = async (req, res) => {
  try {
    const { chatId } = req.params;

    // Verify user is member
    const [memberCheck] = await db.query(
      'SELECT id FROM chat_members WHERE chat_id = ? AND user_id = ?',
      [chatId, req.userId]
    );

    if (memberCheck.length === 0) {
      return errorResponse(res, 'You are not a member of this chat', 403);
    }

    // Get chat details
    const [chats] = await db.query('SELECT * FROM chats WHERE id = ?', [chatId]);
    if (chats.length === 0) {
      return errorResponse(res, 'Chat not found', 404);
    }

    // Get members
    const [members] = await db.query(`
      SELECT u.id, u.name, u.phone, u.avatar, cm.joined_at
      FROM chat_members cm
      INNER JOIN users u ON cm.user_id = u.id
      WHERE cm.chat_id = ?
    `, [chatId]);

    return successResponse(res, 'Chat details retrieved successfully', {
      chat: chats[0],
      members
    });
  } catch (error) {
    console.error('Get chat detail error:', error);
    return errorResponse(res, 'Failed to retrieve chat details', 500);
  }
};

/**
 * Get messages from chat
 */
const getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    const before = req.query.before;

    // Verify member
    const [memberCheck] = await db.query(
      'SELECT id FROM chat_members WHERE chat_id = ? AND user_id = ?',
      [chatId, req.userId]
    );

    if (memberCheck.length === 0) {
      return errorResponse(res, 'You are not a member of this chat', 403);
    }

    let query = `
      SELECT 
        m.*,
        u.name as sender_name, u.avatar as sender_avatar,
        (SELECT JSON_ARRAYAGG(JSON_OBJECT('id', a.id, 'type', a.type, 'url', a.url, 'filename', a.filename, 'size', a.size))
         FROM attachments a WHERE a.message_id = m.id) as attachments
      FROM messages m
      INNER JOIN users u ON m.sender_id = u.id
      WHERE m.chat_id = ?
    `;

    const params = [chatId];

    if (before) {
      query += ' AND m.id < ?';
      params.push(before);
    }

    query += ' ORDER BY m.created_at DESC LIMIT ?';
    params.push(limit);

    const [messages] = await db.query(query, params);

    // Parse attachments JSON
    messages.forEach(msg => {
      msg.attachments = msg.attachments ? JSON.parse(msg.attachments) : [];
    });

    return successResponse(res, 'Messages retrieved successfully', {
      messages: messages.reverse(),
      hasMore: messages.length === limit
    });
  } catch (error) {
    console.error('Get messages error:', error);
    return errorResponse(res, 'Failed to retrieve messages', 500);
  }
};

/**
 * Update chat (title, add members)
 */
const updateChat = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { chatId } = req.params;
    const { title, addUserIds } = req.body;

    // Verify user is member
    const [memberCheck] = await conn.query(
      'SELECT id FROM chat_members WHERE chat_id = ? AND user_id = ?',
      [chatId, req.userId]
    );

    if (memberCheck.length === 0) {
      return errorResponse(res, 'You are not a member of this chat', 403);
    }

    await conn.beginTransaction();

    // Update title if provided
    if (title !== undefined) {
      await conn.query('UPDATE chats SET title = ? WHERE id = ?', [title, chatId]);
    }

    // Add members if provided
    if (addUserIds && addUserIds.length > 0) {
      for (const userId of addUserIds) {
        // Check if already member
        const [existing] = await conn.query(
          'SELECT id FROM chat_members WHERE chat_id = ? AND user_id = ?',
          [chatId, userId]
        );

        if (existing.length === 0) {
          await conn.query(
            'INSERT INTO chat_members (chat_id, user_id) VALUES (?, ?)',
            [chatId, userId]
          );
        }
      }
    }

    await conn.commit();

    return successResponse(res, 'Chat updated successfully', { chatId });
  } catch (error) {
    await conn.rollback();
    console.error('Update chat error:', error);
    return errorResponse(res, 'Failed to update chat', 500);
  } finally {
    conn.release();
  }
};

/**
 * Leave chat
 */
const leaveChat = async (req, res) => {
  try {
    const { chatId } = req.params;

    const [result] = await db.query(
      'DELETE FROM chat_members WHERE chat_id = ? AND user_id = ?',
      [chatId, req.userId]
    );

    if (result.affectedRows === 0) {
      return errorResponse(res, 'You are not a member of this chat', 404);
    }

    return successResponse(res, 'You have left the chat', { chatId });
  } catch (error) {
    console.error('Leave chat error:', error);
    return errorResponse(res, 'Failed to leave chat', 500);
  }
};

/**
 * Delete chat (creator only)
 */
const deleteChat = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { chatId } = req.params;

    // Check if user is creator
    const [chats] = await conn.query(
      'SELECT created_by FROM chats WHERE id = ?',
      [chatId]
    );

    if (chats.length === 0) {
      return errorResponse(res, 'Chat not found', 404);
    }

    if (chats[0].created_by !== req.userId) {
      return errorResponse(res, 'Only chat creator can delete this chat', 403);
    }

    await conn.beginTransaction();

    // Delete attachments first
    await conn.query(`
      DELETE a FROM attachments a
      INNER JOIN messages m ON a.message_id = m.id
      WHERE m.chat_id = ?
    `, [chatId]);

    // Delete message receipts
    await conn.query(`
      DELETE mr FROM message_receipts mr
      INNER JOIN messages m ON mr.message_id = m.id
      WHERE m.chat_id = ?
    `, [chatId]);

    // Delete messages
    await conn.query('DELETE FROM messages WHERE chat_id = ?', [chatId]);

    // Delete chat members
    await conn.query('DELETE FROM chat_members WHERE chat_id = ?', [chatId]);

    // Delete chat
    await conn.query('DELETE FROM chats WHERE id = ?', [chatId]);

    await conn.commit();

    return successResponse(res, 'Chat deleted successfully', { chatId });
  } catch (error) {
    await conn.rollback();
    console.error('Delete chat error:', error);
    return errorResponse(res, 'Failed to delete chat', 500);
  } finally {
    conn.release();
  }
};

module.exports = {
  createChat,
  getChats,
  getChatById,
  getMessages,
  updateChat,
  leaveChat,
  deleteChat
};