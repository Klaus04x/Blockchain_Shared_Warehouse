# 🔍 Hướng dẫn Debug Thanh toán

## 📋 Các nguyên nhân gây thanh toán thất bại

### 1. **Lỗi Smart Contract**
- **"Warehouse is not active"**: Kho không còn hoạt động trên blockchain
- **"Invalid area"**: Diện tích thuê không hợp lệ (≤ 0 hoặc > diện tích có sẵn)
- **"Insufficient payment"**: Số tiền thanh toán không đủ
- **"Duration must be greater than 0"**: Thời gian thuê phải > 0

### 2. **Lỗi MetaMask**
- **"INSUFFICIENT_FUNDS"**: Số dư ETH không đủ
- **"USER_REJECTED"**: Người dùng hủy giao dịch
- **"NETWORK_ERROR"**: Lỗi kết nối mạng

### 3. **Lỗi Blockchain**
- **"Dropped"**: Giao dịch bị hủy do gas price thấp hoặc network congestion
- **"Failed"**: Giao dịch thất bại do lỗi trong smart contract
- **"Pending"**: Giao dịch đang chờ xử lý

### 4. **Lỗi Database**
- **API Error**: Lỗi khi lưu vào database sau khi blockchain thành công
- **Network Timeout**: Kết nối API bị timeout

## 🛠️ Cách Debug

### 1. **Kiểm tra Console Log**
Mở Developer Tools (F12) → Console để xem:
```
Payment details: {warehouseId, area, duration, totalPrice, account}
On-chain warehouse data: {owner, isActive, availableArea}
Account balance: X.XXXX ETH
Transaction sent: 0x...
```

### 2. **Sử dụng Debug Panel**
Trong trang Warehouse Detail:
- Click "Hiện Debug Info" để xem thông tin chi tiết
- Kiểm tra Account, Warehouse ID, Area, Duration, Total Price

### 3. **Kiểm tra Block Explorer**
- Copy transaction hash từ console
- Paste vào block explorer để xem chi tiết giao dịch

## 🔧 Cách khắc phục

### 1. **Lỗi số dư không đủ**
```bash
# Kiểm tra số dư trong MetaMask
# Hoặc chạy lệnh để nạp ETH vào account test
npx hardhat run scripts/fund-accounts.js --network localhost
```

### 2. **Lỗi warehouse không hoạt động**
- Đảm bảo warehouse đã được đăng ký trên blockchain
- Kiểm tra `isActive = true` trong smart contract

### 3. **Lỗi diện tích**
- Kiểm tra `available_area` trong database
- Kiểm tra `availableArea` trong smart contract
- Đảm bảo diện tích thuê ≤ diện tích có sẵn

### 4. **Lỗi gas**
- Tăng gas limit trong MetaMask
- Tăng gas price (Gwei)
- Đợi network ít tải hơn

## 📊 Monitoring

### 1. **Theo dõi Transaction Status**
- Pending → Success/Failed
- Kiểm tra receipt.status
- Kiểm tra logs events

### 2. **Kiểm tra Database Sync**
- So sánh blockchain data với database
- Đảm bảo transaction_hash được lưu đúng

## 🚨 Troubleshooting Checklist

- [ ] MetaMask đã kết nối đúng account?
- [ ] Đang ở đúng network (Localhost 8545)?
- [ ] Số dư ETH có đủ không?
- [ ] Warehouse có hoạt động không?
- [ ] Diện tích thuê có hợp lệ không?
- [ ] Gas settings có phù hợp không?
- [ ] Smart contract có được deploy không?
- [ ] Database có hoạt động không?

## 📞 Hỗ trợ

Nếu vẫn gặp lỗi, hãy cung cấp:
1. Console logs
2. Transaction hash
3. Error message chi tiết
4. Debug info từ panel
5. Screenshot MetaMask
