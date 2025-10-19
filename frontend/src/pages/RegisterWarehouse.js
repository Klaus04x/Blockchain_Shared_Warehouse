import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Container,
  Card,
  CardContent,
  Typography,
  Box,
  TextField,
  Button,
  Grid,
  CircularProgress,
  Stack,
  Breadcrumbs,
  Link as MuiLink,
} from '@mui/material';
import { AddBusiness } from '@mui/icons-material';
import axios from 'axios';
import { ethers } from 'ethers';
import { toast } from 'react-toastify';
import { useWeb3 } from '../contexts/Web3Context';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const RegisterWarehouse = () => {
  const { account, isConnected, refreshContract } = useWeb3();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [processing, setProcessing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    totalArea: '',
    pricePerSqmPerDay: '',
    imageUrl: '',
    description: '',
  });
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    const id = searchParams.get('editId');
    if (id) {
      setEditId(id);
      (async () => {
        try {
          const { data } = await axios.get(`${API_URL}/warehouses/${id}`);
          setFormData({
            name: data.name || '',
            location: data.location || '',
            totalArea: data.total_area?.toString() || '',
            pricePerSqmPerDay: data.price_per_sqm_per_day ? ethers.formatEther(data.price_per_sqm_per_day.toString()) : '',
            imageUrl: data.image_url || '',
            description: data.description || ''
          });
        } catch (e) {
          console.error('Load warehouse for edit failed:', e);
        }
      })();
    }
  }, [searchParams]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const form = new FormData();
      form.append('image', file);
      const res = await fetch(`${API_URL.replace('/api','')}/api/upload/image`, {
        method: 'POST',
        body: form
      });
      const data = await res.json();
      if (data?.url) {
        const absolute = `${API_URL.replace('/api','')}${data.url}`.replace(/\/$/, '');
        setFormData((s) => ({ ...s, imageUrl: absolute }));
        setPreviewUrl(absolute);
        toast.success('Tải ảnh lên thành công');
      } else {
        toast.error('Tải ảnh thất bại');
      }
    } catch (err) {
      console.error('Upload image error:', err);
      toast.error('Không thể tải ảnh');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log('=== START WAREHOUSE REGISTRATION ===');
    console.log('Account:', account);
    console.log('isConnected:', isConnected);
    console.log('Form data:', formData);

    if (!isConnected) {
      toast.error('Vui lòng kết nối ví MetaMask');
      return;
    }

    if (!formData.name || !formData.location || !formData.totalArea || !formData.pricePerSqmPerDay) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    try {
      setProcessing(true);
      
      console.log('🔄 Refreshing contract...');
      // Refresh contract để đảm bảo sử dụng account hiện tại
      const currentContract = await refreshContract();
      if (!currentContract) {
        console.error('❌ refreshContract returned null');
        toast.error('Không thể kết nối với hợp đồng. Vui lòng thử lại.');
        setProcessing(false);
        return;
      }
      console.log('✅ Contract refreshed:', currentContract.target);
      console.log('✅ Signer address:', await currentContract.runner.getAddress());
      
      // Validate và clean data - FORCE limit to prevent blockchain errors
      let cleanDescription = (formData.description || '').trim();
      let cleanImageUrl = (formData.imageUrl || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d').trim();
      
      // STRICT limit: max 100 characters for description
      if (cleanDescription.length > 100) {
        console.warn('⚠️ Description too long! Truncating from', cleanDescription.length, 'to 100 characters');
        cleanDescription = cleanDescription.substring(0, 100);
        toast.warning('Mô tả quá dài! Đã được cắt xuống 100 ký tự. Vui lòng rút gọn mô tả.', { autoClose: 5000 });
      }
      
      // Limit imageUrl to prevent large transaction data (increased to 300 chars)
      if (cleanImageUrl.length > 300) {
        cleanImageUrl = cleanImageUrl.substring(0, 300);
      }
      
      // Ensure strings are safe for blockchain (keep Vietnamese characters but remove problematic ones)
      // Chỉ loại bỏ các ký tự có thể gây lỗi blockchain, giữ lại tiếng Việt
      cleanDescription = cleanDescription.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ''); // Remove control characters only
      cleanImageUrl = cleanImageUrl.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ''); // Remove control characters only
      
      console.log('📝 Cleaned data:');
      console.log('  Description length:', cleanDescription.length, 'chars');
      console.log('  Description:', cleanDescription);
      console.log('  ImageUrl length:', cleanImageUrl.length, 'chars');
      
      const priceInWei = ethers.parseEther(formData.pricePerSqmPerDay);

      if (editId) {
        // Update on-chain nếu có thể (cùng owner)
        try {
          const current = await axios.get(`${API_URL}/warehouses/${editId}`);
          await (await currentContract.updateWarehouse(
            Number(current.data.blockchain_id),
            formData.name,
            formData.location,
            priceInWei,
            cleanImageUrl,
            cleanDescription,
            true
          )).wait();
        } catch (err) {
          console.warn('Update on-chain failed (maybe different owner):', err);
        }
        await axios.put(`${API_URL}/warehouses/${editId}`, {
          name: formData.name,
          location: formData.location,
          available_area: formData.totalArea,
          price_per_sqm_per_day: priceInWei.toString(),
          image_url: cleanImageUrl,
          description: cleanDescription,
          is_active: 1
        });
        toast.success('Cập nhật kho thành công!');
        navigate('/my-warehouses');
      } else {
        // Gas settings cho Hardhat (legacy transaction)
        // Hardhat node không hỗ trợ EIP-1559, chỉ dùng gasPrice
        const gasSettings = {
          gasPrice: ethers.parseUnits('20', 'gwei'),
          gasLimit: 1000000  // Tăng gas limit để tránh lỗi
        };
        console.log('Gas settings (legacy):', gasSettings);

        // Kiểm tra kết nối blockchain và contract
        try {
          console.log('\n📡 Checking blockchain connection...');
          
          // Kiểm tra network
          const network = await currentContract.runner.provider.getNetwork();
          console.log('✅ Network:', {
            chainId: network.chainId.toString(),
            name: network.name
          });
          
          if (network.chainId !== 1337n) {
            console.error('❌ Wrong network! Expected 1337, got', network.chainId.toString());
            toast.error('Vui lòng chuyển sang mạng Localhost 8545 (Chain ID: 1337)');
            setProcessing(false);
            return;
          }
          
          // Kiểm tra contract có hoạt động không
          const currentCounter = await currentContract.warehouseCounter();
          console.log('✅ Warehouse counter:', currentCounter.toString());
          
          // Kiểm tra balance
          const balance = await currentContract.runner.provider.getBalance(account);
          console.log('✅ Account balance:', ethers.formatEther(balance), 'ETH');
          
          if (balance < ethers.parseEther('0.01')) {
            console.error('❌ Insufficient balance:', ethers.formatEther(balance));
            toast.error('Không đủ ETH để thực hiện giao dịch. Vui lòng nạp thêm ETH.');
            setProcessing(false);
            return;
          }
          
          console.log('✅ All checks passed! Proceeding with transaction...');
          
        } catch (e) {
          console.error('❌ Blockchain connection error:', e);
          console.error('Error details:', {
            message: e.message,
            code: e.code,
            stack: e.stack
          });
          toast.error('Lỗi kết nối blockchain. Vui lòng kiểm tra Hardhat network và thử lại.');
          setProcessing(false);
          return;
        }

        // Create on-chain với gas settings
        console.log('\n🚀 Calling registerWarehouse with:');
        console.log('  Name:', formData.name);
        console.log('  Location:', formData.location);
        console.log('  Total Area:', formData.totalArea);
        console.log('  Price (Wei):', priceInWei.toString());
        console.log('  Price (ETH):', ethers.formatEther(priceInWei));
        console.log('  Gas settings:', gasSettings);
        
        let tx, receipt;
        try {
          console.log('\n⏳ Sending transaction to blockchain...');
          tx = await currentContract.registerWarehouse(
            formData.name,
            formData.location,
            formData.totalArea,
            priceInWei,
            cleanImageUrl,
            cleanDescription,
            gasSettings
          );
          toast.info('Đang xử lý giao dịch...');
          receipt = await tx.wait();
        } catch (txError) {
          console.error('Transaction error:', txError);
          console.error('Error code:', txError.code);
          console.error('Error message:', txError.message);
          console.error('Error data:', txError.data);
          
          // Xử lý các loại lỗi cụ thể
          if (txError.code === 'ACTION_REJECTED' || txError.code === 4001) {
            toast.error('Bạn đã từ chối giao dịch trong MetaMask');
          } else if (txError.code === 'NETWORK_ERROR' || txError.message.includes('JSON-RPC') || txError.code === -32603) {
            toast.error('Lỗi kết nối blockchain. Vui lòng kiểm tra Hardhat network và thử lại.');
            console.error('JSON-RPC Error details:', {
              code: txError.code,
              message: txError.message,
              data: txError.data
            });
          } else if (txError.code === 'INSUFFICIENT_FUNDS' || txError.code === -32000) {
            toast.error('Không đủ ETH để thực hiện giao dịch. Vui lòng nạp thêm ETH.');
          } else if (txError.code === 'UNPREDICTABLE_GAS_LIMIT') {
            toast.error('Lỗi ước tính gas. Có thể giao dịch sẽ thất bại. Vui lòng kiểm tra lại thông tin.');
          } else if (txError.code === 'NONCE_EXPIRED' || txError.message.includes('nonce')) {
            toast.error('Lỗi nonce. Vui lòng reset MetaMask account (Settings → Advanced → Reset Account)');
          } else if (txError.message.includes('execution reverted')) {
            // Extract revert reason nếu có
            const reason = txError.reason || txError.data?.message || 'không xác định';
            toast.error(`Giao dịch bị từ chối bởi smart contract: ${reason}`);
          } else {
            // Hiển thị lỗi chi tiết hơn
            const errorMsg = txError.shortMessage || txError.message || 'Lỗi không xác định';
            toast.error(`Lỗi giao dịch: ${errorMsg}`);
            
            // Gợi ý khắc phục
            toast.info('💡 Thử: 1) Reset MetaMask account, 2) Reload trang, 3) Kiểm tra console log (F12)', {
              autoClose: 8000
            });
          }
          return;
        }
        
        console.log('Transaction receipt:', receipt);
        console.log('Transaction status:', receipt.status);
        console.log('Transaction logs:', receipt.logs);
        
        // Kiểm tra transaction có thành công không
        if (receipt.status !== 1) {
          console.error('Transaction failed!');
          toast.error('Giao dịch thất bại trên blockchain');
          return;
        }
        
        // Debug tất cả logs
        console.log('All logs:');
        receipt.logs.forEach((log, index) => {
          console.log(`Log ${index}:`, log);
          try {
            const parsed = currentContract.interface.parseLog(log);
            console.log(`Parsed log ${index}:`, parsed);
          } catch (e) {
            console.log(`Error parsing log ${index}:`, e.message);
          }
        });
        
        const event = receipt.logs.find((log) => {
          try { 
            const parsed = currentContract.interface.parseLog(log); 
            console.log('Checking log:', parsed.name);
            return parsed.name === 'WarehouseRegistered'; 
          } catch (e) { 
            console.log('Error parsing log:', e.message);
            return false; 
          }
        });
        
        let warehouseId = 0;
        if (event) {
          const parsed = currentContract.interface.parseLog(event);
          warehouseId = parsed.args.warehouseId.toString();
          console.log('✅ Warehouse ID from event:', warehouseId);
        } else {
          console.error('❌ WarehouseRegistered event not found!');
          console.log('Available events:', receipt.logs.map(log => {
            try {
              const parsed = currentContract.interface.parseLog(log);
              return parsed.name;
            } catch (e) {
              return 'Unknown';
            }
          }));
          
          // Thử lấy warehouse ID từ warehouseCounter
          try {
            const warehouseCounter = await currentContract.warehouseCounter();
            warehouseId = warehouseCounter.toString();
            console.log('Using warehouseCounter as fallback:', warehouseId);
            
            // Kiểm tra warehouse có tồn tại không
            if (warehouseId === '0') {
              console.error('No warehouses found on blockchain');
              toast.error('Không có warehouse nào trên blockchain');
              return;
            }
          } catch (e) {
            console.error('Error getting warehouseCounter:', e);
            
            // Thử cách khác - kiểm tra transaction có thực sự thành công không
            try {
              const tx = await currentContract.runner.provider.getTransaction(receipt.transactionHash);
              console.log('Transaction details:', tx);
              
              if (tx && tx.data) {
                console.log('Transaction data:', tx.data);
                // Có thể transaction không thực sự gọi được contract
                toast.error('Giao dịch không thể gọi smart contract');
                return;
              }
            } catch (txError) {
              console.error('Error getting transaction details:', txError);
            }
            
            toast.error('Không thể lấy warehouse ID từ blockchain');
            return;
          }
        }
        
        // Kiểm tra warehouse có tồn tại trên blockchain không
        try {
          const createdWarehouse = await currentContract.getWarehouse(warehouseId);
          console.log('✅ Warehouse created on blockchain:', {
            id: createdWarehouse.id.toString(),
            owner: createdWarehouse.owner,
            name: createdWarehouse.name,
            isActive: createdWarehouse.isActive
          });
          
          // Kiểm tra owner có đúng không
          if (createdWarehouse.owner.toLowerCase() !== account.toLowerCase()) {
            console.warn('⚠️ Warehouse owner mismatch!');
            console.warn('Expected:', account);
            console.warn('Actual:', createdWarehouse.owner);
          }
        } catch (e) {
          console.error('Error verifying warehouse on blockchain:', e);
          toast.error('Không thể xác minh warehouse trên blockchain');
          return;
        }
        
        console.log('Saving to database with blockchain_id:', warehouseId);
        await axios.post(`${API_URL}/warehouses`, {
          blockchain_id: warehouseId,
          owner_address: account,
          name: formData.name,
          location: formData.location,
          total_area: formData.totalArea,
          available_area: formData.totalArea,
          price_per_sqm_per_day: priceInWei.toString(),
          image_url: cleanImageUrl,
          description: cleanDescription,
        });
        
        toast.success('Đăng ký kho bãi thành công!');
        navigate('/my-warehouses');
      }
    } catch (error) {
      console.error('Error registering/updating warehouse:', error);
      toast.error('Không thể xử lý yêu cầu');
    } finally {
      setProcessing(false);
    }
  };

  if (!isConnected) {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="h5" gutterBottom>
          Vui lòng kết nối ví để đăng ký/sửa kho bãi
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ mb: 2 }}>
        <Breadcrumbs aria-label="breadcrumb">
          <MuiLink underline="hover" color="inherit" onClick={() => navigate('/')} sx={{ cursor: 'pointer' }}>
            Trang chủ
          </MuiLink>
          <MuiLink underline="hover" color="inherit" onClick={() => navigate('/my-warehouses')} sx={{ cursor: 'pointer' }}>
            Kho của tôi
          </MuiLink>
          <Typography color="text.primary">{editId ? 'Cập nhật' : 'Đăng ký'}</Typography>
        </Breadcrumbs>
      </Box>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <AddBusiness sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
            <Box>
              <Typography variant="h4" fontWeight="bold">
                {editId ? 'Cập nhật kho bãi' : 'Đăng ký kho bãi mới'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {editId ? 'Chỉnh sửa thông tin kho bãi' : 'Đăng ký kho bãi của bạn để cho thuê'}
              </Typography>
            </Box>
          </Box>

          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Tên kho bãi *"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Địa điểm *"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  required
                  placeholder="VD: TP. Hồ Chí Minh, Quận 1"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Tổng diện tích (m²) *"
                  name="totalArea"
                  type="number"
                  value={formData.totalArea}
                  onChange={handleChange}
                  required
                  inputProps={{ min: 1 }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Giá thuê (ETH/m²/ngày) *"
                  name="pricePerSqmPerDay"
                  type="number"
                  value={formData.pricePerSqmPerDay}
                  onChange={handleChange}
                  required
                  inputProps={{ min: 0, step: '0.000001' }}
                  helperText="VD: 0.00005"
                />
              </Grid>

              <Grid item xs={12}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                  <Button variant="outlined" component="label" disabled={uploading}>
                    {uploading ? 'Đang tải ảnh...' : 'Chọn ảnh từ máy'}
                    <input type="file" accept="image/*" hidden onChange={handleFileChange} />
                  </Button>
                  <TextField
                    fullWidth
                    label="URL hình ảnh"
                    name="imageUrl"
                    value={formData.imageUrl}
                    onChange={handleChange}
                    placeholder="https://example.com/image.jpg"
                    helperText="Bạn có thể dán URL hoặc chọn file để tải lên (tối đa 300 ký tự)"
                  />
                </Stack>
                {previewUrl && (
                  <Box sx={{ mt: 2 }}>
                    <img src={previewUrl} alt="preview" style={{ maxWidth: '100%', borderRadius: 8 }} />
                  </Box>
                )}
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Mô tả"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  multiline
                  rows={4}
                  placeholder="Mô tả về kho bãi của bạn (tối đa 100 ký tự)..."
                  inputProps={{ maxLength: 100 }}
                  helperText={`${formData.description?.length || 0}/100 ký tự (Lưu ý: Mô tả quá dài sẽ gây lỗi blockchain)`}
                  error={formData.description?.length > 100}
                />
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/my-warehouses')}
                    disabled={processing}
                  >
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={processing}
                    startIcon={processing ? <CircularProgress size={20} /> : <AddBusiness />}
                  >
                    {processing ? 'Đang xử lý...' : (editId ? 'Lưu thay đổi' : 'Đăng ký kho bãi')}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Container>
  );
};

export default RegisterWarehouse;


