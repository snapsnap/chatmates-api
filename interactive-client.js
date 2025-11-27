const io = require('socket.io-client');
const readline = require('readline');

// Ganti dengan token JWT yang valid
const TOKEN = process.argv[2] || 'your-token-here';
const CHAT_ID = parseInt(process.argv[3]) || 1;

if (TOKEN === 'your-token-here') {
  console.log('❌ Please provide a valid token');
  console.log('Usage: node interactive-client.js <TOKEN> [CHAT_ID]');
  process.exit(1);
}

// Connect ke socket
const socket = io('http://localhost:3000', {
  auth: { token: TOKEN }
});

// Setup readline untuk input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: '> '
});

let isConnected = false;
let currentChatId = CHAT_ID;

socket.on('connect', () => {
  console.log('✅ Connected to server');
  console.log(`Socket ID: ${socket.id}\n`);
  isConnected = true;
  
  // Auto join chat
  socket.emit('join_chat', { chatId: currentChatId });
  console.log(`📥 Joined chat ${currentChatId}\n`);
  
  printCommands();
  rl.prompt();
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection error:', error.message);
  process.exit(1);
});

socket.on('disconnect', (reason) => {
  console.log('🔌 Disconnected:', reason);
  isConnected = false;
});

socket.on('message', (data) => {
  console.log(`\n📨 [${data.message.sender_name}]: ${data.message.body}`);
  if (data.message.attachments?.length > 0) {
    console.log(`   📎 ${data.message.attachments.length} attachment(s)`);
  }
  
  // Auto acknowledge
  socket.emit('ack_message', { 
    messageId: data.message.id, 
    status: 'read' 
  });
  
  rl.prompt();
});

socket.on('typing', (data) => {
  if (data.isTyping) {
    console.log(`\n⌨️  User ${data.userId} is typing...`);
    rl.prompt();
  }
});

socket.on('receipt', (data) => {
  if (data.read_at) {
    console.log(`\n✔️  Message ${data.messageId} read by user ${data.userId}`);
    rl.prompt();
  }
});

socket.on('presence', (data) => {
  const status = data.online ? '🟢 ONLINE' : '⚫ OFFLINE';
  console.log(`\n${status} - User ${data.userId}`);
  rl.prompt();
});

socket.on('error', (data) => {
  console.error(`\n❌ Error: ${data.message}`);
  rl.prompt();
});

function printCommands() {
  console.log('Available commands:');
  console.log('  /help              - Show this help');
  console.log('  /join <chatId>     - Join a chat');
  console.log('  /leave             - Leave current chat');
  console.log('  /typing            - Send typing indicator');
  console.log('  /quit              - Exit');
  console.log('  <message>          - Send a message');
  console.log('');
}

// Handle user input
rl.on('line', (line) => {
  const input = line.trim();
  
  if (!input) {
    rl.prompt();
    return;
  }
  
  if (!isConnected) {
    console.log('❌ Not connected to server');
    rl.prompt();
    return;
  }
  
  // Commands
  if (input.startsWith('/')) {
    const [cmd, ...args] = input.split(' ');
    
    switch (cmd) {
      case '/help':
        printCommands();
        break;
        
      case '/join':
        if (!args[0]) {
          console.log('❌ Usage: /join <chatId>');
        } else {
          const chatId = parseInt(args[0]);
          socket.emit('join_chat', { chatId });
          currentChatId = chatId;
          console.log(`📥 Joining chat ${chatId}...`);
        }
        break;
        
      case '/leave':
        socket.emit('leave_chat', { chatId: currentChatId });
        console.log(`📤 Left chat ${currentChatId}`);
        break;
        
      case '/typing':
        socket.emit('typing', { chatId: currentChatId, isTyping: true });
        console.log('⌨️  Typing indicator sent');
        setTimeout(() => {
          socket.emit('typing', { chatId: currentChatId, isTyping: false });
        }, 3000);
        break;
        
      case '/quit':
        console.log('👋 Goodbye!');
        socket.disconnect();
        process.exit(0);
        break;
        
      default:
        console.log(`❌ Unknown command: ${cmd}`);
        console.log('Type /help for available commands');
    }
  } else {
    // Send message
    socket.emit('send_message', {
      chatId: currentChatId,
      body: input,
      attachments: []
    });
    console.log('✅ Message sent');
  }
  
  rl.prompt();
});

rl.on('close', () => {
  console.log('\n👋 Goodbye!');
  socket.disconnect();
  process.exit(0);
});

console.log('🚀 Interactive Chat Client');
console.log('==========================\n');