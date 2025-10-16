#!/usr/bin/env node

/**
 * Script để debug và kiểm tra các vấn đề thanh toán
 * Chạy: node debug-payment.js
 */

const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// Cấu hình
const RPC_URL = 'http://127.0.0.1:8545';
const CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3'; // Thay đổi theo contract đã deploy

async function debugPayment() {
  console.log('🔍 Bắt đầu debug thanh toán...\n');

  try {
    // Kết nối provider
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    console.log('✅ Đã kết nối với blockchain');

    // Kiểm tra network
    const network = await provider.getNetwork();
    console.log(`📡 Network: ${network.name} (Chain ID: ${network.chainId})`);

    // Load contract ABI
    const contractPath = path.join(__dirname, 'backend', 'contracts', 'WarehouseLeasing.json');
    if (!fs.existsSync(contractPath)) {
      console.error('❌ Không tìm thấy contract ABI');
      return;
    }
    
    const contractData = JSON.parse(fs.readFileSync(contractPath, 'utf-8'));
    const contract = new ethers.Contract(CONTRACT_ADDRESS, contractData.abi, provider);
    console.log('✅ Đã load contract ABI');

    // Kiểm tra contract có hoạt động không
    try {
      const warehouseCounter = await contract.warehouseCounter();
      console.log(`📦 Số lượng warehouse: ${warehouseCounter}`);
    } catch (error) {
      console.error('❌ Contract không hoạt động:', error.message);
      return;
    }

    // Kiểm tra các warehouse
    console.log('\n📋 Kiểm tra các warehouse:');
    const warehouseCount = await contract.warehouseCounter();
    
    for (let i = 1; i <= warehouseCount; i++) {
      try {
        const warehouse = await contract.getWarehouse(i);
        console.log(`\n🏢 Warehouse ${i}:`);
        console.log(`   - Owner: ${warehouse.owner}`);
        console.log(`   - Name: ${warehouse.name}`);
        console.log(`   - Active: ${warehouse.isActive}`);
        console.log(`   - Total Area: ${warehouse.totalArea} m²`);
        console.log(`   - Available Area: ${warehouse.availableArea} m²`);
        console.log(`   - Price: ${ethers.formatEther(warehouse.pricePerSqmPerDay)} ETH/m²/day`);
        
        if (warehouse.owner === ethers.ZeroAddress) {
          console.log('   ⚠️  WARNING: Owner là zero address');
        }
        if (!warehouse.isActive) {
          console.log('   ⚠️  WARNING: Warehouse không active');
        }
        if (warehouse.availableArea === 0) {
          console.log('   ⚠️  WARNING: Không còn diện tích trống');
        }
      } catch (error) {
        console.log(`   ❌ Lỗi khi lấy warehouse ${i}: ${error.message}`);
      }
    }

    // Kiểm tra các account và số dư
    console.log('\n💰 Kiểm tra số dư các account:');
    const accounts = [
      '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', // Account 0
      '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', // Account 1
      '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', // Account 2
    ];

    for (let i = 0; i < accounts.length; i++) {
      try {
        const balance = await provider.getBalance(accounts[i]);
        console.log(`   Account ${i}: ${ethers.formatEther(balance)} ETH`);
        
        if (balance === 0n) {
          console.log(`   ⚠️  WARNING: Account ${i} không có ETH`);
        }
      } catch (error) {
        console.log(`   ❌ Lỗi khi kiểm tra account ${i}: ${error.message}`);
      }
    }

    // Kiểm tra gas price
    console.log('\n⛽ Kiểm tra gas:');
    try {
      const feeData = await provider.getFeeData();
      console.log(`   Gas Price: ${ethers.formatUnits(feeData.gasPrice, 'gwei')} Gwei`);
      console.log(`   Max Fee: ${ethers.formatUnits(feeData.maxFeePerGas, 'gwei')} Gwei`);
      console.log(`   Max Priority Fee: ${ethers.formatUnits(feeData.maxPriorityFeePerGas, 'gwei')} Gwei`);
    } catch (error) {
      console.log(`   ❌ Lỗi khi lấy gas info: ${error.message}`);
    }

    console.log('\n✅ Debug hoàn thành!');
    console.log('\n📝 Khuyến nghị:');
    console.log('1. Đảm bảo tất cả warehouse có owner hợp lệ và isActive = true');
    console.log('2. Kiểm tra số dư ETH của account đang sử dụng');
    console.log('3. Nếu cần, chạy: npx hardhat run scripts/fund-accounts.js --network localhost');
    console.log('4. Kiểm tra gas settings trong MetaMask');

  } catch (error) {
    console.error('❌ Lỗi debug:', error.message);
  }
}

// Chạy debug
debugPayment().catch(console.error);
