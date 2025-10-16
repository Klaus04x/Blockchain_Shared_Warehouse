import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  Grid,
  Card,
} from '@mui/material';
import {
  Warehouse,
  Security,
  Speed,
  TrendingUp,
} from '@mui/icons-material';

const Home = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Warehouse sx={{ fontSize: 60, color: '#1976d2' }} />,
      title: 'Kho bãi đa dạng',
      description: 'Hàng trăm kho bãi với diện tích và vị trí khác nhau',
    },
    {
      icon: <Security sx={{ fontSize: 60, color: '#1976d2' }} />,
      title: 'An toàn bảo mật',
      description: 'Hợp đồng thông minh trên blockchain đảm bảo minh bạch',
    },
    {
      icon: <Speed sx={{ fontSize: 60, color: '#1976d2' }} />,
      title: 'Giao dịch nhanh',
      description: 'Đăng ký và thuê kho chỉ trong vài phút',
    },
    {
      icon: <TrendingUp sx={{ fontSize: 60, color: '#1976d2' }} />,
      title: 'Chi phí tối ưu',
      description: 'Tiết kiệm chi phí với mô hình chia sẻ',
    },
  ];

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          py: 8,
          minHeight: '500px',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h2" component="h1" gutterBottom fontWeight="bold">
                Mạng Chia Sẻ Kho Bãi
              </Typography>
              <Typography variant="h5" paragraph sx={{ mb: 4 }}>
                Nền tảng cho thuê kho bãi phi tập trung, an toàn và minh bạch
                với công nghệ Blockchain
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigate('/warehouses')}
                  sx={{
                    backgroundColor: 'white',
                    color: '#667eea',
                    '&:hover': {
                      backgroundColor: '#f5f5f5',
                    },
                  }}
                >
                  Tìm kho bãi
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate('/register-warehouse')}
                  sx={{
                    color: 'white',
                    borderColor: 'white',
                    '&:hover': {
                      borderColor: 'white',
                      backgroundColor: 'rgba(255,255,255,0.1)',
                    },
                  }}
                >
                  Đăng ký cho thuê
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                component="img"
                src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600"
                alt="Warehouse"
                sx={{
                  width: '100%',
                  borderRadius: 2,
                  boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
                }}
              />
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h3" align="center" gutterBottom fontWeight="bold">
          Tại sao chọn chúng tôi?
        </Typography>
        <Typography
          variant="h6"
          align="center"
          color="text.secondary"
          paragraph
          sx={{ mb: 6 }}
        >
          Giải pháp toàn diện cho nhu cầu lưu trữ của bạn
        </Typography>

        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  p: 3,
                  transition: 'transform 0.3s',
                  '&:hover': {
                    transform: 'translateY(-10px)',
                    boxShadow: 6,
                  },
                }}
              >
                <Box sx={{ mb: 2 }}>{feature.icon}</Box>
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  {feature.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {feature.description}
                </Typography>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* How it works */}
      <Box sx={{ backgroundColor: '#f5f5f5', py: 8 }}>
        <Container maxWidth="lg">
          <Typography variant="h3" align="center" gutterBottom fontWeight="bold">
            Cách thức hoạt động
          </Typography>
          <Typography
            variant="h6"
            align="center"
            color="text.secondary"
            paragraph
            sx={{ mb: 6 }}
          >
            Đơn giản và dễ dàng chỉ với 3 bước
          </Typography>

          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Card sx={{ p: 3, height: '100%' }}>
                <Box
                  sx={{
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    backgroundColor: '#1976d2',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 24,
                    fontWeight: 'bold',
                    mb: 2,
                  }}
                >
                  1
                </Box>
                <Typography variant="h5" gutterBottom fontWeight="bold">
                  Kết nối ví MetaMask
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Kết nối ví MetaMask của bạn để bắt đầu sử dụng nền tảng
                </Typography>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card sx={{ p: 3, height: '100%' }}>
                <Box
                  sx={{
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    backgroundColor: '#1976d2',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 24,
                    fontWeight: 'bold',
                    mb: 2,
                  }}
                >
                  2
                </Box>
                <Typography variant="h5" gutterBottom fontWeight="bold">
                  Tìm kiếm kho bãi
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Browse qua danh sách kho bãi và chọn kho phù hợp với nhu cầu
                </Typography>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card sx={{ p: 3, height: '100%' }}>
                <Box
                  sx={{
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    backgroundColor: '#1976d2',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 24,
                    fontWeight: 'bold',
                    mb: 2,
                  }}
                >
                  3
                </Box>
                <Typography variant="h5" gutterBottom fontWeight="bold">
                  Ký hợp đồng
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Ký hợp đồng thông minh và thanh toán trực tiếp qua blockchain
                </Typography>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          py: 8,
        }}
      >
        <Container maxWidth="md" sx={{ textAlign: 'center' }}>
          <Typography variant="h3" gutterBottom fontWeight="bold">
            Sẵn sàng bắt đầu?
          </Typography>
          <Typography variant="h6" paragraph sx={{ mb: 4 }}>
            Tham gia cùng hàng trăm doanh nghiệp đang sử dụng nền tảng của chúng tôi
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/warehouses')}
            sx={{
              backgroundColor: 'white',
              color: '#667eea',
              px: 4,
              py: 1.5,
              fontSize: '1.1rem',
              '&:hover': {
                backgroundColor: '#f5f5f5',
              },
            }}
          >
            Khám phá ngay
          </Button>
        </Container>
      </Box>
    </Box>
  );
};

export default Home;


