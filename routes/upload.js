const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const authMiddleware = require('../middleware/auth');
const upload = require('../middleware/upload');

// All routes require authentication
router.use(authMiddleware);

/**
 * @swagger
 * /api/upload:
 *   post:
 *     summary: Upload a single file
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: File to upload (max 50MB)
 *     responses:
 *       201:
 *         description: File uploaded successfully
 *       400:
 *         description: No file uploaded or invalid file type
 */
router.post('/', upload.single('file'), uploadController.uploadSingle);

/**
 * @swagger
 * /api/upload/multiple:
 *   post:
 *     summary: Upload multiple files (max 10 files)
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - files
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 maxItems: 10
 *                 description: Files to upload (max 10 files, 50MB each)
 *     responses:
 *       201:
 *         description: Files uploaded successfully
 *       400:
 *         description: No files uploaded
 */
router.post('/multiple', upload.array('files', 10), uploadController.uploadMultiple);

module.exports = router;