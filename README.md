# 🏭 Blockchain Warehouse Sharing Network

**Mạng chia sẻ kho bãi sử dụng công nghệ Blockchain** - Nền tảng chia sẻ kho bãi phi tập trung với smart contract và Web3.

## 🌟 Tính năng chính

- ✅ **Đăng ký kho bãi** trên blockchain với thông tin chi tiết
- ✅ **Thuê kho bãi** thông qua smart contract
- ✅ **Quản lý kho bãi** của bạn một cách minh bạch
- ✅ **Thanh toán ETH** tự động qua blockchain
- ✅ **Lưu trữ persistent** - không bao giờ mất dữ liệu khi restart
- ✅ **Giao diện thân thiện** với Material-UI
- ✅ **Hỗ trợ tiếng Việt** hoàn toàn

## 🚀 Cài đặt nhanh

### 1. Clone repository
```bash
git clone https://github.com/Klaus04x/Blockchain_Shared_Warehouse
cd Blockchain_Shared_Warehouse
```

### 2. Cài đặt dependencies
```bash
npm run install-all
```

### 3. Thiết lập database
```bash
# Import database schema
mysql -u root -p < database/warehouse_sharing.sql
```

### 4. Chạy ứng dụng
```bash
# Cách tốt nhất - với persistent blockchain
npm run dev:all:preserve

# Nếu gặp lỗi port, kill trước
npm run kill-all
npm run dev:all:preserve

# Nếu warehouses không sync, chạy sync thủ công
npm run sync-warehouses
```

## 🎯 Cách sử dụng

### ⭐ **Cách chạy tốt nhất (Khuyến nghị)**

```bash
# Chạy ứng dụng với persistent blockchain
npm run dev:all:preserve

# Nếu gặp lỗi port
npm run kill-all
npm run dev:all:preserve

# Nếu warehouses không sync
npm run sync-warehouses
```

**Tính năng Persistent Blockchain:**
- 🛡️ **Lưu trạng thái blockchain** vào thư mục `hardhat-data`
- 📋 **Lưu địa chỉ contract** để tái sử dụng
- 🔄 **Tự động sync warehouses** từ database (AUTO SYNC)
- ✅ **Kiểm tra contract** trước khi sử dụng
- 🚀 **Deploy contract mới** chỉ khi cần thiết
- 💾 **KHÔNG BAO GIỜ MẤT DỮ LIỆU** khi restart
- 🤖 **Tự động phát hiện** và sửa blockchain issues

### 🔧 **Scripts quản lý**

```bash
# Xem thông tin contract đã lưu
npm run contract-info

# Kiểm tra contract có hoạt động không
npm run contract-check

# Xóa contract đã lưu (để deploy lại)
npm run contract-clear
```

## 🛠️ Cấu trúc dự án

```
Blockchain_Shared_Warehouse/
├── 📁 backend/                 # Backend API (Node.js + Express)
│   ├── controllers/           # Controllers cho các routes
│   ├── routes/               # API routes
│   ├── services/             # Business logic
│   └── contracts/            # Smart contract ABI
├── 📁 frontend/               # Frontend (React + Material-UI)
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── pages/           # Các trang chính
│   │   ├── contexts/        # Web3 context
│   │   └── contracts/       # Smart contract ABI
├── 📁 smart-contract/         # Smart contracts (Solidity + Hardhat)
│   ├── contracts/            # Solidity contracts
│   ├── scripts/              # Deploy scripts
│   └── hardhat-data/         # Persistent blockchain state
├── 📁 database/              # Database schema
├── 🔧 contract-address-manager.js    # Quản lý địa chỉ contract
└── 🔧 persistent-blockchain-manager.js # Quản lý blockchain persistent
```

## 🔗 Smart Contract

### Contract: `WarehouseLeasing.sol`

**Tính năng:**
- `registerWarehouse()` - Đăng ký kho bãi mới
- `getWarehouse()` - Lấy thông tin kho bãi
- `createLease()` - Tạo hợp đồng thuê
- `getLease()` - Lấy thông tin hợp đồng thuê
- `withdraw()` - Rút tiền từ contract

**Network:** Localhost (Chain ID: 1337)
**RPC URL:** http://127.0.0.1:8545

## 🗄️ Database Schema

