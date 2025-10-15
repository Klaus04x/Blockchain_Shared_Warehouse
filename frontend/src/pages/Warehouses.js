import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  TextField,
  InputAdornment,
  Chip,
  Skeleton,
} from '@mui/material';
import { LocationOn, Square, AttachMoney, Search } from '@mui/icons-material';
import axios from 'axios';
import { ethers } from 'ethers';
import { IconButton } from '@mui/material';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Warehouses = () => {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const navigate = useNavigate();
  // removed seeding feature – no web3 needed here

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/warehouses`);
      setWarehouses(response.data);
    } catch (error) {
      console.error('Error fetching warehouses:', error);
    } finally {
      setLoading(false);
    }
  };

  // removed seedWarehouses per request

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      fetchWarehouses();
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/warehouses/search/${searchTerm}`);
      setWarehouses(response.data);
    } catch (error) {
      console.error('Error searching warehouses:', error);
    } finally {
      setLoading(false);
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

  const listToShow = warehouses;

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '20vh',
        }}
      >
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Grid container spacing={3}>
            {Array.from({ length: 9 }).map((_, i) => (
              <Grid item xs={12} sm={6} md={4} key={i}>
                <Card>
                  <Skeleton variant="rectangular" height={200} />
                  <CardContent>
                    <Skeleton width="60%" height={28} />
                    <Skeleton width="80%" />
                    <Skeleton width="40%" />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" gutterBottom fontWeight="bold">
        Danh sách kho bãi
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Danh sách kho bãi hiện có
      </Typography>

      {/* Search */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Tìm kiếm theo tên, địa điểm..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          variant="outlined"
          sx={{
            backgroundColor: '#fff',
            borderRadius: 9999,
            boxShadow: 2,
            '& .MuiOutlinedInput-root': { borderRadius: 9999, px: 1 },
            '& .MuiOutlinedInput-notchedOutline': { border: 'none' }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
            endAdornment: (
              <IconButton color="primary" onClick={handleSearch}>
                <Search />
              </IconButton>
            ),
          }}
        />
      </Box>

      {/* Warehouse Grid */}
      {warehouses.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            Không tìm thấy kho bãi nào
          </Typography>
        </Box>
      ) : (
        <>
          <Grid container spacing={3}>
            {listToShow.map((warehouse) => (
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
                        Còn trống: {warehouse.available_area} / {warehouse.total_area} m²
                      </Typography>
                    </Box>
 
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <AttachMoney fontSize="small" color="action" sx={{ mr: 0.5 }} />
                      <Typography variant="body2" color="text.secondary">
                        {formatPrice(warehouse.price_per_sqm_per_day)} / m² / ngày
                      </Typography>
                    </Box>
 
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {warehouse.available_area > 0 ? (
                        <Chip
                          label="Còn chỗ"
                          color="success"
                          size="small"
                        />
                      ) : (
                        <Chip
                          label="Hết chỗ"
                          color="error"
                          size="small"
                        />
                      )}
                      {warehouse.is_active && (
                        <Chip
                          label="Đang hoạt động"
                          color="primary"
                          size="small"
                        />
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
          
        </>
      )}
    </Container>
  );
};

export default Warehouses;


