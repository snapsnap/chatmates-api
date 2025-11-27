# 📚 Swagger API Documentation Guide

## Accessing Swagger UI

Setelah server berjalan, buka browser dan akses:

```
http://localhost:3000/api-docs
```

Anda akan melihat Swagger UI dengan dokumentasi lengkap semua API endpoints.

## Cara Menggunakan Swagger UI

### 1. **Testing Endpoints Tanpa Authentication**

Endpoints yang tidak memerlukan auth:
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /health`

Cara test:
1. Klik endpoint yang ingin dicoba
2. Klik tombol **"Try it out"**
3. Isi request body (jika ada)
4. Klik **"Execute"**
5. Lihat response di bagian bawah

### 2. **Testing Endpoints dengan Authentication**

Untuk endpoints yang memerlukan JWT token (bertanda 🔒):

**Step 1: Dapatkan Token**
```bash
# Register atau login dulu
POST /api/auth/login
{
  "phone": "081234567890",
  "password": "password123"
}

# Copy token dari response
```

**Step 2: Authorize di Swagger**
1. Klik tombol **"Authorize"** di pojok kanan atas (ikon gembok)
2. Masukkan token dengan format: `Bearer <your-token>`
   - Contoh: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
3. Klik **"Authorize"**
4. Klik **"Close"**

**Step 3: Test Endpoint**
Sekarang Anda bisa test semua protected endpoints!

### 3. **Upload Files**

Untuk test upload endpoint:
1. Klik `POST /api/upload`
2. Klik **"Try it out"**
3. Klik **"Choose File"** dan pilih file
4. Klik **"Execute"**

## Available Endpoints

### 🔐 Authentication
- `POST /api/auth/register` - Register user baru
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` 🔒 - Get current user profile

### 👥 Users
- `GET /api/users/search?q=query` 🔒 - Search users
- `GET /api/users/{userId}` 🔒 - Get user by ID
- `PUT /api/users/profile` 🔒 - Update profile

### 💬 Chats
- `POST /api/chats` 🔒 - Create new chat
- `GET /api/chats` 🔒 - Get all chats
- `GET /api/chats/{chatId}` 🔒 - Get chat details
- `GET /api/chats/{chatId}/messages` 🔒 - Get messages
- `PUT /api/chats/{chatId}` 🔒 - Update chat
- `POST /api/chats/{chatId}/leave` 🔒 - Leave chat
- `DELETE /api/chats/{chatId}` 🔒 - Delete chat

### 📤 Upload
- `POST /api/upload` 🔒 - Upload single file
- `POST /api/upload/multiple` 🔒 - Upload multiple files

### 🏥 Health
- `GET /health` - Health check
- `GET /` - API info

🔒 = Memerlukan authentication (JWT token)

## Response Format

Semua endpoints menggunakan format response yang konsisten:

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data here
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "data": null,
  "errors": [] // Optional validation errors
}
```

## Tips Menggunakan Swagger

1. **Gunakan "Authorize" button** untuk set token sekali saja, bukan di setiap request
2. **Copy token dari response login** langsung dari Swagger UI
3. **Perhatikan required fields** (ditandai dengan tanda bintang *)
4. **Lihat example values** untuk format data yang benar
5. **Check response schemas** untuk tahu struktur data yang dikembalikan

## Testing Flow Example

### Scenario: Create Chat dan Send Message

```bash
# 1. Register/Login
POST /api/auth/login
→ Copy token

# 2. Authorize di Swagger
Click "Authorize" → Paste token

# 3. Search user untuk chat
GET /api/users/search?q=John

# 4. Create chat
POST /api/chats
{
  "userIds": [2],
  "isGroup": false
}
→ Copy chatId

# 5. Upload file (optional)
POST /api/upload
→ Copy file URL

# 6. Send message via WebSocket
(Tidak bisa via Swagger, gunakan Socket.IO client)

# 7. Get messages
GET /api/chats/{chatId}/messages
```

## Swagger UI Features

### 1. **Models/Schemas**
Klik bagian "Schemas" di bawah untuk melihat:
- User schema
- Chat schema
- Message schema
- Response schemas

### 2. **Try it Out**
Test langsung dari browser tanpa tools external

### 3. **Download OpenAPI Spec**
URL: `http://localhost:3000/api-docs.json`
Untuk import ke Postman/Insomnia

### 4. **Code Generation**
Swagger UI bisa generate code client untuk berbagai bahasa

## Troubleshooting

### "Authorization header missing"
- Pastikan sudah klik "Authorize" dan input token
- Format harus: `Bearer <token>`

### "Invalid token"
- Token mungkin expired (7 hari)
- Login ulang untuk mendapat token baru

### "File upload failed"
- Max size: 50MB
- Allowed types: image, video, audio, document
- Gunakan form-data, bukan JSON

### "Validation failed"
- Cek required fields
- Lihat error details di response
- Sesuaikan dengan example values

## WebSocket Documentation

Swagger tidak support WebSocket, tapi ada dokumentasi lengkap di README utama.

WebSocket Events:
- `join_chat` - Join room
- `send_message` - Send message
- `typing` - Typing indicator
- `ack_message` - Message receipt

Lihat file `test-client.js` untuk contoh implementasi.

## Export API Documentation

### Download OpenAPI JSON
```bash
curl http://localhost:3000/api-docs.json > openapi.json
```

### Import ke Postman
1. Open Postman
2. Import → Link
3. Paste: `http://localhost:3000/api-docs.json`

### Import ke Insomnia
1. Create → Import
2. From URL
3. Paste: `http://localhost:3000/api-docs.json`

---

Happy Testing! 🚀

Jika ada pertanyaan, lihat dokumentasi lengkap di README.md