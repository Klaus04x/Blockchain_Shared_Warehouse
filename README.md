# Mạng Chia Sẻ Kho Bãi - Warehouse Sharing Network

Nền tảng cho thuê kho bãi phi tập trung, an toàn và minh bạch với công nghệ Blockchain.

## 🚀 Quick Start

```bash
# 1. Cài đặt dependencies
npm run install-all

# 2. Setup database (import database/warehouse_sharing.sql vào MySQL)

# 3. Cấu hình backend/.env và frontend/.env (xem hướng dẫn bên dưới)

# 4. Chạy tất cả (Hardhat + Backend + Frontend) bằng 1 lệnh
npm run dev:all

# 5. Import private key vào MetaMask (xem trong terminal output)

# 6. Truy cập http://localhost:3000
```

**Chỉ cần 1 lệnh `npm run dev:all` và tất cả sẽ tự động khởi động!** ✨

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

### 5. Cấu hình Frontend

Tạo file `.env` trong thư mục `frontend/`:

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_NETWORK_ID=1337
```

**Lưu ý:** Contract address sẽ tự động được load từ file contract JSON sau khi deploy.

### 6. Cấu hình MetaMask

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
3. Paste private key từ Hardhat node (xem bên dưới)
4. Import

### 7. Khởi động ứng dụng

**🚀 CÁCH ĐƠN GIẢN NHẤT - CHỈ CẦN 1 LỆNH:**

```bash
npm run dev:all
```

Lệnh này sẽ tự động:
1. ✅ Khởi động Hardhat Node (http://127.0.0.1:8545)
2. ✅ Đợi node sẵn sàng và tự động deploy smart contract
3. ✅ Khởi động Backend (http://localhost:5000)
4. ✅ Khởi động Frontend (http://localhost:3000)

**Lưu ý quan trọng:**
- Khi terminal hiển thị danh sách accounts, **copy Private Key của Account #0** để import vào MetaMask
- Ví dụ: `Private key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
- Giữ terminal này chạy trong suốt quá trình phát triển

**Hoặc chạy thủ công từng phần (nếu cần):**

```bash
# Terminal 1 - Hardhat Node
npm run node

# Terminal 2 - Deploy Contract (chờ 2-3 giây sau khi node khởi động)
npm run deploy

# Terminal 3 - Backend
cd backend && npm run dev

# Terminal 4 - Frontend
cd frontend && npm start
```

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

### ❌ Lỗi: "Không thể kết nối blockchain"

**Nguyên nhân:** Hardhat node chưa chạy hoặc contract chưa được deploy.

**Giải pháp:**
```bash
# Kiểm tra blockchain
node check-blockchain.js

# Nếu lỗi "ECONNREFUSED", restart lại:
npm run dev:all
```

### ❌ Lỗi: "Transaction reverted" hoặc "<unrecognized-selector>"

**Nguyên nhân:** Contract ABI không khớp hoặc chưa được compile đúng.

**Giải pháp:**
```bash
# Compile và deploy lại contract
cd smart-contract
npx hardhat clean
npx hardhat compile
npx hardhat run scripts/deploy.js --network localhost

# Sau đó restart frontend
cd ../frontend
npm start
```

### ❌ Lỗi: "Nonce too high" hoặc "Transaction dropped"

**Nguyên nhân:** MetaMask cache lỗi hoặc transaction cũ bị stuck.

**Giải pháp:**
1. Mở MetaMask
2. Settings → Advanced
3. Click **"Clear activity tab data"** hoặc **"Reset Account"**
4. Reload trang web (Ctrl + Shift + R)

### ❌ MetaMask không kết nối được
- Kiểm tra network đã đúng chưa: **Localhost 8545** (Chain ID: 1337)
- Kiểm tra RPC URL: `http://127.0.0.1:8545`
- Refresh trang và thử lại
- Reset account trong MetaMask

### ❌ Transaction failed / Insufficient funds
- Kiểm tra balance trong ví có đủ không (cần ít nhất 0.01 ETH)
- Nếu dùng account Hardhat mặc định sẽ có 10,000 ETH
- Kiểm tra gas limit
- Xem console log (F12) để biết lỗi chi tiết

### ❌ Database connection error
- Kiểm tra MySQL đã start trong XAMPP chưa
- Kiểm tra thông tin trong `backend/.env`
- Import lại database từ `database/warehouse_sharing.sql`

### ❌ Port đã được sử dụng
```bash
# Windows: Tìm và kill process đang dùng port
netstat -ano | findstr :8545
taskkill /PID <process_id> /F

# Hoặc đổi port khác trong smart-contract/hardhat.config.js
```

### 🔍 Kiểm tra blockchain

Sử dụng script kiểm tra tự động:
```bash
node check-blockchain.js
```

Script này sẽ kiểm tra:
- ✅ RPC connection
- ✅ Smart contract status  
- ✅ Warehouse counter
- ✅ Database sync

### 📝 Lệnh hữu ích

```bash
# Kiểm tra blockchain
node check-blockchain.js

# Compile contracts
npm run compile-contracts

# Deploy contract
npm run deploy

# Start Hardhat node
npm run node

# Start tất cả
npm run dev:all
```

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


