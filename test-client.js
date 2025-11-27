const io = require('socket.io-client');

// Ganti dengan token JWT yang valid dari hasil login
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc2NDIxNzkzNywiZXhwIjoxNzY0ODIyNzM3fQ.cbrycIrawNkA8rcwKHnw3zZFYPEr0vXhXxV9zqaNFUc';

// Connect ke socket
const socket = io('http://localhost:3000', {
  auth: { token: TOKEN }
});

// Connection events
socket.on('connect', () => {
  console.log('✅ Connected to server');
  console.log('Socket ID:', socket.id);
  
  // Setelah connect, join chat
  console.log('\n📥 Joining chat...');
  socket.emit('join_chat', { chatId: 1 });
  
  // Tunggu 1 detik lalu kirim message
  setTimeout(() => {
    console.log('\n📤 Sending message...');
    socket.emit('send_message', {
      chatId: 1,
      body: 'Hello from test client! ' + new Date().toISOString(),
      attachments: []
    });
  }, 1000);
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection error:', error.message);
});

socket.on('disconnect', (reason) => {
  console.log('🔌 Disconnected:', reason);
});

// Listen to events
socket.on('message', (data) => {
  console.log('\n📨 New message received:');
  console.log('  ID:', data.message.id);
  console.log('  From:', data.message.sender_name);
  console.log('  Body:', data.message.body);
  console.log('  Attachments:', data.message.attachments?.length || 0);
  
  // Auto acknowledge as read
  console.log('\n✔️  Acknowledging message as read...');
  socket.emit('ack_message', { 
    messageId: data.message.id, 
    status: 'read' 
  });
});

socket.on('typing', (data) => {
  console.log(`\n⌨️  User ${data.userId} is ${data.isTyping ? 'typing' : 'stopped typing'} in chat ${data.chatId}`);
});

socket.on('receipt', (data) => {
  console.log('\n📬 Receipt received:');
  console.log('  Message ID:', data.messageId);
  console.log('  User ID:', data.userId);
  if (data.delivered_at) console.log('  Delivered at:', data.delivered_at);
  if (data.read_at) console.log('  Read at:', data.read_at);
});

socket.on('presence', (data) => {
  console.log(`\n👤 User ${data.userId} is now ${data.online ? 'ONLINE' : 'OFFLINE'}`);
});

socket.on('error', (data) => {
  console.error('\n❌ Error from server:', data.message);
});

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('\n\n👋 Disconnecting...');
  socket.disconnect();
  process.exit(0);
});

console.log('🚀 Starting test client...');
console.log('Press Ctrl+C to exit\n');