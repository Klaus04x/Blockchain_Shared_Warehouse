# Hướng dẫn Import Database

## Yêu cầu
- XAMPP đã được cài đặt
- MySQL Server đang chạy

## Các bước import

### 1. Khởi động XAMPP
- Mở XAMPP Control Panel
- Start Apache và MySQL

### 2. Import database qua phpMyAdmin

#### Cách 1: Sử dụng phpMyAdmin
1. Mở trình duyệt và truy cập: `http://localhost/phpmyadmin`
2. Click vào tab "Import"
3. Click "Choose File" và chọn file `warehouse_sharing.sql`
4. Click "Go" để import

#### Cách 2: Sử dụng Command Line
```bash
# Mở terminal/command prompt
# Di chuyển đến thư mục database
cd path/to/database

# Import database
mysql -u root -p < warehouse_sharing.sql

# Hoặc nếu không có password
mysql -u root < warehouse_sharing.sql
```

### 3. Kiểm tra database
```sql
USE warehouse_sharing;
SHOW TABLES;
SELECT * FROM warehouses;
```

## Cấu trúc Database

### Bảng `users`
- Lưu thông tin người dùng
- Wallet address là unique key

### Bảng `warehouses`
- Thông tin kho bãi
- Liên kết với blockchain_id

### Bảng `leases`
- Hợp đồng thuê kho
- Foreign key đến warehouses

### Bảng `transactions`
- Lịch sử giao dịch blockchain

### Bảng `reviews`
- Đánh giá của khách hàng

## Dữ liệu mẫu
File SQL đã bao gồm:
- 3 users mẫu
- 5 warehouses mẫu
- 2 leases mẫu
- 2 reviews mẫu

## Cấu hình Backend
Sau khi import, cập nhật file `backend/.env`:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=warehouse_sharing
DB_PORT=3306
```


