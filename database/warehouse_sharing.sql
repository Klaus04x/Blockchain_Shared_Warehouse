-- Tạo database
CREATE DATABASE IF NOT EXISTS warehouse_sharing CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE warehouse_sharing;

-- Bảng users (người dùng)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    wallet_address VARCHAR(42) NOT NULL UNIQUE,
    name VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(20),
    avatar_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_wallet (wallet_address)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng warehouses (kho bãi)
CREATE TABLE IF NOT EXISTS warehouses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    blockchain_id INT NOT NULL,
    owner_address VARCHAR(42) NOT NULL,
    name VARCHAR(200) NOT NULL,
    location VARCHAR(255) NOT NULL,
    total_area DECIMAL(10, 2) NOT NULL COMMENT 'Diện tích tổng (m²)',
    available_area DECIMAL(10, 2) NOT NULL COMMENT 'Diện tích còn trống (m²)',
    price_per_sqm_per_day DECIMAL(20, 0) NOT NULL COMMENT 'Giá thuê mỗi m²/ngày (Wei)',
    image_url VARCHAR(500),
    description TEXT,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_owner (owner_address),
    INDEX idx_blockchain (blockchain_id),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng leases (hợp đồng thuê)
CREATE TABLE IF NOT EXISTS leases (
    id INT AUTO_INCREMENT PRIMARY KEY,
    blockchain_id INT NOT NULL,
    warehouse_id INT NOT NULL,
    tenant_address VARCHAR(42) NOT NULL,
    area DECIMAL(10, 2) NOT NULL COMMENT 'Diện tích thuê (m²)',
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    total_price DECIMAL(20, 0) NOT NULL COMMENT 'Tổng giá (Wei)',
    transaction_hash VARCHAR(66),
    is_active TINYINT(1) DEFAULT 1,
    is_completed TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
    INDEX idx_tenant (tenant_address),
    INDEX idx_warehouse (warehouse_id),
    INDEX idx_blockchain (blockchain_id),
    INDEX idx_status (is_active, is_completed)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng transactions (lịch sử giao dịch)
CREATE TABLE IF NOT EXISTS transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_hash VARCHAR(66) NOT NULL UNIQUE,
    from_address VARCHAR(42) NOT NULL,
    to_address VARCHAR(42),
    type ENUM('register_warehouse', 'create_lease', 'complete_lease', 'cancel_lease') NOT NULL,
    amount DECIMAL(20, 0),
    status ENUM('pending', 'success', 'failed') DEFAULT 'pending',
    block_number INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_hash (transaction_hash),
    INDEX idx_from (from_address),
    INDEX idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng reviews (đánh giá)
CREATE TABLE IF NOT EXISTS reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    warehouse_id INT NOT NULL,
    lease_id INT,
    reviewer_address VARCHAR(42) NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
    FOREIGN KEY (lease_id) REFERENCES leases(id),
    INDEX idx_warehouse (warehouse_id),
    INDEX idx_reviewer (reviewer_address)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Thêm dữ liệu mẫu
INSERT INTO users (wallet_address, name, email) VALUES
('0x1234567890123456789012345678901234567890', 'Nguyễn Văn A', 'nguyenvana@example.com'),
('0x2345678901234567890123456789012345678901', 'Trần Thị B', 'tranthib@example.com'),
('0x3456789012345678901234567890123456789012', 'Lê Văn C', 'levanc@example.com');

INSERT INTO warehouses (blockchain_id, owner_address, name, location, total_area, available_area, price_per_sqm_per_day, image_url, description, is_active) VALUES
(1, '0x1234567890123456789012345678901234567890', 'Kho Bãi Quận 1', 'TP. Hồ Chí Minh, Quận 1', 1000.00, 1000.00, '50000000000000000', 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d', 'Kho bãi rộng rãi, bảo vệ 24/7, hệ thống phòng cháy chữa cháy đầy đủ', 1),
(2, '0x1234567890123456789012345678901234567890', 'Kho Bãi Bình Thạnh', 'TP. Hồ Chí Minh, Bình Thạnh', 1500.00, 1200.00, '45000000000000000', 'https://images.unsplash.com/photo-1553413077-190dd305871c', 'Kho tiêu chuẩn, gần cảng, thuận lợi vận chuyển', 1),
(3, '0x2345678901234567890123456789012345678901', 'Kho Lạnh Đông Đô', 'Hà Nội, Đông Anh', 800.00, 800.00, '80000000000000000', 'https://images.unsplash.com/photo-1587293852726-70cdb56c2866', 'Kho lạnh chuyên dụng, nhiệt độ -18°C đến +5°C', 1),
(4, '0x2345678901234567890123456789012345678901', 'Kho Bãi Mỹ Đình', 'Hà Nội, Nam Từ Liêm', 2000.00, 1800.00, '60000000000000000', 'https://images.unsplash.com/photo-1601598851547-4302969d0614', 'Kho hiện đại, hệ thống giám sát an ninh cao cấp', 1),
(5, '0x3456789012345678901234567890123456789012', 'Kho Logistics Đà Nẵng', 'Đà Nẵng, Hải Châu', 1200.00, 1200.00, '55000000000000000', 'https://images.unsplash.com/photo-1565610222536-ef125c59da2e', 'Kho chuyên dụng cho logistics, gần sân bay', 1);

-- Thêm một số hợp đồng mẫu
INSERT INTO leases (blockchain_id, warehouse_id, tenant_address, area, start_date, end_date, total_price, transaction_hash, is_active, is_completed) VALUES
(1, 1, '0x3456789012345678901234567890123456789012', 200.00, DATE_SUB(NOW(), INTERVAL 10 DAY), DATE_ADD(NOW(), INTERVAL 20 DAY), '300000000000000000', '0xabc123...', 1, 0),
(2, 2, '0x3456789012345678901234567890123456789012', 300.00, DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_ADD(NOW(), INTERVAL 25 DAY), '405000000000000000', '0xdef456...', 1, 0);

-- Thêm đánh giá mẫu
INSERT INTO reviews (warehouse_id, lease_id, reviewer_address, rating, comment) VALUES
(1, 1, '0x3456789012345678901234567890123456789012', 5, 'Kho rất tốt, sạch sẽ, bảo vệ nhiệt tình'),
(2, 2, '0x3456789012345678901234567890123456789012', 4, 'Kho đẹp nhưng hơi xa trung tâm');

-- Tạo view để xem thống kê
CREATE OR REPLACE VIEW warehouse_statistics AS
SELECT 
    w.id,
    w.name,
    w.location,
    w.total_area,
    w.available_area,
    (w.total_area - w.available_area) as occupied_area,
    COUNT(DISTINCT l.id) as total_leases,
    COUNT(DISTINCT CASE WHEN l.is_active = 1 THEN l.id END) as active_leases,
    COALESCE(AVG(r.rating), 0) as average_rating,
    COUNT(DISTINCT r.id) as total_reviews
FROM warehouses w
LEFT JOIN leases l ON w.id = l.warehouse_id
LEFT JOIN reviews r ON w.id = r.warehouse_id
GROUP BY w.id;

-- Tạo stored procedure để tính toán doanh thu
DELIMITER //
CREATE PROCEDURE calculate_revenue(IN owner_addr VARCHAR(42))
BEGIN
    SELECT 
        w.id as warehouse_id,
        w.name,
        SUM(l.total_price) as total_revenue,
        COUNT(l.id) as total_contracts
    FROM warehouses w
    LEFT JOIN leases l ON w.id = l.warehouse_id
    WHERE w.owner_address = owner_addr
    GROUP BY w.id;
END //
DELIMITER ;

-- Tạo trigger để cập nhật updated_at
DELIMITER //
CREATE TRIGGER update_warehouse_timestamp 
BEFORE UPDATE ON warehouses
FOR EACH ROW
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END //

CREATE TRIGGER update_lease_timestamp 
BEFORE UPDATE ON leases
FOR EACH ROW
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END //
DELIMITER ;

-- Hiển thị thông tin
SELECT 'Database warehouse_sharing đã được tạo thành công!' as message;
SELECT CONCAT('Số lượng kho bãi: ', COUNT(*)) as info FROM warehouses;
SELECT CONCAT('Số lượng người dùng: ', COUNT(*)) as info FROM users;
SELECT CONCAT('Số lượng hợp đồng: ', COUNT(*)) as info FROM leases;

