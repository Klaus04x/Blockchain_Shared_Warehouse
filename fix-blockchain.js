#!/usr/bin/env node

/**
 * Script Fix Blockchain Issues
 * Tự động sửa các vấn đề blockchain phổ biến
 */

const { ethers } = require('ethers');
const mysql = require('mysql2/promise');
const ContractAddressManager = require('./contract-address-manager');

async function fixBlockchainIssues() {
  console.log('🔧 Đang sửa các vấn đề blockchain...');
  console.log('='.repeat(50));

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
      console.log('❌ Không tìm thấy contract, đang deploy contract mới...');
      return;
    }

    const contract = new ethers.Contract(contractData.address, contractData.abi, wallet);

    console.log('✅ Đã kết nối database và blockchain');
    console.log('💰 Số dư tài khoản:', ethers.formatEther(await provider.getBalance(wallet.address)), 'ETH');

    // Kiểm tra số warehouses trên blockchain
    const blockchainCounter = await contract.warehouseCounter();
    console.log(`⛓️ Số warehouses trên blockchain: ${blockchainCounter.toString()}`);

    // Lấy số warehouses trong database
    const [dbRows] = await connection.execute('SELECT COUNT(*) as count FROM warehouses WHERE is_active = 1');
    const dbCount = dbRows[0].count;
    console.log(`📦 Số warehouses trong database: ${dbCount}`);

    // Nếu blockchain có ít warehouses hơn database, sync lại
    if (parseInt(blockchainCounter.toString()) < dbCount) {
      console.log('🔄 Blockchain có ít warehouses hơn database, đang sync lại...');
      
      // Reset tất cả blockchain_id về 0
      await connection.execute('UPDATE warehouses SET blockchain_id = 0 WHERE is_active = 1');
      console.log('✅ Đã reset tất cả blockchain_id về 0');

      // Lấy warehouses cần sync
      const [rows] = await connection.execute(`
        SELECT id, blockchain_id, owner_address, name, location, total_area, available_area,
               price_per_sqm_per_day, image_url, description, is_active
        FROM warehouses
        WHERE is_active = 1 AND (blockchain_id IS NULL OR blockchain_id = 0)
        ORDER BY id
      `);

      console.log(`📦 Tìm thấy ${rows.length} warehouses cần đồng bộ`);

      // Sync từng warehouse
      let syncedCount = 0;
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
          syncedCount++;

          // Đợi 2 giây giữa các giao dịch
          await new Promise(resolve => setTimeout(resolve, 2000));

        } catch (error) {
          console.error(`❌ Lỗi đồng bộ warehouse ${warehouse.id}:`, error.message);
        }
      }

      console.log(`\n🎉 Đã đồng bộ thành công ${syncedCount} warehouses!`);
    } else {
      console.log('✅ Blockchain và database đã đồng bộ');
    }

    // Kiểm tra lại
    const finalCounter = await contract.warehouseCounter();
    console.log(`\n⛓️ Số warehouses trên blockchain sau khi sửa: ${finalCounter.toString()}`);

  } catch (error) {
    console.error('❌ Lỗi sửa blockchain:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Chạy fix
fixBlockchainIssues().then(() => {
  console.log('\n🏁 Fix blockchain hoàn thành!');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Fix blockchain thất bại:', error.message);
  process.exit(1);
});
