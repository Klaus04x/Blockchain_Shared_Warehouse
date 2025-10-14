# Mạng Chia Sẻ Kho Bãi - Warehouse Sharing Network

Nền tảng cho thuê kho bãi phi tập trung, an toàn và minh bạch với công nghệ Blockchain.

## Tổng quan

Dự án này là một nền tảng blockchain cho phép người dùng:
- Đăng ký và cho thuê kho bãi
- Tìm kiếm và thuê không gian lưu trữ
- Ký hợp đồng thông minh (Smart Contract) minh bạch
- Thanh toán trực tiếp qua MetaMask

## Công nghệ sử dụng

### Frontend
- **ReactJS** - UI Framework
- **Material-UI** - Component Library
- **Ethers.js** - Ethereum Library
- **Axios** - HTTP Client
- **React Router** - Routing

### Backend
- **Node.js** - Runtime Environment
- **Express** - Web Framework
- **MySQL** - Database (XAMPP)
- **Ethers.js** - Blockchain Integration

### Smart Contract
- **Solidity** - Smart Contract Language
- **Hardhat** - Development Environment
- **OpenZeppelin** - Security Libraries

### Blockchain
- **MetaMask** - Wallet Integration
- **Ethereum** - Blockchain Platform

## Cấu trúc dự án

```
Blockchain/Final/
├── smart-contract/          # Smart contracts
│   ├── contracts/          # Solidity contracts
│   ├── scripts/            # Deploy scripts
│   └── hardhat.config.js   # Hardhat configuration
├── backend/                # Node.js backend
│   ├── controllers/        # Controllers
│   ├── routes/            # API routes
│   ├── config/            # Configuration
│   └── server.js          # Main server file
├── frontend/              # React frontend
│   ├── public/            # Static files
│   └── src/
│       ├── components/    # React components
│       ├── pages/         # Page components
│       ├── contexts/      # React contexts
│       └── contracts/     # Contract ABIs
├── database/              # Database files
│   ├── warehouse_sharing.sql  # SQL schema
│   └── README.md         # Database setup guide
└── README.md             # This file
```

## Yêu cầu hệ thống

- Node.js v16 trở lên
- XAMPP (MySQL)
- MetaMask Browser Extension
- Git

## Hướng dẫn cài đặt

### 1. Clone repository

```bash
git clone <repository-url>
cd Final
```

### 2. Cài đặt dependencies

```bash
# Cài đặt tất cả dependencies
npm run install-all

# Hoặc cài đặt từng phần
npm install                    # Root
cd smart-contract && npm install
cd ../backend && npm install
cd ../frontend && npm install
```

### 3. Thiết lập Database

#### Khởi động XAMPP
1. Mở XAMPP Control Panel
2. Start Apache và MySQL

#### Import Database
1. Mở phpMyAdmin: `http://localhost/phpmyadmin`
2. Click tab "Import"
3. Chọn file `database/warehouse_sharing.sql`
4. Click "Go" để import

Hoặc sử dụng command line:
```bash
cd database
mysql -u root < warehouse_sharing.sql
```

### 4. Cấu hình Backend

Tạo file `.env` trong thư mục `backend/`:

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=warehouse_sharing
DB_PORT=3306

CONTRACT_ADDRESS=
RPC_URL=http://127.0.0.1:8545
```

### 5. Khởi động Hardhat Node

Mở terminal mới:

```bash
cd smart-contract
npx hardhat node
```

Lưu lại một private key từ output để dùng trong MetaMask.

### 6. Deploy Smart Contract

Mở terminal mới:

```bash
cd smart-contract
npm run deploy
```

Contract sẽ được deploy và ABI files sẽ được tự động copy vào `frontend/src/contracts/` và `backend/contracts/`.

Lưu lại địa chỉ contract được in ra console.

### 7. Cấu hình Frontend

Tạo file `.env` trong thư mục `frontend/`:

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_CONTRACT_ADDRESS=<địa_chỉ_contract_vừa_deploy>
REACT_APP_NETWORK_ID=1337
```

### 8. Cấu hình MetaMask

#### Thêm Local Network
1. Mở MetaMask
2. Click vào network dropdown
3. Chọn "Add Network"
4. Nhập thông tin:
   - Network Name: `Localhost 8545`
   - New RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `1337`
   - Currency Symbol: `ETH`

#### Import Account
1. Click vào account icon
2. Chọn "Import Account"
3. Paste private key từ Hardhat node
4. Import

### 9. Khởi động ứng dụng

#### Terminal 1 - Backend
```bash
cd backend
npm run dev
```

Backend sẽ chạy tại: `http://localhost:5000`

#### Terminal 2 - Frontend
```bash
cd frontend
npm start
```

Frontend sẽ chạy tại: `http://localhost:3000`

## Sử dụng

### 1. Kết nối ví MetaMask
- Mở ứng dụng tại `http://localhost:3000`
- Click "Kết nối ví" trên navbar
- Approve kết nối trong MetaMask

