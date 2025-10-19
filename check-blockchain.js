#!/usr/bin/env node

/**
 * Script để kiểm tra và sửa các vấn đề blockchain
 * Chạy: node check-blockchain.js
 */

const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// Cấu hình
const RPC_URL = 'http://127.0.0.1:8545';
const CONTRACT_ADDRESS = '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9'; // Thay đổi theo contract đã deploy

async function checkBlockchain() {
  console.log('🔍 Kiểm tra blockchain connection...\n');

  try {
    // 1. Kiểm tra kết nối RPC
    console.log('1️⃣ Kiểm tra RPC connection...');
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    
    try {
      const blockNumber = await provider.getBlockNumber();
      console.log(`✅ RPC kết nối thành công. Block hiện tại: ${blockNumber}`);
    } catch (rpcErr) {
      console.error('❌ RPC connection failed:', rpcErr.message);
      console.log('\n🔧 Giải pháp:');
      console.log('1. Kiểm tra Hardhat node có đang chạy không:');
      console.log('   npx hardhat node');
      console.log('2. Kiểm tra port 8545 có bị block không');
      return;
    }

    // 2. Kiểm tra contract
    console.log('\n2️⃣ Kiểm tra contract...');
    const contractPath = path.join(__dirname, 'backend', 'contracts', 'WarehouseLeasing.json');
    
    if (!fs.existsSync(contractPath)) {
      console.error('❌ Không tìm thấy contract ABI');
      console.log('\n🔧 Giải pháp:');
      console.log('1. Deploy contract trước:');
      console.log('   cd smart-contract');
      console.log('   npx hardhat run scripts/deploy.js --network localhost');
      return;
    }
    
    const contractData = JSON.parse(fs.readFileSync(contractPath, 'utf-8'));
    console.log(`✅ Contract ABI loaded. Address: ${contractData.address}`);
    
    // 3. Kiểm tra contract trên blockchain
    const contract = new ethers.Contract(contractData.address, contractData.abi, provider);
    
    try {
      const warehouseCounter = await contract.warehouseCounter();
      console.log(`✅ Contract hoạt động. Số warehouse: ${warehouseCounter}`);
    } catch (contractErr) {
      console.error('❌ Contract không hoạt động:', contractErr.message);
      console.log('\n🔧 Giải pháp:');
      console.log('1. Redeploy contract:');
      console.log('   cd smart-contract');
      console.log('   npx hardhat run scripts/deploy.js --network localhost');
      console.log('2. Cập nhật contract address trong frontend');
      return;
    }

    // 4. Kiểm tra các warehouse
    console.log('\n3️⃣ Kiểm tra warehouses...');
    const warehouseCount = await contract.warehouseCounter();
    
    if (warehouseCount === 0) {
      console.log('⚠️  Chưa có warehouse nào trên blockchain');
      console.log('\n🔧 Giải pháp:');
      console.log('1. Seed warehouses:');
      console.log('   curl -X POST http://localhost:5000/api/warehouses/seed');
      console.log('2. Hoặc đăng ký warehouse mới từ frontend');
    } else {
      console.log(`📦 Tìm thấy ${warehouseCount} warehouses:`);
      
      for (let i = 1; i <= warehouseCount; i++) {
        try {
          const warehouse = await contract.getWarehouse(i);
          console.log(`\n🏢 Warehouse ${i}:`);
          console.log(`   - Owner: ${warehouse.owner}`);
          console.log(`   - Name: ${warehouse.name}`);
          console.log(`   - Active: ${warehouse.isActive}`);
          console.log(`   - Available Area: ${warehouse.availableArea} m²`);
          
          if (warehouse.owner === ethers.ZeroAddress) {
            console.log('   ⚠️  WARNING: Owner là zero address');
          }
          if (!warehouse.isActive) {
            console.log('   ⚠️  WARNING: Warehouse không active');
          }
        } catch (warehouseErr) {
          console.log(`   ❌ Lỗi khi lấy warehouse ${i}: ${warehouseErr.message}`);
        }
      }
    }

    // 5. Kiểm tra database sync
    console.log('\n4️⃣ Kiểm tra database sync...');
    try {
      const response = await fetch('http://localhost:5000/api/warehouses');
      const warehouses = await response.json();
      
      console.log(`📊 Database có ${warehouses.length} warehouses`);
      
      // So sánh với blockchain
      const dbWarehouses = warehouses.filter(w => w.blockchain_id && w.blockchain_id > 0);
      console.log(`🔗 ${dbWarehouses.length} warehouses đã sync với blockchain`);
      
      const unsynced = warehouses.filter(w => !w.blockchain_id || w.blockchain_id === 0);
      if (unsynced.length > 0) {
        console.log(`⚠️  ${unsynced.length} warehouses chưa sync với blockchain:`);
        unsynced.forEach(w => {
          console.log(`   - ${w.name} (ID: ${w.id})`);
        });
      }
      
    } catch (dbErr) {
      console.error('❌ Không thể kết nối database:', dbErr.message);
      console.log('\n🔧 Giải pháp:');
      console.log('1. Kiểm tra backend server có chạy không:');
      console.log('   cd backend && npm start');
      console.log('2. Kiểm tra database connection');
    }

    console.log('\n✅ Kiểm tra hoàn thành!');
    
    // 6. Khuyến nghị
    console.log('\n📝 Khuyến nghị:');
    if (warehouseCount === 0) {
      console.log('1. Seed warehouses để có dữ liệu test');
      console.log('2. Hoặc đăng ký warehouse mới từ frontend');
    }
    console.log('3. Đảm bảo Hardhat node luôn chạy khi test');
    console.log('4. Reset MetaMask account nếu gặp lỗi "Dropped"');

  } catch (error) {
    console.error('❌ Lỗi kiểm tra:', error.message);
  }
}

// Chạy kiểm tra
checkBlockchain().catch(console.error);


