require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');
const { errorResponse } = require('./utils/response');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Chatmates API Documentation',
  customfavIcon: '/favicon.ico'
}));

// API Routes
const apiRoutes = require('./routes');
app.use('/api', apiRoutes);

// Root redirect
app.get('/', (req, res) => {
  res.redirect('/api');
});

// 404 handler
app.use((req, res) => {
  errorResponse(res, 'Endpoint not found', 404);
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  
  // Multer error handling
  if (err.code === 'LIMIT_FILE_SIZE') {
    return errorResponse(res, 'File size too large (max 50MB)', 400);
  }
  
  if (err.message === 'File type not allowed') {
    return errorResponse(res, err.message, 400);
  }
  
  return errorResponse(res, 'Internal server error', 500);
});

// Socket.IO handler
require('./sockets/chatHandler')(io);

// Start server
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════╗
║         Chat API Server Started                ║
╠════════════════════════════════════════════════╣
║  Environment: ${process.env.NODE_ENV || 'development'}
║  HTTP API:    http://localhost:${PORT}
║  WebSocket:   ws://localhost:${PORT}
║  API Docs:    http://localhost:${PORT}/api-docs
║  Status:      http://localhost:${PORT}/health
╚════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

process.on('SIGINT', () => {
  console.log('\nSIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

module.exports = { app, server, io };