import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Pagination
} from '@mui/material';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const TransactionHistory = ({ userAddress }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching transactions for user:', userAddress);
      
      const response = await axios.get(`${API_URL}/transactions/user/${userAddress}`, {
        params: {
          page: currentPage,
          limit: itemsPerPage
        }
      });

      console.log('Transaction API response:', response.data);

      if (response.data.success) {
        setTransactions(response.data.data.transactions);
        setTotalPages(response.data.data.pagination.totalPages);
        setTotalItems(response.data.data.pagination.totalItems);
      } else {
        setError('Không thể tải lịch sử giao dịch');
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError(`Lỗi khi tải lịch sử giao dịch: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [userAddress, currentPage]);

  useEffect(() => {
    if (userAddress) {
      fetchTransactions();
    }
  }, [userAddress, fetchTransactions]);

  const getTransactionTypeLabel = (type) => {
    const labels = {
      'register_warehouse': 'Đăng ký kho',
      'create_lease': 'Tạo hợp đồng',
      'complete_lease': 'Hoàn thành hợp đồng',
      'cancel_lease': 'Hủy hợp đồng'
    };
    return labels[type] || type;
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'warning',
      'success': 'success',
      'failed': 'error'
    };
    return colors[status] || 'default';
  };

  const getStatusLabel = (status) => {
    const labels = {
      'pending': 'Đang xử lý',
      'success': 'Thành công',
      'failed': 'Thất bại'
    };
    return labels[status] || status;
  };

  const formatAmount = (amount) => {
    if (!amount || amount === '0') return '0 ETH';
    const ethAmount = parseFloat(amount) / 1e18;
    return `${ethAmount.toFixed(6)} ETH`;
  };

  const formatDate = (dateString) => {
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: vi });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Địa chỉ ví: {userAddress}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            API URL: {API_URL}
          </Typography>
        </Box>
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Lịch sử giao dịch
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Tổng cộng: {totalItems} giao dịch
      </Typography>

      {transactions.length === 0 ? (
        <Card>
          <CardContent>
            <Typography variant="body1" color="text.secondary" textAlign="center">
              Chưa có giao dịch nào
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <>
          <TableContainer component={Paper} sx={{ mb: 3 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Loại giao dịch</TableCell>
                  <TableCell>Trạng thái</TableCell>
                  <TableCell>Số tiền</TableCell>
                  <TableCell>Kho bãi</TableCell>
                  <TableCell>Thời gian</TableCell>
                  <TableCell>Hash</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.map((tx, index) => (
                  <TableRow key={tx.id}>
                    <TableCell>
                      <Chip 
                        label={getTransactionTypeLabel(tx.type)}
                        color="primary"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={getStatusLabel(tx.status)}
                        color={getStatusColor(tx.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {formatAmount(tx.amount)}
                    </TableCell>
                    <TableCell>
                      {tx.warehouse_name || '-'}
                    </TableCell>
                    <TableCell>
                      {formatDate(tx.created_at)}
                    </TableCell>
                    <TableCell>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontFamily: 'monospace',
                          fontSize: '0.75rem',
                          maxWidth: '150px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                        title={tx.transaction_hash}
                      >
                        {tx.transaction_hash}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={3}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={(event, page) => setCurrentPage(page)}
                color="primary"
              />
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default TransactionHistory;
