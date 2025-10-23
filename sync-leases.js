#!/usr/bin/env node

/**
 * Script Sync và Verify Leases
 * Kiểm tra và đồng bộ trạng thái leases giữa Database và Blockchain
 * 
 * LƯU Ý: Script này KHÔNG TẠO leases mới trên blockchain
 * Chỉ verify và update trạng thái từ blockchain về database
 */

const { ethers } = require('ethers');
const mysql = require('mysql2/promise');
const ContractAddressManager = require('./contract-address-manager');

async function syncLeases() {
  console.log('\n' + '='.repeat(70));
  console.log('🔄 ĐỒNG BỘ VÀ VERIFY LEASES');
  console.log('='.repeat(70) + '\n');

  let connection = null;

  try {
    // Kết nối database
    console.log('📡 Đang kết nối database...');
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'warehouse_sharing'
    });
    console.log('✅ Đã kết nối database\n');

    // Kết nối blockchain
    console.log('⛓️  Đang kết nối blockchain...');
    const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
    
    try {
      await provider.getBlockNumber();
      console.log('✅ Đã kết nối blockchain\n');
    } catch (error) {
      console.log('❌ Không thể kết nối blockchain!');
      console.log('💡 Chạy: npm run dev:blockchain');
      process.exit(1);
    }

    const privateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
    const wallet = new ethers.Wallet(privateKey, provider);

    const contractData = ContractAddressManager.getContractAddress();
    if (!contractData) {
      console.log('❌ Không tìm thấy dữ liệu contract');
      process.exit(1);
    }

    const contract = new ethers.Contract(contractData.address, contractData.abi, wallet);

    // Lấy số lượng leases trên blockchain
    const blockchainLeaseCounter = await contract.leaseCounter();
    console.log('📊 Thống kê:');
    console.log(`   ⛓️  Số leases trên blockchain: ${blockchainLeaseCounter.toString()}`);

    // Lấy tất cả leases từ database
    const [dbLeases] = await connection.execute(`
      SELECT id, blockchain_id, warehouse_id, tenant_address, area, 
             start_date, end_date, total_price, is_active, is_completed, transaction_hash
      FROM leases
      ORDER BY id
    `);

    console.log(`   📦 Số leases trong database: ${dbLeases.length}\n`);

    if (dbLeases.length === 0) {
      console.log('✅ Không có leases nào trong database');
      return;
    }

    console.log('🔍 Đang verify từng lease...\n');

    let validCount = 0;
    let invalidCount = 0;
    let updatedCount = 0;
    let issuesFound = [];

    for (const dbLease of dbLeases) {
      console.log(`📋 Lease DB ID ${dbLease.id} (Blockchain ID: ${dbLease.blockchain_id}):`);
      
      try {
        // Kiểm tra lease trên blockchain
        const blockchainLease = await contract.getLease(dbLease.blockchain_id);
        
        // Kiểm tra nếu lease tồn tại trên blockchain
        // tenant === ZeroAddress nghĩa là struct chưa được khởi tạo (lease không tồn tại)
        if (blockchainLease.tenant === ethers.ZeroAddress) {
          console.log(`   ❌ KHÔNG TỒN TẠI trên blockchain!`);
          console.log(`   💡 Lease này đã bị mất hoặc blockchain_id sai`);
          invalidCount++;
          issuesFound.push({
            id: dbLease.id,
            issue: 'Không tồn tại trên blockchain',
            blockchain_id: dbLease.blockchain_id
          });
          continue;
        }

        // So sánh dữ liệu
        const matches = {
          tenant: blockchainLease.tenant.toLowerCase() === dbLease.tenant_address.toLowerCase(),
          area: parseInt(blockchainLease.area.toString()) === parseInt(dbLease.area),
          totalPrice: blockchainLease.totalPrice.toString() === dbLease.total_price.toString(),
          isActive: blockchainLease.isActive === Boolean(dbLease.is_active),
          isCompleted: blockchainLease.isCompleted === Boolean(dbLease.is_completed)
        };

        const allMatch = Object.values(matches).every(m => m);

        if (allMatch) {
          console.log('   ✅ Hợp lệ - Dữ liệu khớp với blockchain');
          validCount++;
        } else {
          console.log('   ⚠️  Có sự khác biệt:');
          
          if (!matches.tenant) console.log(`      - Tenant: DB=${dbLease.tenant_address}, BC=${blockchainLease.tenant}`);
          if (!matches.area) console.log(`      - Area: DB=${dbLease.area}, BC=${blockchainLease.area.toString()}`);
          if (!matches.totalPrice) console.log(`      - Price: DB=${dbLease.total_price}, BC=${blockchainLease.totalPrice.toString()}`);
          if (!matches.isActive) console.log(`      - Active: DB=${dbLease.is_active}, BC=${blockchainLease.isActive}`);
          if (!matches.isCompleted) console.log(`      - Completed: DB=${dbLease.is_completed}, BC=${blockchainLease.isCompleted}`);

          // Update database nếu trạng thái khác
          if (!matches.isActive || !matches.isCompleted) {
            console.log('   🔄 Đang cập nhật trạng thái từ blockchain...');
            
            await connection.execute(
              'UPDATE leases SET is_active = ?, is_completed = ? WHERE id = ?',
              [blockchainLease.isActive, blockchainLease.isCompleted, dbLease.id]
            );
            
            console.log('   ✅ Đã cập nhật trạng thái');
            updatedCount++;
          }

          validCount++;
        }

      } catch (error) {
        console.log(`   ❌ Lỗi khi kiểm tra: ${error.message}`);
        invalidCount++;
        issuesFound.push({
          id: dbLease.id,
          issue: error.message,
          blockchain_id: dbLease.blockchain_id
        });
      }

      console.log('');
    }

    // Tổng kết
    console.log('\n' + '='.repeat(70));
    console.log('📊 KẾT QUẢ ĐỒNG BỘ');
    console.log('='.repeat(70));
    console.log(`✅ Leases hợp lệ: ${validCount}`);
    console.log(`❌ Leases không hợp lệ: ${invalidCount}`);
    console.log(`🔄 Leases đã cập nhật: ${updatedCount}`);
    console.log(`📦 Tổng số leases: ${dbLeases.length}`);

    if (issuesFound.length > 0) {
      console.log('\n⚠️  CÁC VẤN ĐỀ PHÁT HIỆN:');
      issuesFound.forEach((issue, index) => {
        console.log(`${index + 1}. Lease DB ID ${issue.id} (Blockchain ID: ${issue.blockchain_id})`);
        console.log(`   → ${issue.issue}`);
      });

      console.log('\n💡 KHUYẾN NGHỊ:');
      console.log('   1. Nếu blockchain bị reset: Không thể khôi phục leases');
      console.log('   2. Sử dụng persistent blockchain (hardhat-data) để tránh mất dữ liệu');
      console.log('   3. Có thể xóa leases không hợp lệ khỏi database:');
      console.log('      DELETE FROM leases WHERE blockchain_id IN (...);');
    }

    console.log('\n' + '='.repeat(70) + '\n');

  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    console.error(error.stack);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// CLI usage
if (require.main === module) {
  syncLeases()
    .then(() => {
      console.log('✅ Hoàn thành!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Lỗi:', error);
      process.exit(1);
    });
}

module.exports = syncLeases;

