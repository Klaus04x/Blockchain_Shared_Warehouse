import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Button,
  CircularProgress,
  Chip,
} from '@mui/material';
import {
  Add,
  LocationOn,
  Square,
  AttachMoney,
  Edit,
  Delete,
} from '@mui/icons-material';
import axios from 'axios';
import { ethers } from 'ethers';
import { useWeb3 } from '../contexts/Web3Context';
import { toast } from 'react-toastify';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const MyWarehouses = () => {
  const { account, isConnected } = useWeb3();
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const navigate = useNavigate();

  const fetchMyWarehouses = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/warehouses/owner/${account}`);
      setWarehouses(response.data);
    } catch (error) {
      console.error('Error fetching warehouses:', error);
      toast.error('Không thể tải danh sách kho bãi');
    } finally {
      setLoading(false);
    }
  }, [account]);

  useEffect(() => {
    if (isConnected && account) {
      fetchMyWarehouses();
    } else {
      setLoading(false);
    }
  }, [account, isConnected, fetchMyWarehouses]);

  const formatPrice = (weiPrice) => {
    try {
      const ethPrice = ethers.formatEther(weiPrice.toString());
      return `${parseFloat(ethPrice).toFixed(6)} ETH`;
    } catch (error) {
      return '0 ETH';
    }
  };


  if (!isConnected) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="h5" gutterBottom>
          Vui lòng kết nối ví để xem kho bãi của bạn
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h3" gutterBottom fontWeight="bold">
            Kho bãi của tôi
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Quản lý các kho bãi mà bạn đang cho thuê
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/register-warehouse')}
        >
          Đăng ký kho mới
        </Button>
      </Box>

      {warehouses.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Bạn chưa có kho bãi nào
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/register-warehouse')}
            sx={{ mt: 2 }}
          >
            Đăng ký kho đầu tiên
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {warehouses.map((warehouse) => (
            <Grid item xs={12} sm={6} md={4} key={warehouse.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  transition: 'transform 0.3s, box-shadow 0.3s',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: 6,
                  },
                }}
                onClick={() => navigate(`/warehouse/${warehouse.id}`)}
              >
                <CardMedia
                  component="img"
                  height="200"
                  image={warehouse.image_url || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400'}
                  alt={warehouse.name}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" gutterBottom fontWeight="bold">
                    {warehouse.name}
                  </Typography>

                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <LocationOn fontSize="small" color="action" sx={{ mr: 0.5 }} />
                    <Typography variant="body2" color="text.secondary">
                      {warehouse.location}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Square fontSize="small" color="action" sx={{ mr: 0.5 }} />
                    <Typography variant="body2" color="text.secondary">
                      {warehouse.available_area} / {warehouse.total_area} m² còn trống
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <AttachMoney fontSize="small" color="action" sx={{ mr: 0.5 }} />
                    <Typography variant="body2" color="text.secondary">
                      {formatPrice(warehouse.price_per_sqm_per_day)} / m² / ngày
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                    {warehouse.is_active ? (
                      <Chip label="Hoạt động" color="success" size="small" />
                    ) : (
                      <Chip label="Tạm ngừng" color="default" size="small" />
                    )}
                    {warehouse.available_area === 0 && (
                      <Chip label="Hết chỗ" color="error" size="small" />
                    )}
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<Edit />}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/register-warehouse?editId=${warehouse.id}`);
                      }}
                    >
                      Sửa
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      variant="outlined"
                      startIcon={<Delete />}
                      disabled={deletingId === warehouse.id}
                      onClick={async (e) => {
                        e.stopPropagation();
                        // Xóa cứng theo yêu cầu
                        try {
                          setDeletingId(warehouse.id);
                          await axios.delete(`${API_URL}/warehouses/${warehouse.id}/hard`);
                          toast.success('Đã xóa kho khỏi hệ thống');
                          fetchMyWarehouses();
                        } catch (err) {
                          console.error('Hard delete error:', err);
                          toast.error('Không thể xóa kho');
                        } finally {
                          setDeletingId(null);
                        }
                      }}
                    >
                      Xóa
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default MyWarehouses;


