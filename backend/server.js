const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
const warehouseRoutes = require('./routes/warehouse.routes');
const leaseRoutes = require('./routes/lease.routes');
const userRoutes = require('./routes/user.routes');
const uploadRoutes = require('./routes/upload.routes');
const transactionRoutes = require('./routes/transaction.routes');

app.use('/api/warehouses', warehouseRoutes);
app.use('/api/leases', leaseRoutes);
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/transactions', transactionRoutes);

// Serve static uploads
app.use('/uploads', express.static(require('path').join(__dirname, 'uploads')));

// Root redirect
app.get('/', (req, res) => {
  res.redirect('/api');
});

// Base API index
app.get('/api', (req, res) => {
  res.json({
    name: 'Warehouse Sharing API',
    status: 'OK',
    routes: ['/api/health', '/api/warehouses', '/api/leases', '/api/users', '/api/transactions']
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Warehouse Sharing API is running' });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: err.message 
  });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`API: http://localhost:${PORT}/api`);
});

// Xử lý lỗi port đã được sử dụng - chỉ báo lỗi một lần
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`❌ Port ${PORT} đang được sử dụng. Vui lòng chạy: npm run kill-all`);
    process.exit(1);
  } else {
    console.error('❌ Lỗi server:', err.message);
    process.exit(1);
  }
});

module.exports = app;

