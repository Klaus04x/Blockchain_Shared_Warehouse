import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Button,
  CircularProgress,
  Grid,
  Divider,
  Breadcrumbs,
  Link as MuiLink,
  Tooltip,
} from '@mui/material';
import {
  LocationOn,
  Square,
  AttachMoney,
  CalendarToday,
  CheckCircle,
  Cancel,
} from '@mui/icons-material';
import axios from 'axios';
import { ethers } from 'ethers';
import { format } from 'date-fns';
import { useWeb3 } from '../contexts/Web3Context';
import { toast } from 'react-toastify';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const MyLeases = () => {
  const { account, isConnected, refreshContract } = useWeb3();
  const [leases, setLeases] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchMyLeases = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/leases/tenant/${account}`);
      setLeases(response.data);
      
    } catch (error) {
      console.error('Error fetching leases:', error);
      toast.error('Không thể tải danh sách hợp đồng');
    } finally {
      setLoading(false);
    }
  }, [account]);

  useEffect(() => {
    if (isConnected && account) {
      fetchMyLeases();
    } else {
      setLoading(false);
    }
  }, [account, isConnected, fetchMyLeases]);

  const handleCompleteLease = async (leaseId, blockchainId) => {
    try {
      // Refresh contract để đảm bảo sử dụng account hiện tại
      const currentContract = await refreshContract();
      if (!currentContract) {
        toast.error('Không thể kết nối với hợp đồng. Vui lòng thử lại.');
        return;
      }
      
      // Kiểm tra quyền trước khi gọi smart contract
      const lease = leases.find(l => l.id === leaseId);
      if (!lease) {
        toast.error('Không tìm thấy hợp đồng');
        return;
      }

      // Kiểm tra xem có phải người thuê không
      console.log('Checking permissions:', {
        lease_tenant: lease.tenant_address,
        current_account: account,
        match: lease.tenant_address.toLowerCase() === account.toLowerCase()
      });
      
      if (lease.tenant_address.toLowerCase() !== account.toLowerCase()) {
        toast.error(`Bạn không có quyền hoàn thành hợp đồng này. Người thuê: ${lease.tenant_address}, Tài khoản hiện tại: ${account}`);
        return;
      }

      console.log('Attempting to complete lease:', { leaseId, blockchainId, account });
      
      // Kiểm tra thông tin hợp đồng trên blockchain trước khi gọi
      try {
        const leaseOnChain = await currentContract.getLease(blockchainId);
        console.log('Lease on blockchain:', {
          id: leaseOnChain.id.toString(),
          tenant: leaseOnChain.tenant,
          isActive: leaseOnChain.isActive,
          isCompleted: leaseOnChain.isCompleted,
          endDate: new Date(Number(leaseOnChain.endDate) * 1000).toLocaleString(),
          startDate: new Date(Number(leaseOnChain.startDate) * 1000).toLocaleString()
        });
        
        // Kiểm tra xem tenant có khớp không
        if (leaseOnChain.tenant === '0x0000000000000000000000000000000000000000') {
          toast.warning(`Hợp đồng không tồn tại trên blockchain! Blockchain ID: ${blockchainId}. Đang hoàn thành trong hệ thống...`);
          console.error('Contract not found on blockchain:', {
            blockchainId,
            leaseOnChain,
            expectedTenant: account
          });
          
          // Hoàn thành trong database mà không cần blockchain
          try {
            await axios.put(`${API_URL}/leases/${leaseId}`, {
              is_active: false,
              is_completed: true,
            });
            toast.success('Đã hoàn thành hợp đồng trong hệ thống!');
            fetchMyLeases();
            return;
          } catch (dbError) {
            console.error('Error completing lease in DB:', dbError);
            toast.error('Không thể hoàn thành hợp đồng trong hệ thống');
            return;
          }
        }
        
        if (leaseOnChain.tenant.toLowerCase() !== account.toLowerCase()) {
          toast.error(`Lỗi quyền hạn: Tenant trên blockchain: ${leaseOnChain.tenant}, Account hiện tại: ${account}`);
          return;
        }

        // Kiểm tra trạng thái hợp đồng
        if (!leaseOnChain.isActive) {
          toast.error('Hợp đồng không còn hoạt động trên blockchain');
          return;
        }

        if (leaseOnChain.isCompleted) {
          toast.error('Hợp đồng đã được hoàn thành trên blockchain');
          return;
        }

        // Kiểm tra thời gian hết hạn
        const currentTime = Math.floor(Date.now() / 1000);
        if (leaseOnChain.endDate > currentTime) {
          toast.error('Không thể hoàn thành hợp đồng trước ngày hết hạn');
          return;
        }

        console.log('Blockchain validation passed, proceeding with completion...');
        
      } catch (chainError) {
        console.error('Error checking lease on blockchain:', chainError);
        toast.error('Không thể kiểm tra thông tin hợp đồng trên blockchain');
        return;
      }
      
      // Gọi smart contract để hoàn thành
      const tx = await currentContract.completeLease(blockchainId);
      toast.info('Đang xử lý trên blockchain...');
      await tx.wait();

      console.log('Smart contract completion successful, updating database...');

      // Cập nhật database sau khi blockchain thành công
      await axios.put(`${API_URL}/leases/${leaseId}`, {
        is_active: false,
        is_completed: true,
      });

      toast.success('Đã hoàn thành hợp đồng trên blockchain và hệ thống!');
      fetchMyLeases();
    } catch (error) {
      console.error('Error completing lease:', error);
      
      // Xử lý các lỗi smart contract cụ thể
      if (error.message && error.message.includes('Lease period not ended')) {
        toast.error('Hợp đồng chưa hết hạn, không thể hoàn thành');
      } else if (error.message && error.message.includes('Not authorized')) {
        toast.error('Bạn không có quyền hoàn thành hợp đồng này trên blockchain');
      } else if (error.message && error.message.includes('Lease is not active')) {
        toast.error('Hợp đồng không còn hoạt động trên blockchain');
      } else if (error.message && error.message.includes('Lease already completed')) {
        toast.error('Hợp đồng đã được hoàn thành trên blockchain');
      } else {
        toast.error(`Không thể hoàn thành hợp đồng trên blockchain: ${error.message || 'Lỗi không xác định'}`);
      }
    }
  };

  const formatPrice = (weiPrice) => {
    try {
      const ethPrice = ethers.formatEther(weiPrice.toString());
      return `${parseFloat(ethPrice).toFixed(6)} ETH`;
    } catch (error) {
      return '0 ETH';
    }
  };

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy');
    } catch (error) {
      return dateString;
    }
  };


  const handleCheckBlockchain = async (leaseId, blockchainId) => {
    try {
      const currentContract = await refreshContract();
      if (!currentContract) {
        toast.error('Không thể kết nối với hợp đồng');
        return;
      }

      console.log('Checking blockchain for lease:', { leaseId, blockchainId });
      
      const leaseOnChain = await currentContract.getLease(blockchainId);
      console.log('Blockchain lease data:', leaseOnChain);
      
      if (leaseOnChain.tenant === '0x0000000000000000000000000000000000000000') {
        toast.warning(`Hợp đồng ID ${blockchainId} không tồn tại trên blockchain!`);
        console.log('Contract not found on blockchain. This could mean:');
        console.log('1. Wrong blockchain_id in database');
        console.log('2. Contract was never created on blockchain');
        console.log('3. Wrong contract address');
        
        // Hiển thị thông tin để debug
        const lease = leases.find(l => l.id === leaseId);
        if (lease) {
          console.log('Database lease info:', {
            id: lease.id,
            blockchain_id: lease.blockchain_id,
            tenant_address: lease.tenant_address,
            warehouse_id: lease.warehouse_id,
            transaction_hash: lease.transaction_hash
          });
        }
      } else {
        toast.success(`Hợp đồng tồn tại trên blockchain! Tenant: ${leaseOnChain.tenant}`);
        console.log('Contract found on blockchain:', {
          tenant: leaseOnChain.tenant,
          isActive: leaseOnChain.isActive,
          isCompleted: leaseOnChain.isCompleted,
          startDate: new Date(Number(leaseOnChain.startDate) * 1000),
          endDate: new Date(Number(leaseOnChain.endDate) * 1000)
        });
      }
    } catch (error) {
      console.error('Error checking blockchain:', error);
      toast.error('Không thể kiểm tra blockchain');
    }
  };

  const isLeaseExpired = (endDate) => {
    return new Date(endDate) < new Date();
  };

  if (!isConnected) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="h5" gutterBottom>
          Vui lòng kết nối ví để xem hợp đồng của bạn
        </Typography>
      </Container>
    );
  }

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 2 }}>
        <Breadcrumbs aria-label="breadcrumb">
          <MuiLink underline="hover" color="inherit" onClick={() => navigate('/')} sx={{ cursor: 'pointer' }}>
            Trang chủ
          </MuiLink>
          <Typography color="text.primary">Hợp đồng của tôi</Typography>
        </Breadcrumbs>
      </Box>
      <Typography variant="h3" gutterBottom fontWeight="bold">Hợp đồng thuê của tôi</Typography>
      <Typography variant="body1" color="text.secondary" paragraph>Quản lý các hợp đồng thuê kho bãi</Typography>

      {leases.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Bạn chưa có hợp đồng thuê nào
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/warehouses')}
            sx={{ mt: 2 }}
          >
            Tìm kho bãi
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {leases.map((lease) => (
            <Grid item xs={12} key={lease.id}>
              <Card sx={{ overflow: 'hidden' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                    <Box>
                      <Typography variant="h5" gutterBottom fontWeight="bold">
                        {lease.warehouse_name}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <LocationOn fontSize="small" color="action" sx={{ mr: 0.5 }} />
                        <Typography variant="body2" color="text.secondary">
                          {lease.location}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {lease.is_completed ? (
                        <Chip
                          icon={<CheckCircle />}
                          label="Đã hoàn thành"
                          color="success"
                        />
                      ) : lease.is_active ? (
                        isLeaseExpired(lease.end_date) ? (
                          <Chip
                            label="Đã hết hạn"
                            color="warning"
                          />
                        ) : (
                          <Chip
                            label="Đang hoạt động"
                            color="primary"
                          />
                        )
                      ) : (
                        <Chip
                          icon={<Cancel />}
                          label="Đã hủy"
                          color="error"
                        />
                      )}
                    </Box>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Square fontSize="small" color="action" sx={{ mr: 0.5 }} />
                        <Typography variant="body2" color="text.secondary">
                          Diện tích
                        </Typography>
                      </Box>
                      <Typography variant="h6" fontWeight="bold">
                        {lease.area} m²
                      </Typography>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <CalendarToday fontSize="small" color="action" sx={{ mr: 0.5 }} />
                        <Typography variant="body2" color="text.secondary">
                          Thời gian
                        </Typography>
                      </Box>
                      <Typography variant="body1" fontWeight="bold">
                        {formatDate(lease.start_date)} - {formatDate(lease.end_date)}
                      </Typography>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <AttachMoney fontSize="small" color="action" sx={{ mr: 0.5 }} />
                        <Typography variant="body2" color="text.secondary">
                          Tổng chi phí
                        </Typography>
                      </Box>
                      <Typography variant="h6" color="primary" fontWeight="bold">
                        {formatPrice(lease.total_price)}
                      </Typography>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => navigate(`/warehouse/${lease.warehouse_id}`)}
                          sx={{ width: '100%' }}
                        >
                          Xem kho bãi
                        </Button>
                        {lease.is_active && !lease.is_completed ? (
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: '100%' }}>
                            <Tooltip 
                              title={isLeaseExpired(lease.end_date) ? "Hoàn thành hợp đồng" : "Hợp đồng chưa hết hạn"}
                              arrow
                            >
                              <span style={{ width: '100%' }}>
                                <Button
                                  variant="contained"
                                  size="small"
                                  disabled={!isLeaseExpired(lease.end_date)}
                                  onClick={() => handleCompleteLease(lease.id, lease.blockchain_id)}
                                  sx={{
                                    width: '100%',
                                    opacity: isLeaseExpired(lease.end_date) ? 1 : 0.5,
                                    cursor: isLeaseExpired(lease.end_date) ? 'pointer' : 'not-allowed',
                                    backgroundColor: isLeaseExpired(lease.end_date) ? '#4caf50' : '#e0e0e0',
                                    color: isLeaseExpired(lease.end_date) ? 'white' : '#666666',
                                    '&:hover': {
                                      backgroundColor: isLeaseExpired(lease.end_date) ? '#45a049' : '#e0e0e0'
                                    }
                                  }}
                                >
                                  Hoàn thành
                                </Button>
                              </span>
                            </Tooltip>
                            <Button
                              variant="outlined"
                              size="small"
                              color="secondary"
                              onClick={() => handleCheckBlockchain(lease.id, lease.blockchain_id)}
                              sx={{ width: '100%' }}
                            >
                              Kiểm tra Blockchain
                            </Button>
                          </Box>
                        ) : null}
                      </Box>
                    </Grid>
                  </Grid>

                  {lease.transaction_hash && (
                    <Box sx={{ mt: 2, p: 1, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Transaction Hash: {lease.transaction_hash}
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default MyLeases;


