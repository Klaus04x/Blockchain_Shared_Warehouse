const db = require('../config/database');

class TransactionService {
  // Lưu transaction mới
  static async createTransaction(transactionData) {
    const {
      transactionHash,
      fromAddress,
      toAddress,
      type,
      amount,
      status = 'pending',
      blockNumber = null
    } = transactionData;

    try {
      const query = `
        INSERT INTO transactions 
        (transaction_hash, from_address, to_address, type, amount, status, block_number)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      
      const [result] = await db.execute(query, [
        transactionHash,
        fromAddress,
        toAddress,
        type,
        amount,
        status,
        blockNumber
      ]);

      return result.insertId;
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  }

  // Cập nhật trạng thái transaction
  static async updateTransactionStatus(transactionHash, status, blockNumber = null) {
    try {
      const query = `
        UPDATE transactions 
        SET status = ?, block_number = ?
        WHERE transaction_hash = ?
      `;
      
      const [result] = await db.execute(query, [status, blockNumber, transactionHash]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error updating transaction status:', error);
      throw error;
    }
  }

  // Lấy transaction theo hash
  static async getTransactionByHash(transactionHash) {
    try {
      const query = `
        SELECT * FROM transactions 
        WHERE transaction_hash = ?
      `;
      
      const [rows] = await db.execute(query, [transactionHash]);
      return rows[0] || null;
    } catch (error) {
      console.error('Error getting transaction by hash:', error);
      throw error;
    }
  }

  // Lấy lịch sử giao dịch của user
  static async getUserTransactions(userAddress, limit = 50, offset = 0) {
    try {
      const query = `
        SELECT 
          t.*,
          w.name as warehouse_name,
          l.area as lease_area,
          l.start_date,
          l.end_date
        FROM transactions t
        LEFT JOIN leases l ON t.transaction_hash = l.transaction_hash
        LEFT JOIN warehouses w ON l.warehouse_id = w.id
        WHERE t.from_address = ?
        ORDER BY t.created_at DESC
        LIMIT ? OFFSET ?
      `;
      
      const [rows] = await db.execute(query, [userAddress, limit, offset]);
      return rows;
    } catch (error) {
      console.error('Error getting user transactions:', error);
      throw error;
    }
  }

  // Lấy tất cả transactions với phân trang
  static async getAllTransactions(limit = 50, offset = 0) {
    try {
      const query = `
        SELECT 
          t.*,
          w.name as warehouse_name,
          l.area as lease_area,
          l.start_date,
          l.end_date
        FROM transactions t
        LEFT JOIN leases l ON t.transaction_hash = l.transaction_hash
        LEFT JOIN warehouses w ON l.warehouse_id = w.id
        ORDER BY t.created_at DESC
        LIMIT ? OFFSET ?
      `;
      
      const [rows] = await db.execute(query, [limit, offset]);
      return rows;
    } catch (error) {
      console.error('Error getting all transactions:', error);
      throw error;
    }
  }

  // Đếm tổng số transactions
  static async getTransactionCount(userAddress = null) {
    try {
      let query = 'SELECT COUNT(*) as total FROM transactions';
      let params = [];
      
      if (userAddress) {
        query += ' WHERE from_address = ?';
        params.push(userAddress);
      }
      
      const [rows] = await db.execute(query, params);
      return rows[0].total;
    } catch (error) {
      console.error('Error getting transaction count:', error);
      throw error;
    }
  }

  // Lấy thống kê transactions theo loại
  static async getTransactionStats() {
    try {
      const query = `
        SELECT 
          type,
          status,
          COUNT(*) as count,
          SUM(amount) as total_amount
        FROM transactions
        GROUP BY type, status
        ORDER BY type, status
      `;
      
      const [rows] = await db.execute(query);
      return rows;
    } catch (error) {
      console.error('Error getting transaction stats:', error);
      throw error;
    }
  }
}

module.exports = TransactionService;
