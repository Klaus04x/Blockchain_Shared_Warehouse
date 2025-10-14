const express = require('express');
const router = express.Router();
const warehouseController = require('../controllers/warehouse.controller');

// Lấy tất cả kho bãi
router.get('/', warehouseController.getAllWarehouses);

// Lấy kho bãi theo ID
router.get('/:id', warehouseController.getWarehouseById);

// Lấy kho bãi theo địa chỉ chủ sở hữu
router.get('/owner/:address', warehouseController.getWarehousesByOwner);

// Tạo/cập nhật kho bãi trong database
router.post('/', warehouseController.createWarehouse);

// Cập nhật thông tin kho bãi
router.put('/:id', warehouseController.updateWarehouse);

// Xóa (ngưng hoạt động) kho bãi
router.delete('/:id', warehouseController.deleteWarehouse);

// Xóa cứng kho bãi
router.delete('/:id/hard', warehouseController.hardDeleteWarehouse);

// Seed kho mẫu on-chain + DB
router.post('/seed', warehouseController.seedWarehouses);

// Tìm kiếm kho bãi
router.get('/search/:keyword', warehouseController.searchWarehouses);

module.exports = router;


