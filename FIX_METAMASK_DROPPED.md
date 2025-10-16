# 🔧 Cách khắc phục lỗi "Dropped" trong MetaMask

## ❌ Vấn đề
Giao dịch trong MetaMask bị "Dropped" (như trong hình bạn gửi: -1.23 ETH, Dropped)

## 🎯 Nguyên nhân chính

### 1. **Nonce Conflict (Phổ biến nhất)**
- Nhiều giao dịch cùng lúc với nonce giống nhau
- Giao dịch bị thay thế bởi giao dịch khác

### 2. **Gas Price quá thấp**
- Network đang tải cao
- Gas price không đủ cạnh tranh

### 3. **Gas Limit không đủ**
- Transaction cần nhiều gas hơn

## 🛠️ Giải pháp

### ✅ Giải pháp 1: Reset MetaMask Account (Khuyến nghị)

**Bước 1:** Mở MetaMask
- Click vào icon account (góc trên bên phải)
- Settings → Advanced

**Bước 2:** Reset Account
- Scroll xuống → Click "Reset Account"
- Confirm

**Lưu ý:** Điều này sẽ:
- ✅ Xóa transaction history
- ✅ Reset nonce
- ❌ KHÔNG mất tiền
- ❌ KHÔNG mất account

### ✅ Giải pháp 2: Tăng Gas Settings

**Trong MetaMask khi gửi giao dịch:**

1. **Click "Edit" ở phần Gas Fee**
2. **Chọn "Advanced"**
3. **Tăng các giá trị:**
   - Max base fee: **20 Gwei** (thay vì 0-2 Gwei)
   - Priority fee: **2 Gwei**
   - Gas limit: **500000**

### ✅ Giải pháp 3: Chờ và thử lại

1. Đợi 5-10 phút để giao dịch "Dropped" được clear
2. Refresh trang web
3. Thử lại giao dịch

### ✅ Giải pháp 4: Speed Up hoặc Cancel

**Nếu giao dịch đang Pending:**
1. Click vào giao dịch Pending trong MetaMask
2. Click "Speed Up" hoặc "Cancel"
3. Tăng gas price
4. Confirm

## 🚀 Các bước thực hiện ngay

### Bước 1: Reset MetaMask
```
MetaMask → Settings → Advanced → Reset Account
```

### Bước 2: Clear browser cache
- Press Ctrl + Shift + Delete
- Clear cache and cookies
- Restart browser

### Bước 3: Reconnect wallet
- Refresh trang web
- Disconnect wallet
- Connect lại

### Bước 4: Thử giao dịch mới
- Đảm bảo chọn gas settings cao hơn
- Max base fee: 20 Gwei
- Priority fee: 2 Gwei
- Gas limit: 500000

## 📊 Kiểm tra trước khi giao dịch

✅ Checklist:
- [ ] Đã reset MetaMask account?
- [ ] Không có giao dịch pending nào?
- [ ] Network là Localhost 8545?
- [ ] Số dư đủ (bao gồm cả gas fee)?
- [ ] Gas settings đã tăng?

## ⚠️ Lưu ý quan trọng

1. **Không gửi nhiều giao dịch cùng lúc**
   - Đợi giao dịch trước confirm
   - Mới gửi giao dịch tiếp theo

2. **Luôn kiểm tra gas settings**
   - Đặt cao hơn mức mặc định
   - Nhất là khi network đang tải

3. **Nếu vẫn lỗi:**
   - Restart Hardhat node
   - Redeploy contract
   - Reset MetaMask account
   - Clear browser cache

## 🔍 Debug

Nếu vẫn gặp lỗi, kiểm tra console:
```javascript
// Mở Developer Tools (F12) → Console
// Xem các thông tin:
- Transaction hash
- Gas settings
- Error messages
```

## 📞 Các lệnh hữu ích

```bash
# Restart Hardhat node
npx hardhat node

# Redeploy contract
cd smart-contract
npx hardhat run scripts/deploy.js --network localhost

# Check account balance
node debug-payment.js
```

## ✅ Kết luận

**Giải pháp nhanh nhất:**
1. Reset MetaMask account
2. Tăng gas settings lên 20 Gwei
3. Thử lại giao dịch

**99% trường hợp sẽ được giải quyết sau khi reset MetaMask account!**

