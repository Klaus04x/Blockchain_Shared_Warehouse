import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Box,
  Menu,
  MenuItem,
  Container,
  Chip
} from '@mui/material';
import {
  Warehouse as WarehouseIcon,
  AccountBalanceWallet,
  Menu as MenuIcon,
  Person,
  Home,
  Assignment,
  Dashboard,
  AddBusiness
} from '@mui/icons-material';
import { useWeb3 } from '../contexts/Web3Context';

const Navbar = () => {
  const { account, isConnected, connectWallet, disconnectWallet, formatAddress } = useWeb3();
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNavigate = (path) => {
    navigate(path);
    handleMenuClose();
  };

  return (
    <AppBar position="sticky" sx={{ backgroundColor: '#1976d2' }}>
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          {/* Logo */}
          <WarehouseIcon sx={{ display: { xs: 'none', md: 'flex' }, mr: 1 }} />
          <Typography
            variant="h6"
            noWrap
            component={Link}
            to="/"
            sx={{
              mr: 2,
              display: { xs: 'none', md: 'flex' },
              fontWeight: 700,
              color: 'inherit',
              textDecoration: 'none',
            }}
          >
            Mạng Chia Sẻ Kho Bãi
          </Typography>

          {/* Mobile menu */}
          <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
            <IconButton
              size="large"
              onClick={handleMenuOpen}
              color="inherit"
            >
              <MenuIcon />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              <MenuItem onClick={() => handleNavigate('/')}>Trang chủ</MenuItem>
              <MenuItem onClick={() => handleNavigate('/warehouses')}>Kho bãi</MenuItem>
              {isConnected && (
                <>
                  <MenuItem onClick={() => handleNavigate('/my-warehouses')}>
                    Kho của tôi
                  </MenuItem>
                  <MenuItem onClick={() => handleNavigate('/my-leases')}>
                    Hợp đồng của tôi
                  </MenuItem>
                  <MenuItem onClick={() => handleNavigate('/register-warehouse')}>
                    Đăng ký kho
                  </MenuItem>
                </>
              )}
            </Menu>
          </Box>

          {/* Mobile logo */}
          <WarehouseIcon sx={{ display: { xs: 'flex', md: 'none' }, mr: 1 }} />
          <Typography
            variant="h6"
            noWrap
            component={Link}
            to="/"
            sx={{
              mr: 2,
              display: { xs: 'flex', md: 'none' },
              flexGrow: 1,
              fontWeight: 700,
              color: 'inherit',
              textDecoration: 'none',
              fontSize: '1rem'
            }}
          >
            Kho Bãi
          </Typography>

          {/* Desktop menu */}
          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' }, gap: 2, alignItems: 'center', flexWrap: 'nowrap' }}>
            <Button
              component={Link}
              to="/"
              startIcon={<Home fontSize="small" />}
              sx={{ my: 1, color: 'white', whiteSpace: 'nowrap', alignItems: 'center' }}
            >
              Trang chủ
            </Button>
            <Button
              component={Link}
              to="/warehouses"
              startIcon={<WarehouseIcon fontSize="small" />}
              sx={{ my: 1, color: 'white', whiteSpace: 'nowrap', alignItems: 'center' }}
            >
              Kho bãi
            </Button>
            {isConnected && (
              <>
                <Button
                  component={Link}
                  to="/my-warehouses"
                  startIcon={<Dashboard fontSize="small" />}
                  sx={{ my: 1, color: 'white', whiteSpace: 'nowrap', alignItems: 'center' }}
                >
                  Kho của tôi
                </Button>
                <Button
                  component={Link}
                  to="/my-leases"
                  startIcon={<Assignment fontSize="small" />}
                  sx={{ my: 1, color: 'white', whiteSpace: 'nowrap', alignItems: 'center' }}
                >
                  Hợp đồng
                </Button>
                <Button
                  component={Link}
                  to="/register-warehouse"
                  startIcon={<AddBusiness fontSize="small" />}
                  sx={{ my: 1, color: 'white', whiteSpace: 'nowrap', alignItems: 'center' }}
                >
                  Đăng ký kho
                </Button>
              </>
            )}
          </Box>

          {/* Wallet connection */}
          <Box sx={{ flexGrow: 0, ml: 'auto' }}>
            {isConnected ? (
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Chip
                  icon={<AccountBalanceWallet />}
                  label={formatAddress(account)}
                  color="success"
                  variant="outlined"
                  sx={{ color: 'white', borderColor: 'white' }}
                />
                <IconButton
                  component={Link}
                  to="/profile"
                  color="inherit"
                >
                  <Person />
                </IconButton>
                <Button
                  color="inherit"
                  variant="outlined"
                  onClick={disconnectWallet}
                  size="small"
                >
                  Ngắt kết nối
                </Button>
              </Box>
            ) : (
              <Button
                variant="contained"
                startIcon={<AccountBalanceWallet />}
                onClick={connectWallet}
                sx={{
                  backgroundColor: 'white',
                  color: '#1976d2',
                  '&:hover': {
                    backgroundColor: '#f5f5f5',
                  },
                }}
              >
                Kết nối ví
              </Button>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navbar;


