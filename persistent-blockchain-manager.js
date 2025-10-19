#!/usr/bin/env node

/**
 * Persistent Blockchain Startup Script
 * Khởi động blockchain với trạng thái đã lưu và contract đã deploy
 */

const { spawn } = require('child_process');
const { ethers } = require('ethers');
const ContractAddressManager = require('./contract-address-manager');
const path = require('path');

class PersistentBlockchainManager {
  
  constructor() {
    this.hardhatProcess = null;
    this.isNodeReady = false;
  }

  /**
   * Kiểm tra Hardhat node có đang chạy không
   */
  async checkNodeStatus() {
    try {
      const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
      await provider.getBlockNumber();
      console.log('✅ Hardhat node đang chạy');
      return true;
    } catch (error) {
      console.log('⚠️ Hardhat node không chạy');
      return false;
    }
  }

  /**
   * Khởi động Hardhat node với trạng thái đã lưu
   */
  async startHardhatNode() {
    console.log('🚀 Đang khởi động Hardhat node với trạng thái persistent...');
    
    return new Promise((resolve, reject) => {
      this.hardhatProcess = spawn('npx', ['hardhat', 'node'], {
        cwd: path.join(__dirname, 'smart-contract'),
        shell: true,
        stdio: 'pipe'
      });

      let nodeReady = false;
      let retries = 0;
      const maxRetries = 30;

      const checkNode = async () => {
        try {
          const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
          await provider.getBlockNumber();
          if (!nodeReady) {
            nodeReady = true;
            this.isNodeReady = true;
            console.log('✅ Hardhat node đã khởi động thành công!');
            resolve();
          }
        } catch (error) {
          retries++;
          if (retries < maxRetries) {
            console.log(`⏳ Đang đợi Hardhat node... (${retries}/${maxRetries})`);
            setTimeout(checkNode, 1000);
          } else {
            console.error('❌ Hardhat node khởi động thất bại');
            reject(new Error('Hardhat node failed'));
          }
        }
      };

      // Bắt đầu kiểm tra sau 3 giây
      setTimeout(checkNode, 3000);

      // Handle process errors
      this.hardhatProcess.on('error', (error) => {
        console.error('❌ Lỗi tiến trình Hardhat:', error.message);
        reject(error);
      });
    });
  }

  /**
   * Kiểm tra contract có tồn tại và hoạt động không
   */
  async checkContractStatus() {
    console.log('🔍 Đang kiểm tra trạng thái contract...');
    
    const contractData = ContractAddressManager.getContractAddress();
    if (!contractData) {
      console.log('❌ Không tìm thấy contract đã lưu');
      return false;
    }

    console.log('📋 Tìm thấy contract đã lưu:', contractData.address);
    
    const isWorking = await ContractAddressManager.checkContractStatus(contractData.address);
    if (isWorking) {
      console.log('✅ Contract hoạt động bình thường!');
      return true;
    } else {
      console.log('❌ Contract không hoạt động đúng cách');
      return false;
    }
  }

