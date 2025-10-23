#!/usr/bin/env node

/**
 * Script tự động hoàn thành các hợp đồng đã hết hạn
 * Chạy định kỳ để kiểm tra và hoàn thành leases hết hạn
 */

const { ethers } = require('ethers');
const mysql = require('mysql2/promise');
const ContractAddressManager = require('./contract-address-manager');

async function autoCompleteExpiredLeases() {
  console.log('\n' + '='.repeat(70));
  console.log('🕐 TỰ ĐỘNG HOÀN THÀNH HỢP ĐỒNG HẾT HẠN');
  console.log('='.repeat(70) + '\n');

  let connection = null;

  try {
    // Kết nối database
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'warehouse_sharing'
    });

    // Kết nối blockchain
    const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
    const privateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
    const wallet = new ethers.Wallet(privateKey, provider);

    const contractData = ContractAddressManager.getContractAddress();
    if (!contractData) {
      console.log('❌ Không tìm thấy contract');
      return;
    }

    const contract = new ethers.Contract(contractData.address, contractData.abi, wallet);

    // Lấy các lease đã hết hạn nhưng chưa hoàn thành
    const [expiredLeases] = await connection.execute(`
      SELECT id, blockchain_id, warehouse_id, tenant_address, area, end_date
      FROM leases
      WHERE is_active = 1 
        AND is_completed = 0
        AND end_date < NOW()
      ORDER BY end_date ASC
    `);

    console.log(`📊 Tìm thấy ${expiredLeases.length} hợp đồng hết hạn\n`);

    if (expiredLeases.length === 0) {
      console.log('✅ Không có hợp đồng nào cần hoàn thành');
      return;
    }

    let completedCount = 0;
    let failedCount = 0;

    for (const lease of expiredLeases) {
      console.log(`📄 Đang xử lý Lease #${lease.id} (Blockchain ID: ${lease.blockchain_id})`);
      console.log(`   Tenant: ${lease.tenant_address}`);
      console.log(`   Hết hạn: ${new Date(lease.end_date).toLocaleString()}`);

      try {
        // Kiểm tra trên blockchain
        const blockchainLease = await contract.getLease(lease.blockchain_id);

        // Kiểm tra nếu lease tồn tại (tenant == ZeroAddress = lease không tồn tại)
        if (blockchainLease.tenant === ethers.ZeroAddress) {
          console.log('   ⚠️  Lease không tồn tại trên blockchain, chỉ cập nhật database');
          
          await connection.execute(
            'UPDATE leases SET is_active = 0, is_completed = 1 WHERE id = ?',
            [lease.id]
          );

          // Trả lại diện tích cho warehouse
          await connection.execute(
            'UPDATE warehouses SET available_area = available_area + ? WHERE id = ?',
            [lease.area, lease.warehouse_id]
          );

          console.log('   ✅ Đã hoàn thành trong database');
          completedCount++;
          continue;
        }

        // Kiểm tra trạng thái
        if (blockchainLease.isCompleted) {
          console.log('   ℹ️  Đã hoàn thành trên blockchain, cập nhật database');
          
          await connection.execute(
            'UPDATE leases SET is_active = 0, is_completed = 1 WHERE id = ?',
            [lease.id]
          );

          // Trả lại diện tích cho warehouse
          await connection.execute(
            'UPDATE warehouses SET available_area = available_area + ? WHERE id = ?',
            [lease.area, lease.warehouse_id]
          );

          console.log('   ✅ Đã đồng bộ với blockchain');
          completedCount++;
          continue;
        }

        if (!blockchainLease.isActive) {
          console.log('   ⚠️  Lease không active trên blockchain');
          
          await connection.execute(
            'UPDATE leases SET is_active = 0 WHERE id = ?',
            [lease.id]
          );

          console.log('   ✅ Đã cập nhật trạng thái');
          failedCount++;
          continue;
        }

        // Hoàn thành lease trên blockchain
        console.log('   🔄 Đang hoàn thành trên blockchain...');
        
        const tx = await contract.completeLease(lease.blockchain_id, {
          gasLimit: 500000
        });

        console.log('   ⏳ Đang chờ xác nhận...');
        await tx.wait();
        
        console.log('   ✅ Đã hoàn thành trên blockchain!');

        // Cập nhật database
        await connection.execute(
          'UPDATE leases SET is_active = 0, is_completed = 1 WHERE id = ?',
          [lease.id]
        );

        // Warehouse đã được cập nhật tự động bởi smart contract
        // Nhưng cần sync lại database
        const warehouse = await contract.getWarehouse(blockchainLease.warehouseId);
        await connection.execute(
          'UPDATE warehouses SET available_area = ? WHERE blockchain_id = ?',
          [warehouse.availableArea.toString(), blockchainLease.warehouseId.toString()]
        );

        console.log('   ✅ Đã cập nhật database');
        completedCount++;

      } catch (error) {
        console.log(`   ❌ Lỗi: ${error.message}`);
        failedCount++;
      }

      console.log('');
    }

    // Tổng kết
    console.log('='.repeat(70));
    console.log('📊 KẾT QUẢ');
    console.log('='.repeat(70));
    console.log(`✅ Đã hoàn thành: ${completedCount} hợp đồng`);
    console.log(`❌ Thất bại: ${failedCount} hợp đồng`);
    console.log(`📦 Tổng số xử lý: ${expiredLeases.length}`);
    console.log('='.repeat(70) + '\n');

  } catch (error) {
    console.error('❌ Lỗi:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Chạy ngay
if (require.main === module) {
  autoCompleteExpiredLeases()
    .then(() => {
      console.log('✅ Hoàn tất!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Lỗi:', error);
      process.exit(1);
    });
}

module.exports = autoCompleteExpiredLeases;

