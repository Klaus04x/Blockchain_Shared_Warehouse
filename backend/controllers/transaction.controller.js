const TransactionService = require('../services/transaction');

class TransactionController {
  // Lấy lịch sử giao dịch của user hiện tại
  static async getUserTransactions(req, res) {
    try {
      const { address } = req.params;
      const { page = 1, limit = 20 } = req.query;
      
      const offset = (page - 1) * limit;
      const transactions = await TransactionService.getUserTransactions(address, parseInt(limit), offset);
      const total = await TransactionService.getTransactionCount(address);
      
      res.json({
        success: true,
        data: {
          transactions,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / limit),
            totalItems: total,
            itemsPerPage: parseInt(limit)
          }
        }
      });
    } catch (error) {
      console.error('Error getting user transactions:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy lịch sử giao dịch',
        error: error.message
      });
    }
  }

  // Lấy tất cả transactions (admin)
  static async getAllTransactions(req, res) {
    try {
      const { page = 1, limit = 20 } = req.query;
      
      const offset = (page - 1) * limit;
      const transactions = await TransactionService.getAllTransactions(parseInt(limit), offset);
      const total = await TransactionService.getTransactionCount();
      
      res.json({
        success: true,
        data: {
          transactions,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / limit),
            totalItems: total,
            itemsPerPage: parseInt(limit)
          }
        }
      });
    } catch (error) {
      console.error('Error getting all transactions:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách giao dịch',
        error: error.message
      });
    }
  }

  // Lấy thống kê transactions
  static async getTransactionStats(req, res) {
    try {
      const stats = await TransactionService.getTransactionStats();
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error getting transaction stats:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy thống kê giao dịch',
        error: error.message
      });
    }
  }

  // Lấy chi tiết transaction
  static async getTransactionDetail(req, res) {
    try {
      const { hash } = req.params;
      
      const transaction = await TransactionService.getTransactionByHash(hash);
      
      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy giao dịch'
        });
      }
      
      res.json({
        success: true,
        data: transaction
      });
    } catch (error) {
      console.error('Error getting transaction detail:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy chi tiết giao dịch',
        error: error.message
      });
    }
  }

  // Cập nhật trạng thái transaction (webhook từ blockchain)
  static async updateTransactionStatus(req, res) {
    try {
      const { hash } = req.params;
      const { status, blockNumber } = req.body;
      
      const updated = await TransactionService.updateTransactionStatus(hash, status, blockNumber);
      
      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy giao dịch để cập nhật'
        });
      }
      
      res.json({
        success: true,
        message: 'Cập nhật trạng thái giao dịch thành công'
      });
    } catch (error) {
      console.error('Error updating transaction status:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi cập nhật trạng thái giao dịch',
        error: error.message
      });
    }
  }
}

module.exports = TransactionController;
