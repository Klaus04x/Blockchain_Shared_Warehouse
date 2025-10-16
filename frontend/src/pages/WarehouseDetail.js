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
  const { account, isConnected, refreshContract } = useWeb3();

  const [warehouse, setWarehouse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openLeaseDialog, setOpenLeaseDialog] = useState(false);
  const [leaseData, setLeaseData] = useState({
    area: '',
    duration: '',
  });
  const [processing, setProcessing] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);
  const [showDebug, setShowDebug] = useState(false);

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

  // Theo dõi sự thay đổi của account để hiển thị thông báo
  useEffect(() => {
    if (account && isConnected) {
      console.log('Current account:', account);
    }
  }, [account, isConnected]);

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
      
      // Refresh contract để đảm bảo sử dụng account hiện tại
      const currentContract = await refreshContract();
      if (!currentContract) {
        toast.error('Không thể kết nối với hợp đồng. Vui lòng thử lại.');
        setProcessing(false);
        return;
      }
      
      // Kiểm tra on-chain: kho tồn tại và còn hoạt động
      try {
        // Kiểm tra blockchain_id hợp lệ
        if (!warehouse.blockchain_id || warehouse.blockchain_id === 0) {
          console.warn('Warehouse chưa có blockchain_id, bỏ qua kiểm tra on-chain');
          toast.warning('Kho này chưa được đăng ký trên blockchain. Tiếp tục với dữ liệu database...');
        } else {
          console.log('Checking warehouse on blockchain:', warehouse.blockchain_id);
          const onchainWarehouse = await currentContract.getWarehouse(warehouse.blockchain_id);
          console.log('On-chain warehouse data:', onchainWarehouse);
          
          // Khi chưa có trên chain, owner sẽ là address(0) hoặc isActive = false
          if (!onchainWarehouse || onchainWarehouse.owner === ethers.ZeroAddress || !onchainWarehouse.isActive) {
            toast.error('Kho này chưa tồn tại hoặc không hoạt động trên blockchain. Vui lòng đăng ký kho mới rồi thử thuê.');
            setProcessing(false);
            return;
          }
          const avail = ethers.toBigInt(onchainWarehouse.availableArea ?? 0);
          const req = ethers.toBigInt(leaseData.area);
          if (req > avail) {
            toast.error(`Diện tích yêu cầu vượt quá diện tích còn trống (trên blockchain). Cần: ${leaseData.area}m², Có sẵn: ${avail.toString()}m²`);
            setProcessing(false);
            return;
          }
        }
      } catch (chainErr) {
        console.error('On-chain warehouse check failed:', chainErr);
        
        // Phân tích lỗi chi tiết
        if (chainErr.message?.includes('call revert exception')) {
          toast.error('Kho này không tồn tại trên blockchain. Vui lòng đăng ký kho trước khi thuê.');
        } else if (chainErr.message?.includes('network')) {
          toast.error('Lỗi kết nối blockchain. Vui lòng kiểm tra Hardhat node và thử lại.');
        } else if (chainErr.message?.includes('contract')) {
          toast.error('Lỗi kết nối hợp đồng. Vui lòng kiểm tra contract address và thử lại.');
        } else {
          toast.warning('Không thể kiểm tra kho trên blockchain. Tiếp tục với dữ liệu database...');
        }
        
        // Không dừng lại, tiếp tục với database validation
        console.log('Continuing with database validation only...');
      }
      
      const totalPrice = calculateTotalPrice();
      
      // Lưu thông tin debug
      const paymentDetails = {
        warehouseId: warehouse.blockchain_id,
        area: leaseData.area,
        duration: leaseData.duration,
        totalPrice: totalPrice.toString(),
        account: account,
        timestamp: new Date().toISOString()
      };
      console.log('Payment details:', paymentDetails);
      setDebugInfo(paymentDetails);

      // Kiểm tra số dư trước khi gửi giao dịch
      try {
        const balance = await currentContract.runner.provider.getBalance(account);
        console.log('Account balance:', ethers.formatEther(balance));
        if (balance < totalPrice) {
          toast.error(`Số dư không đủ. Cần: ${ethers.formatEther(totalPrice)} ETH, Có: ${ethers.formatEther(balance)} ETH`);
          setProcessing(false);
          return;
        }
      } catch (balanceErr) {
        console.error('Balance check failed:', balanceErr);
        toast.warning('Không thể kiểm tra số dư. Tiếp tục giao dịch...');
      }

      // Lấy gas settings tối ưu
      let gasSettings = {};
      try {
        const feeData = await currentContract.runner.provider.getFeeData();
        console.log('Gas fee data:', {
          gasPrice: ethers.formatUnits(feeData.gasPrice, 'gwei') + ' Gwei',
          maxFee: ethers.formatUnits(feeData.maxFeePerGas, 'gwei') + ' Gwei',
          maxPriorityFee: ethers.formatUnits(feeData.maxPriorityFeePerGas, 'gwei') + ' Gwei'
        });

        // Sử dụng EIP-1559 gas settings cho localhost
        gasSettings = {
          value: totalPrice,
          maxFeePerGas: feeData.maxFeePerGas ? feeData.maxFeePerGas * 2n : ethers.parseUnits('20', 'gwei'), // Tăng gấp đôi để tránh dropped
          maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ? feeData.maxPriorityFeePerGas * 2n : ethers.parseUnits('2', 'gwei'),
          gasLimit: 500000 // Gas limit cao để đảm bảo không bị out of gas
        };
      } catch (gasErr) {
        console.warn('Failed to get fee data, using fallback gas settings:', gasErr);
        // Fallback gas settings cho localhost
        gasSettings = {
          value: totalPrice,
          gasPrice: ethers.parseUnits('20', 'gwei'), // 20 Gwei cho localhost
          gasLimit: 500000
        };
      }

      console.log('Using gas settings:', gasSettings);

      // Gọi smart contract với gas settings tối ưu
      const tx = await currentContract.createLease(
        warehouse.blockchain_id,
        leaseData.area,
        leaseData.duration,
        gasSettings
      );

      console.log('Transaction sent:', tx.hash);
      toast.info(`Đang xử lý giao dịch... Hash: ${tx.hash.substring(0, 10)}...`);
      const receipt = await tx.wait();

      // Lấy lease ID từ event
      const event = receipt.logs.find((log) => {
        try {
          const parsed = currentContract.interface.parseLog(log);
          return parsed.name === 'LeaseCreated';
        } catch (e) {
          return false;
        }
      });

      let leaseId = 0;
      if (event) {
        const parsed = currentContract.interface.parseLog(event);
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
      
      // Phân tích lỗi chi tiết
      let errorMessage = 'Không thể tạo hợp đồng thuê';
      
      if (error.code === 'INSUFFICIENT_FUNDS') {
        errorMessage = 'Số dư không đủ để thực hiện giao dịch';
      } else if (error.code === 'USER_REJECTED') {
        errorMessage = 'Bạn đã hủy giao dịch';
      } else if (error.code === 'NETWORK_ERROR') {
        errorMessage = 'Lỗi mạng. Vui lòng kiểm tra kết nối và thử lại';
      } else if (error.message?.includes('Warehouse is not active')) {
        errorMessage = 'Kho này không còn hoạt động';
      } else if (error.message?.includes('Invalid area')) {
        errorMessage = 'Diện tích không hợp lệ';
      } else if (error.message?.includes('Insufficient payment')) {
        errorMessage = 'Số tiền thanh toán không đủ';
      } else if (error.message?.includes('Duration must be greater than 0')) {
        errorMessage = 'Thời gian thuê phải lớn hơn 0';
      } else if (error.reason) {
        errorMessage = `Lỗi: ${error.reason}`;
      }
      
      toast.error(errorMessage);
      
      // Log chi tiết để debug
      console.log('Error details:', {
        code: error.code,
        message: error.message,
        reason: error.reason,
        data: error.data
      });
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

              {/* Debug Panel */}
              {debugInfo && (
                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setShowDebug(!showDebug)}
                    sx={{ width: '100%' }}
                  >
                    {showDebug ? 'Ẩn' : 'Hiện'} Debug Info
                  </Button>
                  {showDebug && (
                    <Box sx={{ mt: 1, p: 1, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                      <Typography variant="caption" display="block">
                        <strong>Account:</strong> {account}
                      </Typography>
                      <Typography variant="caption" display="block">
                        <strong>Warehouse ID:</strong> {debugInfo.warehouseId}
                      </Typography>
                      <Typography variant="caption" display="block">
                        <strong>Area:</strong> {debugInfo.area}m²
                      </Typography>
                      <Typography variant="caption" display="block">
                        <strong>Duration:</strong> {debugInfo.duration} ngày
                      </Typography>
                      <Typography variant="caption" display="block">
                        <strong>Total Price:</strong> {ethers.formatEther(debugInfo.totalPrice)} ETH
                      </Typography>
                      <Typography variant="caption" display="block">
                        <strong>Time:</strong> {new Date(debugInfo.timestamp).toLocaleString()}
                      </Typography>
                    </Box>
                  )}
                </Box>
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


