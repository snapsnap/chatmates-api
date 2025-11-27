const { successResponse, errorResponse } = require('../utils/response');

/**
 * Upload single file
 */
const uploadSingle = (req, res) => {
  try {
    if (!req.file) {
      return errorResponse(res, 'No file uploaded', 400);
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    
    // Determine type based on mimetype
    let type = 'file';
    if (req.file.mimetype.startsWith('image/')) type = 'image';
    else if (req.file.mimetype.startsWith('video/')) type = 'video';
    else if (req.file.mimetype.startsWith('audio/')) type = 'audio';

    return successResponse(res, 'File uploaded successfully', {
      file: {
        url: fileUrl,
        filename: req.file.originalname,
        type,
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    }, 201);
  } catch (error) {
    console.error('Upload error:', error);
    return errorResponse(res, 'Failed to upload file', 500);
  }
};

/**
 * Upload multiple files
 */
const uploadMultiple = (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return errorResponse(res, 'No files uploaded', 400);
    }

    const files = req.files.map(file => {
      let type = 'file';
      if (file.mimetype.startsWith('image/')) type = 'image';
      else if (file.mimetype.startsWith('video/')) type = 'video';
      else if (file.mimetype.startsWith('audio/')) type = 'audio';

      return {
        url: `/uploads/${file.filename}`,
        filename: file.originalname,
        type,
        size: file.size,
        mimetype: file.mimetype
      };
    });

    return successResponse(res, `${files.length} file(s) uploaded successfully`, { 
      files 
    }, 201);
  } catch (error) {
    console.error('Upload multiple error:', error);
    return errorResponse(res, 'Failed to upload files', 500);
  }
};

module.exports = {
  uploadSingle,
  uploadMultiple
};