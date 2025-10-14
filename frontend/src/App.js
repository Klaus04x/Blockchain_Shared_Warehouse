import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { Web3Provider } from './contexts/Web3Context';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Warehouses from './pages/Warehouses';
import WarehouseDetail from './pages/WarehouseDetail';
import MyWarehouses from './pages/MyWarehouses';
import MyLeases from './pages/MyLeases';
import RegisterWarehouse from './pages/RegisterWarehouse';
import Profile from './pages/Profile';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Web3Provider>
        <Router>
          <div className="App">
            <Navbar />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/warehouses" element={<Warehouses />} />
              <Route path="/warehouse/:id" element={<WarehouseDetail />} />
              <Route path="/my-warehouses" element={<MyWarehouses />} />
              <Route path="/my-leases" element={<MyLeases />} />
              <Route path="/register-warehouse" element={<RegisterWarehouse />} />
              <Route path="/profile" element={<Profile />} />
            </Routes>
            <ToastContainer position="top-right" autoClose={3000} />
          </div>
        </Router>
      </Web3Provider>
    </ThemeProvider>
  );
}

export default App;