### Bảng `warehouses`
```sql
- id (INT, PRIMARY KEY)
- blockchain_id (VARCHAR) - ID trên blockchain
- owner_address (VARCHAR) - Địa chỉ ví owner
- name (VARCHAR) - Tên kho bãi
- location (VARCHAR) - Địa điểm
- total_area (INT) - Tổng diện tích
- available_area (INT) - Diện tích có sẵn
- price_per_sqm_per_day (DECIMAL) - Giá thuê/m²/ngày
- image_url (TEXT) - URL hình ảnh
- description (TEXT) - Mô tả
- is_active (BOOLEAN) - Trạng thái hoạt động
```

### Bảng `leases`
```sql
- id (INT, PRIMARY KEY)
- warehouse_id (INT) - ID kho bãi
- tenant_address (VARCHAR) - Địa chỉ ví người thuê
- start_date (DATE) - Ngày bắt đầu
- end_date (DATE) - Ngày kết thúc
- total_amount (DECIMAL) - Tổng số tiền
- status (VARCHAR) - Trạng thái hợp đồng
```

## 🦊 MetaMask Setup

### Cấu hình Network:
- **Network Name:** Localhost 8545
- **RPC URL:** http://127.0.0.1:8545
- **Chain ID:** 1337
- **Currency Symbol:** ETH

### Import Account:
Sử dụng private key mặc định của Hardhat:
```
0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

## 🚨 Troubleshooting

### Lỗi "Lỗi kết nối blockchain"
```bash
# Kiểm tra Hardhat node
npm run contract-check

# Nếu không hoạt động, khởi động lại
node persistent-blockchain-manager.js
```

### Lỗi "address already in use"
```bash
# Kill tất cả processes đang chiếm ports
npm run kill-all

# Sau đó chạy lại
npm run dev:all:preserve
```

### Lỗi "Contract not found"
```bash
# Kiểm tra contract info
npm run contract-info

# Nếu cần, deploy lại contract
npm run contract-clear
npm run deploy
```

## 📋 API Endpoints

### Warehouses
- `GET /api/warehouses` - Lấy danh sách kho bãi
- `POST /api/warehouses` - Tạo kho bãi mới
- `GET /api/warehouses/:id` - Lấy thông tin kho bãi
- `PUT /api/warehouses/:id` - Cập nhật kho bãi
- `DELETE /api/warehouses/:id` - Xóa kho bãi

### Leases
- `GET /api/leases` - Lấy danh sách hợp đồng thuê
- `POST /api/leases` - Tạo hợp đồng thuê mới
- `GET /api/leases/:id` - Lấy thông tin hợp đồng thuê

### Users
- `GET /api/users` - Lấy danh sách người dùng
- `POST /api/users` - Tạo người dùng mới
- `GET /api/users/:address` - Lấy thông tin người dùng

## 🔧 Development

### Chạy từng phần riêng lẻ:
```bash
# Backend only
npm run dev

# Frontend only
npm run client

# Hardhat node only
npm run node

# Deploy contract only
npm run deploy
```

### Test hệ thống:
```bash
# Kiểm tra contract
npm run contract-check
```

## 📝 Scripts có sẵn

| Script | Mô tả |
|--------|-------|
| `npm run dev:all:preserve` | Chạy ứng dụng với persistent blockchain |
| `npm run dev:all` | Chạy ứng dụng với blockchain mới |
| `npm run sync-warehouses` | Sync warehouses từ database lên blockchain |
| `npm run auto-sync` | Tự động sync warehouses (thông minh) |
| `npm run kill-all` | Kill tất cả processes đang chiếm ports |
| `npm run contract-info` | Xem thông tin contract |
| `npm run contract-check` | Kiểm tra contract hoạt động |
| `npm run contract-clear` | Xóa contract đã lưu |

## 🎉 Kết luận

**Blockchain Warehouse Sharing Network** là một nền tảng hoàn chỉnh để chia sẻ kho bãi sử dụng công nghệ blockchain. Với tính năng persistent blockchain, bạn có thể phát triển và sử dụng ứng dụng mà không lo mất dữ liệu khi restart server.

**Tính năng nổi bật:**
- 🛡️ **Persistent Blockchain** - Không bao giờ mất dữ liệu
- 🔄 **Auto Sync** - Tự động đồng bộ warehouses
- 🧪 **Comprehensive Testing** - Test toàn bộ hệ thống
- 📋 **Smart Contract Management** - Quản lý contract thông minh
- 🚀 **Easy Deployment** - Triển khai dễ dàng

**Hãy bắt đầu với:**
```bash
node persistent-blockchain-manager.js
```

**Chúc bạn phát triển thành công!** 🚀
