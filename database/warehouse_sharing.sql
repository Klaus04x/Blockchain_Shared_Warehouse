-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Máy chủ: 127.0.0.1
-- Thời gian đã tạo: Th10 14, 2025 lúc 08:13 PM
-- Phiên bản máy phục vụ: 10.4.32-MariaDB
-- Phiên bản PHP: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Cơ sở dữ liệu: `warehouse_sharing`
--

DELIMITER $$
--
-- Thủ tục
--
CREATE DEFINER=`root`@`localhost` PROCEDURE `calculate_revenue` (IN `owner_addr` VARCHAR(42))   BEGIN
    SELECT 
        w.id as warehouse_id,
        w.name,
        SUM(l.total_price) as total_revenue,
        COUNT(l.id) as total_contracts
    FROM warehouses w
    LEFT JOIN leases l ON w.id = l.warehouse_id
    WHERE w.owner_address = owner_addr
    GROUP BY w.id;
END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `leases`
--

CREATE TABLE `leases` (
  `id` int(11) NOT NULL,
  `blockchain_id` int(11) NOT NULL,
  `warehouse_id` int(11) NOT NULL,
  `tenant_address` varchar(42) NOT NULL,
  `area` decimal(10,2) NOT NULL COMMENT 'Diện tích thuê (m²)',
  `start_date` datetime NOT NULL,
  `end_date` datetime NOT NULL,
  `total_price` decimal(20,0) NOT NULL COMMENT 'Tổng giá (Wei)',
  `transaction_hash` varchar(66) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `is_completed` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `leases`
--

INSERT INTO `leases` (`id`, `blockchain_id`, `warehouse_id`, `tenant_address`, `area`, `start_date`, `end_date`, `total_price`, `transaction_hash`, `is_active`, `is_completed`, `created_at`, `updated_at`) VALUES
(1, 1, 1, '0x3456789012345678901234567890123456789012', 200.00, '2025-10-04 14:54:01', '2025-11-03 14:54:01', 300000000000000000, '0xabc123...', 1, 0, '2025-10-14 07:54:01', '2025-10-14 07:54:01'),
(2, 2, 2, '0x3456789012345678901234567890123456789012', 300.00, '2025-10-09 14:54:01', '2025-11-08 14:54:01', 405000000000000000, '0xdef456...', 1, 0, '2025-10-14 07:54:01', '2025-10-14 07:54:01'),
(3, 1, 11, '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266', 1.00, '2025-10-14 18:02:12', '2025-10-26 18:02:12', 600000000000000000, '0x029a82c3b74a9fbaea055a72c5f253ded4a7fb627f6df1c3a4ac89273bcbe032', 1, 0, '2025-10-14 18:02:12', '2025-10-14 18:02:12');

--
-- Bẫy `leases`
--
DELIMITER $$
CREATE TRIGGER `update_lease_timestamp` BEFORE UPDATE ON `leases` FOR EACH ROW BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `reviews`
--

CREATE TABLE `reviews` (
  `id` int(11) NOT NULL,
  `warehouse_id` int(11) NOT NULL,
  `lease_id` int(11) DEFAULT NULL,
  `reviewer_address` varchar(42) NOT NULL,
  `rating` int(11) NOT NULL CHECK (`rating` >= 1 and `rating` <= 5),
  `comment` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `reviews`
--

INSERT INTO `reviews` (`id`, `warehouse_id`, `lease_id`, `reviewer_address`, `rating`, `comment`, `created_at`) VALUES
(1, 1, 1, '0x3456789012345678901234567890123456789012', 5, 'Kho rất tốt, sạch sẽ, bảo vệ nhiệt tình', '2025-10-14 07:54:01'),
(2, 2, 2, '0x3456789012345678901234567890123456789012', 4, 'Kho đẹp nhưng hơi xa trung tâm', '2025-10-14 07:54:01');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `transactions`
--

CREATE TABLE `transactions` (
  `id` int(11) NOT NULL,
  `transaction_hash` varchar(66) NOT NULL,
  `from_address` varchar(42) NOT NULL,
  `to_address` varchar(42) DEFAULT NULL,
  `type` enum('register_warehouse','create_lease','complete_lease','cancel_lease') NOT NULL,
  `amount` decimal(20,0) DEFAULT NULL,
  `status` enum('pending','success','failed') DEFAULT 'pending',
  `block_number` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `wallet_address` varchar(42) NOT NULL,
  `name` varchar(100) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `avatar_url` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `users`
--

INSERT INTO `users` (`id`, `wallet_address`, `name`, `email`, `phone`, `avatar_url`, `created_at`, `updated_at`) VALUES
(1, '0x1234567890123456789012345678901234567890', 'Nguyễn Văn A', 'nguyenvana@example.com', NULL, NULL, '2025-10-14 07:54:01', '2025-10-14 07:54:01'),
(2, '0x2345678901234567890123456789012345678901', 'Trần Thị B', 'tranthib@example.com', NULL, NULL, '2025-10-14 07:54:01', '2025-10-14 07:54:01'),
(3, '0x3456789012345678901234567890123456789012', 'Lê Văn C', 'levanc@example.com', NULL, NULL, '2025-10-14 07:54:01', '2025-10-14 07:54:01'),
(4, '0xc6943e8e199e48eca4b1b011cbcf8cc914af4c4d', '', '', NULL, NULL, '2025-10-14 08:02:27', '2025-10-14 08:02:27'),
(5, '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266', 'Nguyễn Tiến Thanh', 'thanh04xx@gmail.com', '0326484073', 'https://media.istockphoto.com/id/1372997793/vector/cute-pembroke-welsh-corgi-dog-waving-paw-vector-illustration.jpg?s=612x612&w=0&k=20&c=T_GXRG6RG5Oy07rHGrR6XvKDQGY9mjeCmxjJ_oIVTGM=', '2025-10-14 16:36:12', '2025-10-14 18:05:14'),
(7, '0x2546bcd3c84621e976d8185a91a922ae77ecec30', 'Nguyễn Tiến Thanh', 'thanh04xx@gmail.com', '0326484073', 'https://media.istockphoto.com/id/1372997793/vector/cute-pembroke-welsh-corgi-dog-waving-paw-vector-illustration.jpg?s=612x612&w=0&k=20&c=T_GXRG6RG5Oy07rHGrR6XvKDQGY9mjeCmxjJ_oIVTGM=', '2025-10-14 17:56:21', '2025-10-14 17:57:29');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `warehouses`
--

CREATE TABLE `warehouses` (
  `id` int(11) NOT NULL,
  `blockchain_id` int(11) NOT NULL,
  `owner_address` varchar(42) NOT NULL,
  `name` varchar(200) NOT NULL,
  `location` varchar(255) NOT NULL,
  `total_area` decimal(10,2) NOT NULL COMMENT 'Diện tích tổng (m²)',
  `available_area` decimal(10,2) NOT NULL COMMENT 'Diện tích còn trống (m²)',
  `price_per_sqm_per_day` decimal(20,0) NOT NULL COMMENT 'Giá thuê mỗi m²/ngày (Wei)',
  `image_url` varchar(500) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `warehouses`
--

INSERT INTO `warehouses` (`id`, `blockchain_id`, `owner_address`, `name`, `location`, `total_area`, `available_area`, `price_per_sqm_per_day`, `image_url`, `description`, `is_active`, `created_at`, `updated_at`) VALUES
(10, 5, '0x2546bcd3c84621e976d8185a91a922ae77ecec30', 'Kho Shopee Hải Dương', 'Thị Trấn Tứ Kỳ, Hải Dương', 200.00, 200.00, 50000000000000000, 'http://localhost:5000/uploads/images/1760464438019_buu-cuc-shopee-express1.jpg', 'Bưu cục SPX là hệ thống điểm dịch vụ của SPX Express - đơn vị vận chuyển nhanh chóng và uy tín thuộc Shopee tại Việt Nam, chuyên hỗ trợ gửi/nhận hàng hóa toàn quốc. Với mạng lưới rộng khắp các tỉnh thành, bưu cục SPX giúp khách hàng dễ dàng tiếp cận dịch vụ giao hàng COD, theo dõi đơn hàng 24/7 qua app hoặc website. Các điểm này thường nằm tại các khu vực trung tâm, hỗ trợ cả cá nhân và doanh nghiệp với thời gian xử lý nhanh chóng. Để tra cứu địa chỉ bưu cục SPX gần nhất, bạn có thể truy cập spx.vn/service-point và nhập tỉnh/thành phố.', 1, '2025-10-14 17:49:31', '2025-10-14 17:54:05'),
(11, 6, '0x2546bcd3c84621e976d8185a91a922ae77ecec30', 'Kho Shopee Hải Phòng', 'Thành Phố Hải Phòng', 120.00, 119.00, 50000000000000000, 'https://cdn.chotot.com/G73tzrYfYbSkCUk0dePB1jOc839D9_ExcLdEJl0xUNI/preset:view/plain/afcfbeeea84b70ddaa6811df02e796f9-2941627628712422095.jpg', 'Bưu cục SPX là hệ thống điểm dịch vụ của SPX Express - đơn vị vận chuyển nhanh chóng và uy tín thuộc Shopee tại Việt Nam, chuyên hỗ trợ gửi/nhận hàng hóa toàn quốc. Với mạng lưới rộng khắp các tỉnh thành, bưu cục SPX giúp khách hàng dễ dàng tiếp cận dịch vụ giao hàng COD, theo dõi đơn hàng 24/7 qua app hoặc website. Các điểm này thường nằm tại các khu vực trung tâm, hỗ trợ cả cá nhân và doanh nghiệp với thời gian xử lý nhanh chóng. Để tra cứu địa chỉ bưu cục SPX gần nhất, bạn có thể truy cập spx.vn/service-point và nhập tỉnh/thành phố.', 1, '2025-10-14 17:58:40', '2025-10-14 18:02:12'),
(12, 7, '0x2546bcd3c84621e976d8185a91a922ae77ecec30', 'Kho Shopee Hà Nội', '235 Hoàng Quốc Việt, Bắc Từ Liêm, Hà Nội', 1000.00, 1000.00, 1400000000000000000, 'https://images.bloggiamgia.vn/full/23-03-2024/Kho-HN-SOC-a-AAcentu-1711181685131.webp', 'Bưu cục SPX là hệ thống điểm dịch vụ của SPX Express - đơn vị vận chuyển nhanh chóng và uy tín thuộc Shopee tại Việt Nam, chuyên hỗ trợ gửi/nhận hàng hóa toàn quốc. Với mạng lưới rộng khắp các tỉnh thành, bưu cục SPX giúp khách hàng dễ dàng tiếp cận dịch vụ giao hàng COD, theo dõi đơn hàng 24/7 qua app hoặc website. Các điểm này thường nằm tại các khu vực trung tâm, hỗ trợ cả cá nhân và doanh nghiệp với thời gian xử lý nhanh chóng. Để tra cứu địa chỉ bưu cục SPX gần nhất, bạn có thể truy cập spx.vn/service-point và nhập tỉnh/thành phố.', 1, '2025-10-14 18:01:28', '2025-10-14 18:01:28'),
(13, 8, '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266', 'Kho của Nguyễn Tiến Thanh', 'Tứ Kỳ, Hải Dương', 1000.00, 1000.00, 1230000000000000000, 'https://vnpanda.com/wp-content/uploads/2024/08/kho-xuyen-a-soc-shopee-o-dau-nhan-hang-truc-tiep-tai-kho-khong-1578-2.jpg', 'Bưu cục SPX là hệ thống điểm dịch vụ của SPX Express - đơn vị vận chuyển nhanh chóng và uy tín thuộc Shopee tại Việt Nam, chuyên hỗ trợ gửi/nhận hàng hóa toàn quốc. Với mạng lưới rộng khắp các tỉnh thành, bưu cục SPX giúp khách hàng dễ dàng tiếp cận dịch vụ giao hàng COD, theo dõi đơn hàng 24/7 qua app hoặc website. Các điểm này thường nằm tại các khu vực trung tâm, hỗ trợ cả cá nhân và doanh nghiệp với thời gian xử lý nhanh chóng. Để tra cứu địa chỉ bưu cục SPX gần nhất, bạn có thể truy cập spx.vn/service-point và nhập tỉnh/thành phố.', 1, '2025-10-14 18:03:44', '2025-10-14 18:03:44');

--
-- Bẫy `warehouses`
--
DELIMITER $$
CREATE TRIGGER `update_warehouse_timestamp` BEFORE UPDATE ON `warehouses` FOR EACH ROW BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Cấu trúc đóng vai cho view `warehouse_statistics`
-- (See below for the actual view)
--
CREATE TABLE `warehouse_statistics` (
`id` int(11)
,`name` varchar(200)
,`location` varchar(255)
,`total_area` decimal(10,2)
,`available_area` decimal(10,2)
,`occupied_area` decimal(11,2)
,`total_leases` bigint(21)
,`active_leases` bigint(21)
,`average_rating` decimal(14,4)
,`total_reviews` bigint(21)
);

-- --------------------------------------------------------

--
-- Cấu trúc cho view `warehouse_statistics`
--
DROP TABLE IF EXISTS `warehouse_statistics`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `warehouse_statistics`  AS SELECT `w`.`id` AS `id`, `w`.`name` AS `name`, `w`.`location` AS `location`, `w`.`total_area` AS `total_area`, `w`.`available_area` AS `available_area`, `w`.`total_area`- `w`.`available_area` AS `occupied_area`, count(distinct `l`.`id`) AS `total_leases`, count(distinct case when `l`.`is_active` = 1 then `l`.`id` end) AS `active_leases`, coalesce(avg(`r`.`rating`),0) AS `average_rating`, count(distinct `r`.`id`) AS `total_reviews` FROM ((`warehouses` `w` left join `leases` `l` on(`w`.`id` = `l`.`warehouse_id`)) left join `reviews` `r` on(`w`.`id` = `r`.`warehouse_id`)) GROUP BY `w`.`id` ;

--
-- Chỉ mục cho các bảng đã đổ
--

--
-- Chỉ mục cho bảng `leases`
--
ALTER TABLE `leases`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_tenant` (`tenant_address`),
  ADD KEY `idx_warehouse` (`warehouse_id`),
  ADD KEY `idx_blockchain` (`blockchain_id`),
  ADD KEY `idx_status` (`is_active`,`is_completed`);

--
-- Chỉ mục cho bảng `reviews`
--
ALTER TABLE `reviews`
  ADD PRIMARY KEY (`id`),
  ADD KEY `lease_id` (`lease_id`),
  ADD KEY `idx_warehouse` (`warehouse_id`),
  ADD KEY `idx_reviewer` (`reviewer_address`);

--
-- Chỉ mục cho bảng `transactions`
--
ALTER TABLE `transactions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `transaction_hash` (`transaction_hash`),
  ADD KEY `idx_hash` (`transaction_hash`),
  ADD KEY `idx_from` (`from_address`),
  ADD KEY `idx_type` (`type`);

--
-- Chỉ mục cho bảng `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `wallet_address` (`wallet_address`),
  ADD KEY `idx_wallet` (`wallet_address`);

--
-- Chỉ mục cho bảng `warehouses`
--
ALTER TABLE `warehouses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_owner` (`owner_address`),
  ADD KEY `idx_blockchain` (`blockchain_id`),
  ADD KEY `idx_active` (`is_active`);

--
-- AUTO_INCREMENT cho các bảng đã đổ
--

--
-- AUTO_INCREMENT cho bảng `leases`
--
ALTER TABLE `leases`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT cho bảng `reviews`
--
ALTER TABLE `reviews`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT cho bảng `transactions`
--
ALTER TABLE `transactions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT cho bảng `warehouses`
--
ALTER TABLE `warehouses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- Các ràng buộc cho các bảng đã đổ
--

--
-- Các ràng buộc cho bảng `leases`
--
ALTER TABLE `leases`
  ADD CONSTRAINT `leases_ibfk_1` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`);

--
-- Các ràng buộc cho bảng `reviews`
--
ALTER TABLE `reviews`
  ADD CONSTRAINT `reviews_ibfk_1` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`),
  ADD CONSTRAINT `reviews_ibfk_2` FOREIGN KEY (`lease_id`) REFERENCES `leases` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
