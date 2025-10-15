import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Chip,
  Divider,
  Breadcrumbs,
  Link as MuiLink,
} from '@mui/material';
import {
  LocationOn,
  Square,
  AttachMoney,
  Person,
} from '@mui/icons-material';
import axios from 'axios';
import { ethers } from 'ethers';
import { toast } from 'react-toastify';
import { useWeb3 } from '../contexts/Web3Context';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const WarehouseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { contract, account, isConnected } = useWeb3();

  const [warehouse, setWarehouse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openLeaseDialog, setOpenLeaseDialog] = useState(false);
  const [leaseData, setLeaseData] = useState({
    area: '',
    duration: '',
  });
  const [processing, setProcessing] = useState(false);

  const fetchWarehouseDetail = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/warehouses/${id}`);
      setWarehouse(response.data);
    } catch (error) {
      console.error('Error fetching warehouse:', error);
      toast.error('Không thể tải thông tin kho bãi');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchWarehouseDetail();
  }, [fetchWarehouseDetail]);

  const calculateTotalPrice = () => {
    if (!warehouse || !leaseData.area || !leaseData.duration) return 0;
    const pricePerDay = ethers.toBigInt(warehouse.price_per_sqm_per_day);
    const area = ethers.toBigInt(leaseData.area);
    const duration = ethers.toBigInt(leaseData.duration);
    return pricePerDay * area * duration;
  };

  const handleCreateLease = async () => {
    if (!isConnected) {
      toast.error('Vui lòng kết nối ví MetaMask');
      return;
    }

    if (!leaseData.area || !leaseData.duration) {
      toast.error('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    if (parseFloat(leaseData.area) > warehouse.available_area) {
      toast.error('Diện tích vượt quá diện tích còn trống');
      return;
    }

    try {
      setProcessing(true);
    // Kiểm tra on-chain: kho tồn tại và còn hoạt động
    if (!contract) {
      toast.error('Không tìm thấy kết nối hợp đồng. Vui lòng kết nối ví.');
      setProcessing(false);
      return;
    }
    try {
      const onchainWarehouse = await contract.getWarehouse(warehouse.blockchain_id);
      // Khi chưa có trên chain, owner sẽ là address(0) hoặc isActive = false
      if (!onchainWarehouse || onchainWarehouse.owner === ethers.ZeroAddress || !onchainWarehouse.isActive) {
        toast.error('Kho này chưa tồn tại hoặc không hoạt động trên blockchain. Vui lòng đăng ký kho mới rồi thử thuê.');
        setProcessing(false);
        return;
      }
      const avail = ethers.toBigInt(onchainWarehouse.availableArea ?? 0);
      const req = ethers.toBigInt(leaseData.area);
      if (req > avail) {
        toast.error('Diện tích yêu cầu vượt quá diện tích còn trống (trên blockchain).');
        setProcessing(false);
        return;
      }
    } catch (chainErr) {
      console.error('On-chain warehouse check failed:', chainErr);
    }
      const totalPrice = calculateTotalPrice();

      // Gọi smart contract
      const tx = await contract.createLease(
        warehouse.blockchain_id,
        leaseData.area,
        leaseData.duration,
        { value: totalPrice }
      );

      toast.info('Đang xử lý giao dịch...');
      const receipt = await tx.wait();

      // Lấy lease ID từ event
      const event = receipt.logs.find((log) => {
        try {
          const parsed = contract.interface.parseLog(log);
          return parsed.name === 'LeaseCreated';
        } catch (e) {
          return false;
        }
      });

      let leaseId = 0;
      if (event) {
        const parsed = contract.interface.parseLog(event);
        leaseId = parsed.args.leaseId.toString();
      }

      // Lưu vào database
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + parseInt(leaseData.duration));

      await axios.post(`${API_URL}/leases`, {
        blockchain_id: leaseId,
        warehouse_id: warehouse.id,
        tenant_address: account,
        area: leaseData.area,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        total_price: totalPrice.toString(),
        transaction_hash: receipt.hash,
      });

      toast.success('Tạo hợp đồng thuê thành công!');
      setOpenLeaseDialog(false);
      navigate('/my-leases');
    } catch (error) {
      console.error('Error creating lease:', error);
      toast.error('Không thể tạo hợp đồng thuê');
    } finally {
      setProcessing(false);
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

  if (!warehouse) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="h5">Không tìm thấy kho bãi</Typography>
        <Button onClick={() => navigate('/warehouses')} sx={{ mt: 2 }}>
          Quay lại danh sách
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 2 }}>
        <Breadcrumbs aria-label="breadcrumb">
          <MuiLink underline="hover" color="inherit" onClick={() => navigate('/')} sx={{ cursor: 'pointer' }}>
            Trang chủ
          </MuiLink>
          <MuiLink underline="hover" color="inherit" onClick={() => navigate('/warehouses')} sx={{ cursor: 'pointer' }}>
            Kho bãi
          </MuiLink>
          <Typography color="text.primary">Chi tiết</Typography>
        </Breadcrumbs>
      </Box>
      <Grid container spacing={4}>
        <Grid item xs={12} md={8}>
          <Card>
            <Box
              component="img"
              src={warehouse.image_url || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d'}
              alt={warehouse.name}
              sx={{ width: '100%', height: 400, objectFit: 'cover' }}
            />
            <CardContent>
              <Typography variant="h4" gutterBottom fontWeight="bold">
                {warehouse.name}
              </Typography>

              <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                {warehouse.is_active && (
                  <Chip label="Đang hoạt động" color="primary" />
                )}
                {warehouse.available_area > 0 ? (
                  <Chip label="Còn chỗ" color="success" />
                ) : (
                  <Chip label="Hết chỗ" color="error" />
                )}
              </Box>

              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <LocationOn color="action" sx={{ mr: 1 }} />
                  <Typography variant="body1">
                    <strong>Địa điểm:</strong> {warehouse.location}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Square color="action" sx={{ mr: 1 }} />
                  <Typography variant="body1">
                    <strong>Diện tích:</strong> {warehouse.total_area} m² 
                    (Còn trống: {warehouse.available_area} m²)
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <AttachMoney color="action" sx={{ mr: 1 }} />
                  <Typography variant="body1">
                    <strong>Giá thuê:</strong> {formatPrice(warehouse.price_per_sqm_per_day)} / m² / ngày
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Person color="action" sx={{ mr: 1 }} />
                  <Typography variant="body1">
                    <strong>Chủ sở hữu:</strong> {warehouse.owner_address?.substring(0, 10)}...
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" gutterBottom fontWeight="bold">
                Mô tả
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                {warehouse.description || 'Chưa có mô tả'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ position: 'sticky', top: 80 }}>
            <CardContent>
              <Typography variant="h5" gutterBottom fontWeight="bold">
                Đặt thuê kho
              </Typography>

              <Box sx={{ mb: 3 }}>
                <Typography variant="h4" color="primary" fontWeight="bold">
                  {formatPrice(warehouse.price_per_sqm_per_day)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  mỗi m² / ngày
                </Typography>
              </Box>

              {warehouse.available_area > 0 ? (
                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  onClick={() => setOpenLeaseDialog(true)}
                  disabled={!isConnected || warehouse.owner_address === account}
                >
                  {!isConnected
                    ? 'Kết nối ví để thuê'
                    : warehouse.owner_address === account
                    ? 'Đây là kho của bạn'
                    : 'Thuê ngay'}
                </Button>
              ) : (
                <Button variant="contained" fullWidth size="large" disabled>
                  Hết chỗ
                </Button>
              )}

              {!isConnected && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: 'block', mt: 2, textAlign: 'center' }}
                >
                  Vui lòng kết nối ví MetaMask để thuê kho
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Lease Dialog */}
      <Dialog open={openLeaseDialog} onClose={() => setOpenLeaseDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Tạo hợp đồng thuê</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Diện tích thuê (m²)"
              type="number"
              value={leaseData.area}
              onChange={(e) => setLeaseData({ ...leaseData, area: e.target.value })}
              inputProps={{ min: 1, max: warehouse.available_area }}
              sx={{ mb: 2 }}
              helperText={`Tối đa: ${warehouse.available_area} m²`}
            />

            <TextField
              fullWidth
              label="Thời gian thuê (ngày)"
              type="number"
              value={leaseData.duration}
              onChange={(e) => setLeaseData({ ...leaseData, duration: e.target.value })}
              inputProps={{ min: 1 }}
              sx={{ mb: 2 }}
            />

            {leaseData.area && leaseData.duration && (
              <Box sx={{ p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Tổng chi phí
                </Typography>
                <Typography variant="h5" color="primary" fontWeight="bold">
                  {formatPrice(calculateTotalPrice())}
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenLeaseDialog(false)} disabled={processing}>
            Hủy
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateLease}
            disabled={processing || !leaseData.area || !leaseData.duration}
          >
            {processing ? <CircularProgress size={24} /> : 'Xác nhận thuê'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default WarehouseDetail;


