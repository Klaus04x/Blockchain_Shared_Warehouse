# Quick Start Guide - Hướng dẫn nhanh

Hướng dẫn nhanh để chạy dự án trong 10 phút!

## Điều kiện tiên quyết

- ✅ Node.js v16+ đã cài
- ✅ XAMPP đã cài
- ✅ MetaMask extension đã cài

## Các bước thực hiện

### 1️⃣ Clone và Install (2 phút)

```bash
# Clone project (thay <repository-url> bằng link git của bạn)
git clone <repository-url>
cd Final

# Install dependencies
npm install
cd smart-contract && npm install
cd ../backend && npm install
cd ../frontend && npm install
cd ..
```

### 2️⃣ Setup Database (2 phút)

```bash
# 1. Mở XAMPP Control Panel
# 2. Start Apache và MySQL
# 3. Mở browser: http://localhost/phpmyadmin
# 4. Click "Import" -> Chọn file "database/warehouse_sharing.sql" -> Click "Go"
```

### 3️⃣ Config Backend (1 phút)

```bash
cd backend
copy .env.example .env
# hoặc trên Mac/Linux: cp .env.example .env

# File .env đã có sẵn config mặc định, không cần sửa gì
```

### 4️⃣ Start Hardhat Node (Terminal 1)

```bash
cd smart-contract
npx hardhat node

# ⚠️ LƯU LẠI:
# - Một private key bất kỳ từ output
# - GIỮ TERMINAL NÀY CHẠY
```

### 5️⃣ Deploy Contract (Terminal 2)

```bash
cd smart-contract
npx hardhat run scripts/deploy.js --network localhost

# ⚠️ LƯU LẠI địa chỉ contract được in ra
# VD: WarehouseLeasing deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
```

### 6️⃣ Config MetaMask (2 phút)

#### Thêm Network
1. Mở MetaMask
2. Click dropdown network
3. Add Network → Add network manually
4. Nhập:
   - **Network name**: Localhost 8545
   - **RPC URL**: http://127.0.0.1:8545
   - **Chain ID**: 1337
   - **Currency**: ETH
5. Save

#### Import Account
1. Click vào icon account
2. Import Account
3. Paste private key đã lưu ở bước 4
4. Import

### 7️⃣ Start Backend (Terminal 3)

```bash
cd backend
npm run dev

# Server chạy tại: http://localhost:5000
```

### 8️⃣ Start Frontend (Terminal 4)

```bash
cd frontend
npm start

# App mở tự động tại: http://localhost:3000
```

### 9️⃣ Sử dụng App

1. Mở http://localhost:3000
2. Click **"Kết nối ví"** trên navbar
3. Approve trong MetaMask
4. ✅ Done! Bắt đầu sử dụng

## Test nhanh

### Test 1: Đăng ký kho bãi

```
1. Click "Đăng ký kho" trên navbar
2. Điền thông tin:
   - Tên: Kho Test 1
   - Địa điểm: TP.HCM, Quận 1
   - Diện tích: 100
   - Giá: 0.00005
   - Mô tả: Kho test
3. Click "Đăng ký kho bãi"
4. Confirm trong MetaMask
5. Chờ transaction hoàn thành
✅ Success!
```

### Test 2: Thuê kho

```
1. Click "Kho bãi" trên navbar
2. Click vào một kho bất kỳ
3. Click "Thuê ngay"
4. Nhập:
   - Diện tích: 10
   - Thời gian: 30 (ngày)
5. Click "Xác nhận thuê"
6. Confirm trong MetaMask
7. Chờ transaction hoàn thành
✅ Success!
```

## Các terminal cần chạy

```
Terminal 1: Hardhat Node
Terminal 2: (Dùng 1 lần để deploy, sau đó đóng)
Terminal 3: Backend
Terminal 4: Frontend
```

## Troubleshooting nhanh

### ❌ MetaMask không kết nối
```
- Kiểm tra network: Localhost 8545, Chain ID: 1337
- Refresh page (F5)
```

### ❌ Transaction failed
```
- Kiểm tra balance trong ví
- Reset account trong MetaMask: Settings → Advanced → Reset Account
```

### ❌ Contract not found
```
- Kiểm tra đã deploy contract chưa (bước 5)
- Kiểm tra Hardhat node đang chạy (bước 4)
```

### ❌ Database error
```
- Kiểm tra MySQL đã start trong XAMPP
- Kiểm tra đã import database chưa (bước 2)
```

### ❌ Port already in use
```
# Backend (port 5000)
- Đóng các app khác đang dùng port 5000
- Hoặc đổi PORT trong backend/.env

# Frontend (port 3000)
- Đóng các app khác đang dùng port 3000
- Hoặc chấp nhận port khác khi được hỏi
```

## Dừng app

```bash
# Dừng từng terminal bằng: Ctrl + C
# Hoặc đóng terminal windows
```

## Chạy lại

```bash
# Terminal 1
cd smart-contract && npx hardhat node

# Terminal 2
cd backend && npm run dev

# Terminal 3
cd frontend && npm start
```

⚠️ **Lưu ý**: Nếu restart Hardhat node, cần deploy lại contract (bước 5) và reset MetaMask account.

## Next Steps

- Đọc [README.md](README.md) để hiểu chi tiết hơn
- Đọc [DEPLOYMENT.md](DEPLOYMENT.md) để deploy lên production
- Xem [CHANGELOG.md](CHANGELOG.md) để biết tất cả tính năng

## Cần hỗ trợ?

- Kiểm tra [README.md](README.md) → Troubleshooting section
- Xem log trong console (F12)
- Check terminal logs

---

**Chúc bạn thành công! 🎉**

Thời gian ước tính: **~10 phút**
Độ khó: ⭐⭐ (Dễ - Trung bình)


