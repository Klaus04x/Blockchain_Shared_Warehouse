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
} from '@mui/material';
import { AddBusiness } from '@mui/icons-material';
import axios from 'axios';
import { ethers } from 'ethers';
import { toast } from 'react-toastify';
import { useWeb3 } from '../contexts/Web3Context';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const RegisterWarehouse = () => {
  const { contract, account, isConnected } = useWeb3();
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
      const priceInWei = ethers.parseEther(formData.pricePerSqmPerDay);

      if (editId) {
        // Update on-chain nếu có thể (cùng owner)
        try {
          const current = await axios.get(`${API_URL}/warehouses/${editId}`);
          await (await contract.updateWarehouse(
            Number(current.data.blockchain_id),
            formData.name,
            formData.location,
            priceInWei,
            formData.imageUrl || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d',
            formData.description,
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
          image_url: formData.imageUrl,
          description: formData.description,
          is_active: 1
        });
        toast.success('Cập nhật kho thành công!');
        navigate('/my-warehouses');
      } else {
        // Create on-chain
        const tx = await contract.registerWarehouse(
          formData.name,
          formData.location,
          formData.totalArea,
          priceInWei,
          formData.imageUrl || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d',
          formData.description
        );
        toast.info('Đang xử lý giao dịch...');
        const receipt = await tx.wait();
        const event = receipt.logs.find((log) => {
          try { const parsed = contract.interface.parseLog(log); return parsed.name === 'WarehouseRegistered'; } catch { return false; }
        });
        let warehouseId = 0;
        if (event) {
          const parsed = contract.interface.parseLog(event);
          warehouseId = parsed.args.warehouseId.toString();
        }
        await axios.post(`${API_URL}/warehouses`, {
          blockchain_id: warehouseId,
          owner_address: account,
          name: formData.name,
          location: formData.location,
          total_area: formData.totalArea,
          available_area: formData.totalArea,
          price_per_sqm_per_day: priceInWei.toString(),
          image_url: formData.imageUrl || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d',
          description: formData.description,
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
                    helperText="Bạn có thể dán URL hoặc chọn file để tải lên"
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
                  placeholder="Mô tả về kho bãi của bạn..."
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


