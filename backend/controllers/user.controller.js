const db = require('../config/database');

// Lấy hoặc tạo người dùng
exports.getOrCreateUser = async (req, res) => {
  try {
    const { wallet_address, name, email } = req.body;

    // Kiểm tra xem user đã tồn tại chưa
    const [existingUsers] = await db.query(
      'SELECT * FROM users WHERE wallet_address = ?',
      [wallet_address]
    );

    if (existingUsers.length > 0) {
      return res.json(existingUsers[0]);
    }

    // Tạo user mới
    const [result] = await db.query(
      'INSERT INTO users (wallet_address, name, email) VALUES (?, ?, ?)',
      [wallet_address, name || '', email || '']
    );

    const [newUser] = await db.query(
      'SELECT * FROM users WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json(newUser[0]);
  } catch (error) {
    console.error('Error getting/creating user:', error);
    res.status(500).json({ error: 'Failed to get/create user' });
  }
};

// Lấy thông tin người dùng
exports.getUserByAddress = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM users WHERE wallet_address = ?',
      [req.params.address]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

// Cập nhật thông tin người dùng
exports.updateUser = async (req, res) => {
  try {
    const { name, email, phone, avatar_url } = req.body;

    const [result] = await db.query(
      `UPDATE users 
      SET name = ?, email = ?, phone = ?, avatar_url = ?, updated_at = CURRENT_TIMESTAMP
      WHERE wallet_address = ?`,
      [name, email, phone, avatar_url, req.params.address]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
};


