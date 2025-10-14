const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');

// Lấy hoặc tạo thông tin người dùng
router.post('/profile', userController.getOrCreateUser);

// Cập nhật thông tin người dùng
router.put('/profile/:address', userController.updateUser);

// Lấy thông tin người dùng theo địa chỉ
router.get('/:address', userController.getUserByAddress);

module.exports = router;


