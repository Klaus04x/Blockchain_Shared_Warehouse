#!/usr/bin/env node

/**
 * Contract Address Manager
 * Quản lý địa chỉ smart contract để tránh deploy lại
 */

const fs = require('fs');
const path = require('path');

const CONTRACT_ADDRESS_FILE = path.join(__dirname, 'contract-address.json');
const BACKEND_CONTRACT_FILE = path.join(__dirname, 'backend', 'contracts', 'WarehouseLeasing.json');
const FRONTEND_CONTRACT_FILE = path.join(__dirname, 'frontend', 'src', 'contracts', 'WarehouseLeasing.json');

class ContractAddressManager {
  
  /**
   * Lưu địa chỉ contract và metadata
   */
  static saveContractAddress(address, abi, deployInfo = {}) {
    const contractData = {
      address: address,
      abi: abi,
      deployedAt: new Date().toISOString(),
      deployInfo: {
        chainId: 1337,
        network: 'localhost',
        ...deployInfo
      }
    };

    try {
      // Lưu vào file chính
      fs.writeFileSync(CONTRACT_ADDRESS_FILE, JSON.stringify(contractData, null, 2));
      console.log('✅ Đã lưu địa chỉ contract vào:', CONTRACT_ADDRESS_FILE);

      // Lưu vào backend
      this.ensureDirectoryExists(path.dirname(BACKEND_CONTRACT_FILE));
      fs.writeFileSync(BACKEND_CONTRACT_FILE, JSON.stringify(contractData, null, 2));
      console.log('✅ Đã lưu địa chỉ contract vào backend');

      // Lưu vào frontend
      this.ensureDirectoryExists(path.dirname(FRONTEND_CONTRACT_FILE));
      fs.writeFileSync(FRONTEND_CONTRACT_FILE, JSON.stringify(contractData, null, 2));
      console.log('✅ Đã lưu địa chỉ contract vào frontend');

      return true;
    } catch (error) {
      console.error('❌ Lỗi lưu địa chỉ contract:', error.message);
      return false;
    }
  }

  /**
   * Đọc địa chỉ contract đã lưu
   */
  static getContractAddress() {
    try {
      if (fs.existsSync(CONTRACT_ADDRESS_FILE)) {
        const data = JSON.parse(fs.readFileSync(CONTRACT_ADDRESS_FILE, 'utf8'));
        console.log('✅ Tìm thấy địa chỉ contract đã lưu:', data.address);
        console.log('📅 Được deploy lúc:', data.deployedAt);
        return data;
      } else {
        console.log('⚠️ Không tìm thấy địa chỉ contract đã lưu');
        return null;
      }
    } catch (error) {
      console.error('❌ Lỗi đọc địa chỉ contract:', error.message);
      return null;
    }
  }

  /**
   * Kiểm tra contract có tồn tại và hoạt động không
   */
  static async checkContractStatus(address) {
    try {
      const { ethers } = require('ethers');
      const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
      
      // Kiểm tra kết nối
      await provider.getBlockNumber();
      
      // Kiểm tra contract có tồn tại không
      const code = await provider.getCode(address);
      if (code === '0x') {
        console.log('❌ Contract không tồn tại tại địa chỉ:', address);
        return false;
      }

      // Kiểm tra contract có hoạt động không
      const contractABI = this.getContractAddress()?.abi;
      if (contractABI) {
        const contract = new ethers.Contract(address, contractABI, provider);
        try {
          const counter = await contract.warehouseCounter();
          console.log('✅ Contract đang hoạt động! Số lượng warehouse:', counter.toString());
          return true;
        } catch (error) {
          console.log('⚠️ Contract tồn tại nhưng có thể không hoạt động đúng cách');
          return false;
        }
      }

      console.log('✅ Contract tồn tại tại địa chỉ:', address);
      return true;
    } catch (error) {
      console.error('❌ Lỗi kiểm tra trạng thái contract:', error.message);
      return false;
    }
  }

  /**
   * Xóa địa chỉ contract đã lưu (để deploy lại)
   */
  static clearContractAddress() {
    try {
      if (fs.existsSync(CONTRACT_ADDRESS_FILE)) {
        fs.unlinkSync(CONTRACT_ADDRESS_FILE);
        console.log('✅ Đã xóa địa chỉ contract đã lưu');
      }
      
      if (fs.existsSync(BACKEND_CONTRACT_FILE)) {
        fs.unlinkSync(BACKEND_CONTRACT_FILE);
        console.log('✅ Đã xóa file contract backend');
      }
      
      if (fs.existsSync(FRONTEND_CONTRACT_FILE)) {
        fs.unlinkSync(FRONTEND_CONTRACT_FILE);
        console.log('✅ Đã xóa file contract frontend');
      }
      
      return true;
    } catch (error) {
      console.error('❌ Lỗi xóa địa chỉ contract:', error.message);
      return false;
    }
  }

  /**
   * Đảm bảo thư mục tồn tại
   */
  static ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  /**
   * Lấy thông tin chi tiết về contract
   */
  static getContractInfo() {
    const contractData = this.getContractAddress();
    if (!contractData) {
      return null;
    }

    return {
      address: contractData.address,
      deployedAt: contractData.deployedAt,
      chainId: contractData.deployInfo?.chainId,
      network: contractData.deployInfo?.network,
      hasABI: !!contractData.abi
    };
  }
}

// Export cho sử dụng trong các script khác
module.exports = ContractAddressManager;

// CLI usage
if (require.main === module) {
  const command = process.argv[2];
  const address = process.argv[3];

  switch (command) {
    case 'get':
      const data = ContractAddressManager.getContractAddress();
      if (data) {
        console.log('📋 Contract Address:', data.address);
        console.log('📅 Deployed At:', data.deployedAt);
        console.log('🔗 Chain ID:', data.deployInfo?.chainId);
        console.log('🌐 Network:', data.deployInfo?.network);
      }
      break;

    case 'check':
      if (address) {
        ContractAddressManager.checkContractStatus(address);
      } else {
        const savedData = ContractAddressManager.getContractAddress();
        if (savedData) {
          ContractAddressManager.checkContractStatus(savedData.address);
        } else {
          console.log('❌ No contract address to check');
        }
      }
      break;

    case 'clear':
      ContractAddressManager.clearContractAddress();
      break;

    case 'info':
      const info = ContractAddressManager.getContractInfo();
      if (info) {
        console.log('📊 Contract Info:');
        console.log(JSON.stringify(info, null, 2));
      } else {
        console.log('❌ No contract info available');
      }
      break;

    default:
      console.log('Usage:');
      console.log('  node contract-address-manager.js get          - Get saved contract address');
      console.log('  node contract-address-manager.js check [addr] - Check contract status');
      console.log('  node contract-address-manager.js clear        - Clear saved contract address');
      console.log('  node contract-address-manager.js info         - Get contract info');
      break;
  }
}
