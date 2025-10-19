#!/usr/bin/env node

/**
 * Script Sync Warehouses từ Database lên Blockchain
 * Đồng bộ warehouses chưa có blockchain_id
 */

const { ethers } = require('ethers');
const mysql = require('mysql2/promise');
const ContractAddressManager = require('./contract-address-manager');

async function syncWarehouses() {
  console.log('🔄 Đang đồng bộ warehouses từ database lên blockchain...');
  
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
      console.log('❌ Không tìm thấy dữ liệu contract để đồng bộ');
      return;
    }

    const contract = new ethers.Contract(contractData.address, contractData.abi, wallet);

    console.log('✅ Đã kết nối database và blockchain');
    console.log('💰 Số dư tài khoản:', ethers.formatEther(await provider.getBalance(wallet.address)), 'ETH');

    // Lấy warehouses cần sync (chưa có blockchain_id hoặc blockchain_id = 0)
    const [rows] = await connection.execute(`
      SELECT id, blockchain_id, owner_address, name, location, total_area, available_area,
             price_per_sqm_per_day, image_url, description, is_active
      FROM warehouses
      WHERE is_active = 1 AND (blockchain_id IS NULL OR blockchain_id = 0)
      ORDER BY id
    `);

    console.log(`📦 Tìm thấy ${rows.length} warehouses cần đồng bộ`);

    if (rows.length === 0) {
      console.log('✅ Không có warehouses nào cần đồng bộ');
      return;
    }

    // Sync từng warehouse
    for (const warehouse of rows) {
      console.log(`\n🚀 Đang đồng bộ warehouse: ${warehouse.name} (ID: ${warehouse.id})`);

      const name = warehouse.name || 'Unnamed Warehouse';
      const location = warehouse.location || 'Unknown Location';
      const totalArea = parseInt(warehouse.total_area) || 100;
      const pricePerSqmPerDay = BigInt(warehouse.price_per_sqm_per_day) || ethers.parseEther('1');
      const imageUrl = warehouse.image_url || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d';
      let description = (warehouse.description || 'No description').substring(0, 100);
      description = description.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

      const gasSettings = {
        gasPrice: ethers.parseUnits('20', 'gwei'),
        gasLimit: 1000000
      };

      try {
        const tx = await contract.registerWarehouse(
          name, location, totalArea, pricePerSqmPerDay, imageUrl, description,
          gasSettings
        );

        console.log('📝 Mã giao dịch:', tx.hash);
        const receipt = await tx.wait();
        console.log('✅ Giao dịch đã được xác nhận!');

        const newBlockchainId = await contract.warehouseCounter();
        await connection.execute(
          'UPDATE warehouses SET blockchain_id = ? WHERE id = ?',
          [newBlockchainId.toString(), warehouse.id]
        );

        console.log(`✅ Đã cập nhật warehouse ID ${warehouse.id} với blockchain_id: ${newBlockchainId.toString()}`);

        // Đợi 2 giây giữa các giao dịch
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        console.error(`❌ Lỗi đồng bộ warehouse ${warehouse.id}:`, error.message);
      }
    }

    console.log('\n🎉 Tất cả warehouses đã được đồng bộ thành công!');

  } catch (error) {
    console.error('❌ Lỗi đồng bộ warehouses:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Chạy sync
syncWarehouses().then(() => {
  console.log('\n🏁 Script hoàn thành!');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Script thất bại:', error.message);
  process.exit(1);
});
