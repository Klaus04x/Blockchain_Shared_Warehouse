# 🔧 Khắc phục lỗi "Không thể kiểm tra thông tin kho trên blockchain"

## ❌ Lỗi bạn gặp phải
```
Không thể kiểm tra thông tin kho trên blockchain. Vui lòng thử lại.
```

## 🎯 Nguyên nhân có thể

### 1. **Warehouse chưa có blockchain_id**
- Warehouse được tạo trực tiếp trong database
- Chưa được đăng ký trên blockchain
- `blockchain_id = 0` hoặc `null`

### 2. **Contract chưa được deploy**
- Smart contract chưa được deploy
- Contract address không đúng
- Hardhat node không chạy

### 3. **Lỗi kết nối RPC**
- Hardhat node không chạy
- Port 8545 bị block
- Network không đúng

### 4. **Warehouse không tồn tại trên blockchain**
- Warehouse bị xóa khỏi blockchain
- Contract revert exception

## 🛠️ Cách khắc phục

### ✅ Bước 1: Kiểm tra hệ thống
```bash
# Chạy script kiểm tra
node check-blockchain.js
```

### ✅ Bước 2: Khởi động Hardhat node
```bash
# Terminal 1: Khởi động Hardhat node
npx hardhat node

# Terminal 2: Deploy contract (nếu cần)
cd smart-contract
npx hardhat run scripts/deploy.js --network localhost
```

### ✅ Bước 3: Seed warehouses (nếu cần)
```bash
# Seed warehouses để có dữ liệu test
curl -X POST http://localhost:5000/api/warehouses/seed
```

### ✅ Bước 4: Kiểm tra backend
```bash
# Khởi động backend server
cd backend
npm start
```

## 🔍 Debug chi tiết

### 1. **Mở Developer Tools (F12)**
- Console → Xem error message chi tiết
- Network → Kiểm tra API calls

### 2. **Kiểm tra Console Logs**
```javascript
// Tìm các log này:
"Checking warehouse on blockchain: X"
"On-chain warehouse data: {...}"
"On-chain warehouse check failed: ..."
```

### 3. **Kiểm tra Network Tab**
- API call đến `/api/warehouses/{id}`
- Response có `blockchain_id` không?

## 📊 Các trường hợp cụ thể

### Case 1: Warehouse chưa có blockchain_id
```
Warehouse chưa có blockchain_id, bỏ qua kiểm tra on-chain
```
**Giải pháp:** Đăng ký warehouse trên blockchain trước

### Case 2: Contract không hoạt động
```
call revert exception
```
**Giải pháp:** 
1. Redeploy contract
2. Cập nhật contract address

### Case 3: RPC connection failed
```
network error
```
**Giải pháp:**
1. Khởi động Hardhat node
2. Kiểm tra port 8545

### Case 4: Warehouse không tồn tại
```
Kho này không tồn tại trên blockchain
```
**Giải pháp:** Seed warehouses hoặc đăng ký mới

## 🚀 Giải pháp nhanh

### Nếu chưa có dữ liệu:
```bash
# 1. Khởi động Hardhat node
npx hardhat node

# 2. Deploy contract
cd smart-contract
npx hardhat run scripts/deploy.js --network localhost

# 3. Seed warehouses
curl -X POST http://localhost:5000/api/warehouses/seed

# 4. Khởi động backend
cd backend
npm start

# 5. Khởi động frontend
cd frontend
npm start
```

### Nếu đã có dữ liệu:
```bash
# 1. Kiểm tra Hardhat node
npx hardhat node

# 2. Kiểm tra contract
node check-blockchain.js

# 3. Reset MetaMask account (nếu cần)
```

## ⚠️ Lưu ý quan trọng

1. **Hardhat node phải luôn chạy** khi test
2. **Contract address phải đúng** trong frontend
3. **Database và blockchain phải sync**
4. **MetaMask phải ở đúng network** (Localhost 8545)

## 🔧 Troubleshooting

### Nếu vẫn lỗi:
1. **Clear browser cache**
2. **Reset MetaMask account**
3. **Restart tất cả services**
4. **Redeploy contract**
5. **Seed lại warehouses**

### Kiểm tra logs:
```bash
# Backend logs
cd backend && npm start

# Hardhat logs
npx hardhat node

# Frontend console
F12 → Console
```

## ✅ Checklist

- [ ] Hardhat node đang chạy?
- [ ] Contract đã được deploy?
- [ ] Backend server đang chạy?
- [ ] Database có warehouses?
- [ ] Warehouses có blockchain_id?
- [ ] MetaMask ở đúng network?
- [ ] Contract address đúng?

## 📞 Hỗ trợ

Nếu vẫn gặp lỗi, cung cấp:
1. Console logs từ browser
2. Backend logs
3. Hardhat node logs
4. Kết quả từ `node check-blockchain.js`
5. Screenshot error message