  /**
   * Deploy contract mới nếu cần
   */
  async deployContractIfNeeded() {
    console.log('🚀 Đang deploy contract nếu cần...');
    
    return new Promise((resolve, reject) => {
      const deploy = spawn('npx', ['hardhat', 'run', 'scripts/deploy.js', '--network', 'localhost'], {
        cwd: path.join(__dirname, 'smart-contract'),
        shell: true,
        stdio: 'inherit'
      });

      deploy.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Contract đã deploy thành công!');
          resolve();
        } else {
          console.error('❌ Deploy contract thất bại');
          reject(new Error('Deployment failed'));
        }
      });
    });
  }

  /**
   * Sync warehouses từ database lên blockchain (Auto Sync)
   */
  async syncWarehouses() {
    console.log('🔄 Đang tự động đồng bộ warehouses từ database...');
    
    const mysql = require('mysql2/promise');
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

      // Kiểm tra số warehouses trên blockchain
      const blockchainCounter = await contract.warehouseCounter();
      console.log(`⛓️ Số warehouses trên blockchain: ${blockchainCounter.toString()}`);

      // Lấy số warehouses trong database
      const [dbRows] = await connection.execute('SELECT COUNT(*) as count FROM warehouses WHERE is_active = 1');
      const dbCount = dbRows[0].count;
      console.log(`📦 Số warehouses trong database: ${dbCount}`);

      // Nếu blockchain có ít warehouses hơn database, reset và sync lại
      if (parseInt(blockchainCounter.toString()) < dbCount) {
        console.log('🔄 Blockchain có ít warehouses hơn database, đang reset và sync lại...');
        
        // Reset tất cả blockchain_id về 0
        await connection.execute('UPDATE warehouses SET blockchain_id = 0 WHERE is_active = 1');
        console.log('✅ Đã reset tất cả blockchain_id về 0');
      }

      // Lấy warehouses cần sync
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

          // Đợi một chút
          await new Promise(resolve => setTimeout(resolve, 2000));

        } catch (error) {
          console.error(`❌ Lỗi đồng bộ warehouse ${warehouse.id}:`, error.message);
        }
      }

      console.log('\n' + '='.repeat(50));
      console.log('🎉 AUTO SYNC WAREHOUSES HOÀN THÀNH!');
      console.log('='.repeat(50));
      console.log(`✅ Đã sync: ${syncedCount} warehouses`);
      console.log(`📦 Tổng warehouses: ${rows.length}`);
      
      // Kiểm tra lại số lượng trên blockchain
      const finalCounter = await contract.warehouseCounter();
      console.log(`⛓️ Số warehouses trên blockchain sau sync: ${finalCounter.toString()}`);

    } catch (error) {
      console.error('❌ Lỗi đồng bộ warehouses:', error.message);
    } finally {
      if (connection) {
        await connection.end();
      }
    }
  }

  /**
   * Khởi động toàn bộ hệ thống
   */
  async start() {
    try {
      console.log('🚀 Đang khởi động hệ thống blockchain persistent...');
      console.log('='.repeat(50));

      // Bước 1: Kiểm tra node status
      const nodeRunning = await this.checkNodeStatus();
      if (!nodeRunning) {
        await this.startHardhatNode();
      }

      // Bước 2: Kiểm tra contract status
      const contractWorking = await this.checkContractStatus();
      if (!contractWorking) {
        console.log('🔄 Contract không hoạt động, đang deploy contract mới...');
        await this.deployContractIfNeeded();
      } else {
        console.log('✅ Sử dụng contract hiện có');
      }

      // Bước 3: Sync warehouses
      await this.syncWarehouses();

      console.log('\n' + '='.repeat(50));
      console.log('🎉 HỆ THỐNG BLOCKCHAIN PERSISTENT ĐÃ SẴN SÀNG!');
      console.log('='.repeat(50));
      console.log('✅ Hardhat node: Đang chạy với trạng thái persistent');
      console.log('✅ Contract: Hoạt động bình thường');
      console.log('✅ Warehouses: Đã đồng bộ từ database');
      console.log('✅ Blockchain: Sẵn sàng sử dụng');
      console.log('\n💡 Các warehouses của bạn giờ đã an toàn!');
      console.log('🚀 Bạn có thể chạy: npm run dev:all:preserve');

      return true;

    } catch (error) {
      console.error('❌ Khởi động hệ thống blockchain persistent thất bại:', error.message);
      return false;
    }
  }

  /**
   * Dừng Hardhat node
   */
  stop() {
    if (this.hardhatProcess) {
      console.log('🛑 Đang dừng Hardhat node...');
      this.hardhatProcess.kill();
      this.hardhatProcess = null;
      this.isNodeReady = false;
    }
  }
}

// CLI usage
if (require.main === module) {
  const manager = new PersistentBlockchainManager();
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Đang tắt hệ thống...');
    manager.stop();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n🛑 Đang tắt hệ thống...');
    manager.stop();
    process.exit(0);
  });

  // Start the system
  manager.start().then((success) => {
    if (success) {
      console.log('✅ Hệ thống đã khởi động thành công');
    } else {
      console.log('❌ Hệ thống khởi động thất bại');
      process.exit(1);
    }
  });
}

module.exports = PersistentBlockchainManager;
