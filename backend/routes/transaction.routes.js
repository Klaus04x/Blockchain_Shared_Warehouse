const express = require('express');
const TransactionController = require('../controllers/transaction.controller');

const router = express.Router();

// Lấy lịch sử giao dịch của user
router.get('/user/:address', TransactionController.getUserTransactions);

// Lấy tất cả transactions (admin)
router.get('/all', TransactionController.getAllTransactions);

// Lấy thống kê transactions
router.get('/stats', TransactionController.getTransactionStats);

// Lấy chi tiết transaction
router.get('/:hash', TransactionController.getTransactionDetail);

// Cập nhật trạng thái transaction
router.put('/:hash/status', TransactionController.updateTransactionStatus);

module.exports = router;
