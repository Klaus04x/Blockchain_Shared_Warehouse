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
  const { account, isConnected } = useWeb3();
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
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => navigate(`/warehouse/${lease.warehouse_id}`)}
                        sx={{ width: '100%' }}
                      >
                        Xem kho bãi
                      </Button>
                      {lease.is_active === 1 && lease.is_completed === 0 && (
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', textAlign: 'center' }}>
                          ⏰ Hợp đồng sẽ tự động hoàn thành khi hết hạn
                        </Typography>
                      )}
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


