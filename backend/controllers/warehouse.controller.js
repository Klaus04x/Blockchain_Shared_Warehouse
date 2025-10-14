const db = require('../config/database');
const { getContractWithWallet } = require('../services/blockchain');
const { ethers } = require('ethers');

// Lấy tất cả kho bãi
exports.getAllWarehouses = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM warehouses WHERE is_active = 1 ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching warehouses:', error);
    res.status(500).json({ error: 'Failed to fetch warehouses' });
  }
};

// Lấy kho bãi theo ID
exports.getWarehouseById = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM warehouses WHERE id = ?',
      [req.params.id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Warehouse not found' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching warehouse:', error);
    res.status(500).json({ error: 'Failed to fetch warehouse' });
  }
};

// Lấy kho bãi theo chủ sở hữu
exports.getWarehousesByOwner = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM warehouses WHERE owner_address = ? ORDER BY created_at DESC',
      [req.params.address]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching warehouses:', error);
    res.status(500).json({ error: 'Failed to fetch warehouses' });
  }
};

// Tạo kho bãi mới
exports.createWarehouse = async (req, res) => {
  try {
    const {
      blockchain_id,
      owner_address,
      name,
      location,
      total_area,
      available_area,
      price_per_sqm_per_day,
      image_url,
      description
    } = req.body;

    const [result] = await db.query(
      `INSERT INTO warehouses 
      (blockchain_id, owner_address, name, location, total_area, available_area, 
       price_per_sqm_per_day, image_url, description, is_active) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [blockchain_id, owner_address, name, location, total_area, available_area, 
       price_per_sqm_per_day, image_url, description]
    );

    res.status(201).json({
      id: result.insertId,
      message: 'Warehouse created successfully'
    });
  } catch (error) {
    console.error('Error creating warehouse:', error);
    res.status(500).json({ error: 'Failed to create warehouse' });
  }
};

// Cập nhật kho bãi
exports.updateWarehouse = async (req, res) => {
  try {
    const {
      name,
      location,
      available_area,
      price_per_sqm_per_day,
      image_url,
      description,
      is_active
    } = req.body;

    const [result] = await db.query(
      `UPDATE warehouses 
      SET name = ?, location = ?, available_area = ?, price_per_sqm_per_day = ?, 
          image_url = ?, description = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [name, location, available_area, price_per_sqm_per_day, image_url, 
       description, is_active, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Warehouse not found' });
    }

    res.json({ message: 'Warehouse updated successfully' });
  } catch (error) {
    console.error('Error updating warehouse:', error);
    res.status(500).json({ error: 'Failed to update warehouse' });
  }
};

// Xóa (soft delete) kho bãi: đặt is_active = 0
exports.deleteWarehouse = async (req, res) => {
  try {
    const [result] = await db.query(
      `UPDATE warehouses
       SET is_active = 0, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Warehouse not found' });
    }

    res.json({ message: 'Warehouse deactivated successfully' });
  } catch (error) {
    console.error('Error deleting warehouse:', error);
    res.status(500).json({ error: 'Failed to delete warehouse' });
  }
};

// Xóa cứng kho bãi (chỉ DB). Lưu ý: dữ liệu on-chain không thể xóa, chỉ có thể set inactive.
exports.hardDeleteWarehouse = async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM warehouses WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Warehouse not found' });
    }
    res.json({ message: 'Warehouse deleted permanently' });
  } catch (error) {
    console.error('Error hard-deleting warehouse:', error);
    res.status(500).json({ error: 'Failed to hard-delete warehouse' });
  }
};

// Seed kho mẫu: tạo on-chain và lưu DB
exports.seedWarehouses = async (req, res) => {
  try {
    const contract = getContractWithWallet();
    const ownerAddress = await contract.runner.getAddress();
    const samples = [
      {
        name: 'Kho Demo Quận 1',
        location: 'TP. Hồ Chí Minh, Quận 1',
        totalArea: 800,
        priceWei: ethers.parseEther('0.00005'),
        imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d',
        description: 'Kho demo tạo tự động, bảo vệ 24/7'
      },
      {
        name: 'Kho Demo Bình Thạnh',
        location: 'TP. Hồ Chí Minh, Bình Thạnh',
        totalArea: 1200,
        priceWei: ethers.parseEther('0.000045'),
        imageUrl: 'https://images.unsplash.com/photo-1553413077-190dd305871c',
        description: 'Kho tiêu chuẩn, thuận tiện vận chuyển'
      },
      {
        name: 'Kho Lạnh Demo Đông Anh',
        location: 'Hà Nội, Đông Anh',
        totalArea: 600,
        priceWei: ethers.parseEther('0.00008'),
        imageUrl: 'https://images.unsplash.com/photo-1587293852726-70cdb56c2866',
        description: 'Kho lạnh nhiệt độ -18°C đến +5°C'
      }
    ];

    const created = [];
    for (const s of samples) {
      const tx = await contract.registerWarehouse(s.name, s.location, s.totalArea, s.priceWei, s.imageUrl, s.description);
      const receipt = await tx.wait();
      let warehouseId = 0;
      const evt = receipt.logs.find((log) => {
        try { const parsed = contract.interface.parseLog(log); return parsed.name === 'WarehouseRegistered'; } catch { return false; }
      });
      if (evt) { const parsed = contract.interface.parseLog(evt); warehouseId = Number(parsed.args.warehouseId); }
      const [result] = await db.query(
        `INSERT INTO warehouses (blockchain_id, owner_address, name, location, total_area, available_area, price_per_sqm_per_day, image_url, description, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [warehouseId, ownerAddress, s.name, s.location, s.totalArea, s.totalArea, s.priceWei.toString(), s.imageUrl, s.description]
      );
      created.push({ id: result.insertId, blockchain_id: warehouseId, name: s.name });
    }

    res.json({ message: 'Seeded warehouses successfully', created });
  } catch (error) {
    console.error('Error seeding warehouses:', error);
    res.status(500).json({ error: 'Failed to seed warehouses' });
  }
};

// Tìm kiếm kho bãi
exports.searchWarehouses = async (req, res) => {
  try {
    const keyword = `%${req.params.keyword}%`;
    const [rows] = await db.query(
      `SELECT * FROM warehouses 
      WHERE (name LIKE ? OR location LIKE ? OR description LIKE ?) 
      AND is_active = 1
      ORDER BY created_at DESC`,
      [keyword, keyword, keyword]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error searching warehouses:', error);
    res.status(500).json({ error: 'Failed to search warehouses' });
  }
};


