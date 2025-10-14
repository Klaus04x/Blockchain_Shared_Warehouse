const db = require('../config/database');

// Lấy tất cả hợp đồng thuê
exports.getAllLeases = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT l.*, w.name as warehouse_name, w.location 
       FROM leases l
       JOIN warehouses w ON l.warehouse_id = w.id
       ORDER BY l.created_at DESC`
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching leases:', error);
    res.status(500).json({ error: 'Failed to fetch leases' });
  }
};

// Lấy hợp đồng theo ID
exports.getLeaseById = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT l.*, w.name as warehouse_name, w.location, w.owner_address
       FROM leases l
       JOIN warehouses w ON l.warehouse_id = w.id
       WHERE l.id = ?`,
      [req.params.id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Lease not found' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching lease:', error);
    res.status(500).json({ error: 'Failed to fetch lease' });
  }
};

// Lấy hợp đồng theo người thuê
exports.getLeasesByTenant = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT l.*, w.name as warehouse_name, w.location, w.owner_address
       FROM leases l
       JOIN warehouses w ON l.warehouse_id = w.id
       WHERE l.tenant_address = ?
       ORDER BY l.created_at DESC`,
      [req.params.address]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching leases:', error);
    res.status(500).json({ error: 'Failed to fetch leases' });
  }
};

// Lấy hợp đồng theo kho bãi
exports.getLeasesByWarehouse = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT * FROM leases 
       WHERE warehouse_id = ?
       ORDER BY created_at DESC`,
      [req.params.warehouseId]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching leases:', error);
    res.status(500).json({ error: 'Failed to fetch leases' });
  }
};

// Tạo hợp đồng thuê
exports.createLease = async (req, res) => {
  try {
    const {
      blockchain_id,
      warehouse_id,
      tenant_address,
      area,
      start_date,
      end_date,
      total_price,
      transaction_hash
    } = req.body;

    const [result] = await db.query(
      `INSERT INTO leases 
      (blockchain_id, warehouse_id, tenant_address, area, start_date, end_date, 
       total_price, transaction_hash, is_active, is_completed) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 0)`,
      [blockchain_id, warehouse_id, tenant_address, area, start_date, end_date, 
       total_price, transaction_hash]
    );

    // Cập nhật available_area của warehouse
    await db.query(
      'UPDATE warehouses SET available_area = available_area - ? WHERE id = ?',
      [area, warehouse_id]
    );

    res.status(201).json({
      id: result.insertId,
      message: 'Lease created successfully'
    });
  } catch (error) {
    console.error('Error creating lease:', error);
    res.status(500).json({ error: 'Failed to create lease' });
  }
};

// Cập nhật hợp đồng
exports.updateLease = async (req, res) => {
  try {
    const { is_active, is_completed } = req.body;

    // Lấy thông tin lease hiện tại
    const [leases] = await db.query(
      'SELECT * FROM leases WHERE id = ?',
      [req.params.id]
    );

    if (leases.length === 0) {
      return res.status(404).json({ error: 'Lease not found' });
    }

    const lease = leases[0];

    // Cập nhật lease
    const [result] = await db.query(
      `UPDATE leases 
      SET is_active = ?, is_completed = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [is_active, is_completed, req.params.id]
    );

    // Nếu lease được hoàn thành hoặc hủy, trả lại diện tích
    if ((is_completed || !is_active) && lease.is_active) {
      await db.query(
        'UPDATE warehouses SET available_area = available_area + ? WHERE id = ?',
        [lease.area, lease.warehouse_id]
      );
    }

    res.json({ message: 'Lease updated successfully' });
  } catch (error) {
    console.error('Error updating lease:', error);
    res.status(500).json({ error: 'Failed to update lease' });
  }
};


