#!/usr/bin/env node

/**
 * Script debug chi tiết để kiểm tra warehouse owner và payment flow
 */

const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// Cấu hình
const RPC_URL = 'http://127.0.0.1:8545';
const CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3';

async function debugWarehouseOwners() {
  console.log('🔍 Debug Warehouse Owners và Payment Flow\n');

  try {
    // Kết nối provider
    const provider = new ethers.JsonRpcProvider(RPC_URL, 1337);
    console.log('✅ Đã kết nối với blockchain');

    // Load contract
    const contractPath = path.join(__dirname, 'contracts', 'WarehouseLeasing.json');
    if (!fs.existsSync(contractPath)) {
      console.error('❌ Không tìm thấy contract ABI');
      return;
    }
    
    const contractData = JSON.parse(fs.readFileSync(contractPath, 'utf-8'));
    const contract = new ethers.Contract(CONTRACT_ADDRESS, contractData.abi, provider);
    console.log(`✅ Contract loaded: ${CONTRACT_ADDRESS}`);

    // Kiểm tra các account Hardhat
    console.log('\n💰 Hardhat Accounts:');
    const hardhatAccounts = [
      '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', // Account 0
      '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', // Account 1  
      '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', // Account 2
      '0x90F79bf6EB2c4f870365E785982E1f101E89b71', // Account 3
      '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65', // Account 4
    ];

    for (let i = 0; i < hardhatAccounts.length; i++) {
      const balance = await provider.getBalance(hardhatAccounts[i]);
      console.log(`   Account ${i}: ${hardhatAccounts[i]} - ${ethers.formatEther(balance)} ETH`);
    }

    // Kiểm tra contract balance
    const contractBalance = await provider.getBalance(CONTRACT_ADDRESS);
    console.log(`\n🏦 Contract Balance: ${ethers.formatEther(contractBalance)} ETH`);

    // Kiểm tra các warehouse và owner
    console.log('\n📦 Warehouse Analysis:');
    const warehouseCount = await contract.warehouseCounter();
    console.log(`   Tổng số warehouse: ${warehouseCount}`);

    if (warehouseCount > 0) {
      for (let i = 1; i <= warehouseCount; i++) {
        try {
          const warehouse = await contract.getWarehouse(i);
          console.log(`\n🏢 Warehouse ${i}:`);
          console.log(`   - Owner: ${warehouse.owner}`);
          console.log(`   - Name: ${warehouse.name}`);
          console.log(`   - Active: ${warehouse.isActive}`);
          console.log(`   - Available Area: ${warehouse.availableArea} m²`);
          console.log(`   - Price: ${ethers.formatEther(warehouse.pricePerSqmPerDay)} ETH/m²/day`);
          
          // Kiểm tra owner có trong danh sách account không
          const ownerIndex = hardhatAccounts.indexOf(warehouse.owner);
          if (ownerIndex !== -1) {
            console.log(`   ✅ Owner là Account ${ownerIndex}`);
            const ownerBalance = await provider.getBalance(warehouse.owner);
            console.log(`   💰 Owner Balance: ${ethers.formatEther(ownerBalance)} ETH`);
          } else {
            console.log(`   ⚠️  Owner không phải là Hardhat account`);
            console.log(`   ⚠️  Owner có thể là contract address hoặc address khác`);
          }
          
          // Kiểm tra owner có phải contract address không
          if (warehouse.owner === CONTRACT_ADDRESS) {
            console.log(`   🚨 PROBLEM: Owner là contract address!`);
            console.log(`   🚨 Đây là nguyên nhân tiền không vào ví owner!`);
          }
          
        } catch (error) {
          console.log(`   ❌ Lỗi khi lấy warehouse ${i}: ${error.message}`);
        }
      }
    }

    // Kiểm tra các lease
    console.log('\n📋 Lease Analysis:');
    const leaseCount = await contract.leaseCounter();
    console.log(`   Tổng số lease: ${leaseCount}`);

    if (leaseCount > 0) {
      for (let i = 1; i <= leaseCount; i++) {
        try {
          const lease = await contract.getLease(i);
          const warehouse = await contract.getWarehouse(lease.warehouseId);
          
          console.log(`\n📄 Lease ${i}:`);
          console.log(`   - Warehouse ID: ${lease.warehouseId}`);
          console.log(`   - Warehouse Owner: ${warehouse.owner}`);
          console.log(`   - Tenant: ${lease.tenant}`);
          console.log(`   - Area: ${lease.area} m²`);
          console.log(`   - Total Price: ${ethers.formatEther(lease.totalPrice)} ETH`);
          console.log(`   - Active: ${lease.isActive}`);
          console.log(`   - Completed: ${lease.isCompleted}`);
          
          // Tính toán phí và số tiền owner nhận
          const platformFeePercent = await contract.platformFeePercent();
          const platformFee = (lease.totalPrice * platformFeePercent) / 100n;
          const ownerPayment = lease.totalPrice - platformFee;
          
          console.log(`   - Platform Fee (${platformFeePercent}%): ${ethers.formatEther(platformFee)} ETH`);
          console.log(`   - Owner Payment: ${ethers.formatEther(ownerPayment)} ETH`);
          
          // Kiểm tra tenant và owner
          const tenantIndex = hardhatAccounts.indexOf(lease.tenant);
          const ownerIndex = hardhatAccounts.indexOf(warehouse.owner);
          
          if (tenantIndex !== -1) {
            console.log(`   - Tenant là Account ${tenantIndex}`);
          }
          
          if (ownerIndex !== -1) {
            console.log(`   - Owner là Account ${ownerIndex}`);
          } else if (warehouse.owner === CONTRACT_ADDRESS) {
            console.log(`   🚨 Owner là contract address - ĐÂY LÀ VẤN ĐỀ!`);
          }
          
        } catch (error) {
          console.log(`   ❌ Lỗi khi lấy lease ${i}: ${error.message}`);
        }
      }
    }

    // Kiểm tra platform fee
    console.log('\n⚙️ Platform Fee:');
    const platformFeePercent = await contract.platformFeePercent();
    console.log(`   Platform Fee: ${platformFeePercent}%`);

    // Kiểm tra contract owner
    console.log('\n👑 Contract Owner:');
    const contractOwner = await contract.owner();
    console.log(`   Contract Owner: ${contractOwner}`);
    
    const ownerIndex = hardhatAccounts.indexOf(contractOwner);
    if (ownerIndex !== -1) {
      console.log(`   Owner là Account ${ownerIndex}`);
    }

    console.log('\n✅ Debug hoàn thành!');
    
    // Phân tích kết quả
    console.log('\n📊 Phân tích:');
    if (contractBalance > 0n) {
      console.log(`💰 Contract có ${ethers.formatEther(contractBalance)} ETH`);
      console.log('   → Tiền đang ở trong contract thay vì vào ví owner');
    }
    
    console.log('\n🔧 Khuyến nghị:');
    console.log('1. Nếu warehouse owner là contract address:');
    console.log('   → Cần kiểm tra hàm registerWarehouse');
    console.log('   → Có thể warehouse được đăng ký bởi contract thay vì user');
    console.log('2. Nếu contract có ETH:');
    console.log('   → Chạy withdrawFees() để rút phí nền tảng');
    console.log('3. Để test đúng:');
    console.log('   → Dùng Account 0 để tạo warehouse');
    console.log('   → Dùng Account 1 để thuê warehouse');
    console.log('   → Kiểm tra Account 0 có nhận tiền không');

  } catch (error) {
    console.error('❌ Lỗi debug:', error.message);
  }
}

// Chạy debug
debugWarehouseOwners().catch(console.error);
