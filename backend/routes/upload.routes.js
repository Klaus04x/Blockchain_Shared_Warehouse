const express = require('express');
const router = express.Router();
const { uploadImageMiddleware, handleUploadImage } = require('../controllers/upload.controller');

router.post('/image', uploadImageMiddleware, handleUploadImage);

module.exports = router;


