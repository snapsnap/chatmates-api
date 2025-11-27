const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Chatmates API Documentation',
      version: '1.0.0',
      description: 'Real-time chat application API with WebSocket support',
      contact: {
        name: 'API Support',
        email: 'support@chatapp.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      },
      {
        url: 'https://api.chatmates.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'John Doe' },
            phone: { type: 'string', example: '081234567890' },
            avatar: { type: 'string', nullable: true, example: '/uploads/avatar.jpg' },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        Chat: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            title: { type: 'string', nullable: true, example: 'Project Team' },
            is_group: { type: 'integer', example: 1 },
            created_by: { type: 'integer', example: 1 },
            created_at: { type: 'string', format: 'date-time' },
            last_message: { type: 'string', nullable: true, example: 'Hello everyone!' },
            last_message_time: { type: 'string', format: 'date-time', nullable: true },
            unread_count: { type: 'integer', example: 3 }
          }
        },
        Message: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            chat_id: { type: 'integer', example: 1 },
            sender_id: { type: 'integer', example: 1 },
            body: { type: 'string', nullable: true, example: 'Hello!' },
            reply_to_message_id: { type: 'integer', nullable: true, example: 10 },
            created_at: { type: 'string', format: 'date-time' },
            edited_at: { type: 'string', format: 'date-time', nullable: true },
            status: { type: 'integer', example: 0 },
            sender_name: { type: 'string', example: 'John Doe' },
            sender_avatar: { type: 'string', nullable: true, example: '/uploads/avatar.jpg' },
            attachments: {
              type: 'array',
              items: { $ref: '#/components/schemas/Attachment' }
            }
          }
        },
        Attachment: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            type: { type: 'string', enum: ['image', 'video', 'audio', 'file'], example: 'image' },
            url: { type: 'string', example: '/uploads/photo.jpg' },
            filename: { type: 'string', example: 'photo.jpg' },
            size: { type: 'integer', example: 102400 }
          }
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Operation successful' },
            data: { type: 'object' }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Error message' },
            data: { type: 'null', example: null },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string' },
                  message: { type: 'string' }
                }
              }
            }
          }
        }
      }
    },
    tags: [
      { name: 'Authentication', description: 'User authentication endpoints' },
      { name: 'Users', description: 'User management endpoints' },
      { name: 'Chats', description: 'Chat management endpoints' },
      { name: 'Upload', description: 'File upload endpoints' },
      { name: 'Health', description: 'Health check endpoint' }
    ]
  },
  apis: ['./routes/*.js', './server.js']
};

const specs = swaggerJsdoc(options);

module.exports = specs;