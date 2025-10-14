import React, { useState, useEffect } from 'react';
import {
  Container,
  Card,
  CardContent,
  Typography,
  Box,
  TextField,
  Button,
  Grid,
  Avatar,
  Divider,
  CircularProgress,
} from '@mui/material';
import { Person, Save } from '@mui/icons-material';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useWeb3 } from '../contexts/Web3Context';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Profile = () => {
  const { account, isConnected } = useWeb3();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    wallet_address: '',
    name: '',
    email: '',
    phone: '',
    avatar_url: '',
  });

  useEffect(() => {
    if (isConnected && account) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [account, isConnected]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_URL}/users/profile`, {
        wallet_address: account,
      });
      setProfile(response.data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      await axios.put(`${API_URL}/users/profile/${account}`, {
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        avatar_url: profile.avatar_url,
      });

      toast.success('Cập nhật thông tin thành công!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Không thể cập nhật thông tin');
    } finally {
      setSaving(false);
    }
  };

  if (!isConnected) {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="h5" gutterBottom>
          Vui lòng kết nối ví để xem thông tin
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
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Avatar
              src={profile.avatar_url}
              sx={{ width: 80, height: 80, mr: 2 }}
            >
              <Person sx={{ fontSize: 40 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight="bold">
                Thông tin cá nhân
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Quản lý thông tin tài khoản của bạn
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Địa chỉ ví"
                  value={account}
                  disabled
                  helperText="Địa chỉ ví MetaMask của bạn"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Họ và tên"
                  name="name"
                  value={profile.name}
                  onChange={handleChange}
                  placeholder="Nhập họ và tên của bạn"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={profile.email}
                  onChange={handleChange}
                  placeholder="example@email.com"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Số điện thoại"
                  name="phone"
                  value={profile.phone}
                  onChange={handleChange}
                  placeholder="0123456789"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="URL Avatar"
                  name="avatar_url"
                  value={profile.avatar_url}
                  onChange={handleChange}
                  placeholder="https://example.com/avatar.jpg"
                  helperText="Đường dẫn đến hình ảnh avatar của bạn"
                />
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={saving}
                    startIcon={saving ? <CircularProgress size={20} /> : <Save />}
                  >
                    {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
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

export default Profile;