### 2. Đăng ký kho bãi
- Click "Đăng ký kho" trên navbar
- Điền thông tin kho bãi:
  - Tên kho
  - Địa điểm
  - Diện tích
  - Giá thuê (ETH/m²/ngày)
  - Hình ảnh (optional)
  - Mô tả (optional)
- Click "Đăng ký kho bãi"
- Confirm transaction trong MetaMask

### 3. Tìm và thuê kho
- Browse danh sách kho tại "Kho bãi"
- Click vào kho để xem chi tiết
- Click "Thuê ngay"
- Nhập:
  - Diện tích cần thuê
  - Thời gian thuê (ngày)
- Xem tổng chi phí
- Click "Xác nhận thuê"
- Confirm transaction trong MetaMask

### 4. Quản lý
- **Kho của tôi**: Xem các kho bạn đang cho thuê
- **Hợp đồng**: Xem các hợp đồng thuê của bạn
- **Profile**: Cập nhật thông tin cá nhân

## API Endpoints

### Warehouses
- `GET /api/warehouses` - Lấy tất cả kho bãi
- `GET /api/warehouses/:id` - Lấy chi tiết kho
- `GET /api/warehouses/owner/:address` - Lấy kho theo chủ sở hữu
- `POST /api/warehouses` - Tạo kho mới
- `PUT /api/warehouses/:id` - Cập nhật kho
- `GET /api/warehouses/search/:keyword` - Tìm kiếm kho

### Leases
- `GET /api/leases` - Lấy tất cả hợp đồng
- `GET /api/leases/:id` - Lấy chi tiết hợp đồng
- `GET /api/leases/tenant/:address` - Lấy hợp đồng theo người thuê
- `GET /api/leases/warehouse/:warehouseId` - Lấy hợp đồng theo kho
- `POST /api/leases` - Tạo hợp đồng mới
- `PUT /api/leases/:id` - Cập nhật hợp đồng

### Users
- `POST /api/users/profile` - Lấy/tạo profile
- `GET /api/users/:address` - Lấy user theo địa chỉ
- `PUT /api/users/profile/:address` - Cập nhật profile

## Smart Contract Functions

### Warehouse Management
- `registerWarehouse()` - Đăng ký kho mới
- `updateWarehouse()` - Cập nhật thông tin kho
- `getWarehouse()` - Lấy thông tin kho
- `getAllActiveWarehouses()` - Lấy tất cả kho hoạt động
- `getOwnerWarehouses()` - Lấy kho theo chủ sở hữu

### Lease Management
- `createLease()` - Tạo hợp đồng thuê
- `completeLease()` - Hoàn thành hợp đồng
- `cancelLease()` - Hủy hợp đồng
- `getLease()` - Lấy thông tin hợp đồng
- `getTenantLeases()` - Lấy hợp đồng theo người thuê

### Admin Functions
- `setPlatformFeePercent()` - Cài đặt phí nền tảng
- `withdrawFees()` - Rút phí về ví owner

## Tính năng chính

### 🏢 Quản lý kho bãi
- Đăng ký kho bãi mới với thông tin chi tiết
- Cập nhật thông tin kho
- Theo dõi diện tích còn trống
- Upload hình ảnh kho

### 📝 Hợp đồng thông minh
- Tạo hợp đồng tự động trên blockchain
- Thanh toán trực tiếp qua smart contract
- Minh bạch và không thể chỉnh sửa
- Phí nền tảng 2%

### 🔍 Tìm kiếm và lọc
- Tìm kiếm theo tên, địa điểm
- Lọc theo diện tích, giá
- Xem chi tiết kho bãi

### 💳 Thanh toán
- Thanh toán bằng ETH
- Tự động tính toán chi phí
- Giao dịch an toàn qua MetaMask

### 📊 Dashboard
- Quản lý kho của bạn
- Theo dõi hợp đồng thuê
- Xem lịch sử giao dịch

## Bảo mật

- Smart contract được audit với OpenZeppelin
- ReentrancyGuard cho các function nhạy cảm
- Kiểm tra quyền sở hữu
- Validation đầy đủ

## Troubleshooting

### MetaMask không kết nối được
- Kiểm tra network đã đúng chưa (Localhost 8545)
- Refresh trang và thử lại
- Xóa cache MetaMask

### Transaction failed
- Kiểm tra balance trong ví có đủ không
- Kiểm tra gas limit
- Xem console log để biết lỗi chi tiết

### Database connection error
- Kiểm tra MySQL đã start chưa
- Kiểm tra thông tin trong `.env`
- Import lại database

### Contract not found
- Kiểm tra đã deploy contract chưa
- Kiểm tra địa chỉ contract trong `.env`
- Kiểm tra ABI file đã được copy chưa

## License

MIT License

## Liên hệ

Nếu có bất kỳ câu hỏi nào, vui lòng liên hệ qua:
- Email: thanh04xx@gmail.com
- GitHub Issues: [Create an issue]

## Credits

Developed with ❤️ using:
- React
- Node.js
- Solidity
- Hardhat
- MySQL
- Material-UI

---

**Happy Coding! 🚀**


