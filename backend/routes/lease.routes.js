const express = require('express');
const router = express.Router();
const leaseController = require('../controllers/lease.controller');

// Lấy tất cả hợp đồng thuê
router.get('/', leaseController.getAllLeases);

// Lấy hợp đồng theo ID
router.get('/:id', leaseController.getLeaseById);

// Lấy hợp đồng theo người thuê
router.get('/tenant/:address', leaseController.getLeasesByTenant);

// Lấy hợp đồng theo kho bãi
router.get('/warehouse/:warehouseId', leaseController.getLeasesByWarehouse);

// Tạo hợp đồng thuê
router.post('/', leaseController.createLease);

// Cập nhật trạng thái hợp đồng
router.put('/:id', leaseController.updateLease);

module.exports = router;


