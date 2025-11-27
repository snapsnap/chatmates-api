# 📁 Project Structure - Clean Architecture

## Struktur Folder Baru

```
chat-backend/
├── config/
│   ├── database.js           # Database connection
│   └── swagger.js             # Swagger/OpenAPI configuration
│
├── controllers/
│   ├── authController.js      # Auth business logic
│   ├── chatController.js      # Chat business logic
│   ├── userController.js      # User business logic
│   └── uploadController.js    # Upload business logic
│
├── middleware/
│   ├── auth.js                # JWT authentication
│   ├── upload.js              # Multer file upload
│   └── validate.js            # Validation error handler
│
├── routes/
│   ├── index.js               # Main router & health endpoints
│   ├── auth.js                # Auth routes (clean)
│   ├── chats.js               # Chat routes (clean)
│   ├── users.js               # User routes (clean)
│   └── upload.js              # Upload routes (clean)
│
├── validators/
│   ├── authValidator.js       # Auth validation rules
│   ├── chatValidator.js       # Chat validation rules
│   └── userValidator.js       # User validation rules
│
├── sockets/
│   └── chatHandler.js         # WebSocket handlers
│
├── utils/
│   └── response.js            # Response helpers
│
├── uploads/                   # Uploaded files
├── .env                       # Environment variables
├── package.json
└── server.js                  # Main entry point
```

## 🎯 Separation of Concerns

### 1. **Routes** (routes/)
- **Tujuan**: Endpoint definitions & routing
- **Tanggung jawab**: 
  - Define HTTP methods & paths
  - Apply middleware (auth, validation)
  - Call controller methods
  - Swagger documentation
- **Tidak boleh**: Business logic, database queries

**Contoh:**
```javascript
router.post('/register', 
  registerValidator,      // Validation
  validate,               // Error handler
  authController.register // Controller
);
```

### 2. **Controllers** (controllers/)
- **Tujuan**: Business logic & orchestration
- **Tanggung jawab**:
  - Handle request/response
  - Business logic
  - Database operations
  - Call services (if any)
  - Error handling
- **Tidak boleh**: Validation rules, routing

**Contoh:**
```javascript
const register = async (req, res) => {
  // 1. Extract data
  const { name, phone, password } = req.body;
  
  // 2. Business logic
  const hashedPassword = await bcrypt.hash(password, 10);
  
  // 3. Database operation
  const [result] = await db.query('INSERT INTO...');
  
  // 4. Response
  return successResponse(res, 'Success', data);
};
```

### 3. **Validators** (validators/)
- **Tujuan**: Validation rules
- **Tanggung jawab**:
  - Define validation schemas
  - Field validation rules
  - Custom validators
- **Tidak boleh**: Business logic, database access

**Contoh:**
```javascript
const registerValidator = [
  body('name').notEmpty().trim(),
  body('phone').notEmpty().trim(),
  body('password').isLength({ min: 6 })
];
```

### 4. **Middleware** (middleware/)
- **Tujuan**: Request processing
- **Tanggung jawab**:
  - Authentication
  - Validation error handling
  - File upload processing
  - Request transformation
- **Tidak boleh**: Business logic

### 5. **Utils** (utils/)
- **Tujuan**: Helper functions
- **Tanggung jawab**:
  - Common utilities
  - Response formatters
  - Reusable functions

## 🔄 Request Flow

```
Request
  ↓
Routes (routing + apply middleware)
  ↓
Validators (validation rules)
  ↓
Validate Middleware (check errors)
  ↓
Auth Middleware (if protected)
  ↓
Controller (business logic)
  ↓
Database / Services
  ↓
Response Helper
  ↓
Response
```

## 📝 Example Flow: Register User

```javascript
// 1. Route (routes/auth.js)
router.post('/register', 
  registerValidator,           // Step 2
  validate,                    // Step 3
  authController.register      // Step 4
);

// 2. Validator (validators/authValidator.js)
const registerValidator = [
  body('name').notEmpty(),
  body('phone').notEmpty(),
  body('password').isLength({ min: 6 })
];

// 3. Validate Middleware (middleware/validate.js)
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return errorResponse(res, 'Validation failed', 400, errors);
  }
  next();
};

// 4. Controller (controllers/authController.js)
const register = async (req, res) => {
  const { name, phone, password } = req.body;
  
  // Check existing
  const [existing] = await db.query('SELECT...');
  if (existing.length > 0) {
    return errorResponse(res, 'Phone exists', 400);
  }
  
  // Hash password
  const hash = await bcrypt.hash(password, 10);
  
  // Insert user
  const [result] = await db.query('INSERT...');
  
  // Generate token
  const token = jwt.sign({ userId: result.insertId });
  
  // Response
  return successResponse(res, 'Success', { token, user });
};
```

## ✅ Benefits

### 1. **Clean Code**
- Routes hanya routing
- Controllers fokus di business logic
- Validators terpisah dan reusable

### 2. **Maintainability**
- Mudah find & fix bugs
- Clear separation
- Easy to test

### 3. **Scalability**
- Mudah tambah fitur baru
- Reusable components
- Clear structure

### 4. **Testability**
- Unit test per layer
- Mock dependencies
- Isolated testing

## 🔧 Usage Examples

### Add New Endpoint

**1. Create Validator:**
```javascript
// validators/productValidator.js
const createProductValidator = [
  body('name').notEmpty(),
  body('price').isNumeric()
];
```

**2. Create Controller:**
```javascript
// controllers/productController.js
const createProduct = async (req, res) => {
  const { name, price } = req.body;
  // Business logic here...
  return successResponse(res, 'Product created', data);
};
```

**3. Create Route:**
```javascript
// routes/products.js
router.post('/', 
  createProductValidator,
  validate,
  productController.createProduct
);
```

### Reuse Validators

```javascript
// Reuse di multiple routes
router.post('/products', createProductValidator, validate, controller.create);
router.put('/products/:id', updateProductValidator, validate, controller.update);
```

## 🎨 Naming Conventions

### Controllers
- File: `{resource}Controller.js`
- Functions: `{action}` (create, update, delete, get, list)

### Validators
- File: `{resource}Validator.js`
- Exports: `{action}{Resource}Validator`

### Routes
- File: `{resource}.js` (plural)
- Paths: `/{resource}` or `/{resource}/:id`

## 🚀 Migration from Old Structure

Jika Anda sudah punya routes lama, cukup:

1. Copy business logic ke controllers
2. Copy validation ke validators
3. Update routes menggunakan yang baru
4. Delete old route files

---

**Clean Architecture = Clean Code = Happy Developer! 🎉**