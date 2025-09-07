const express = require('express');
const upload = require('../middleware/upload');

const router = express.Router();

// File upload endpoint
router.post('/', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ 
      fileUrl, 
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'File upload failed' });
  }
});

// Multiple file upload
router.post('/multiple', upload.array('files', 5), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }
    
    const files = req.files.map(file => ({
      fileUrl: `/uploads/${file.filename}`,
      filename: file.originalname,
      size: file.size,
      mimetype: file.mimetype
    }));
    
    res.json({ files });
  } catch (error) {
    console.error('Error uploading files:', error);
    res.status(500).json({ error: 'File upload failed' });
  }
});

module.exports = router;
