#!/usr/bin/env node

/**
 * Script test đăng ký warehouse trực tiếp vào contract
 * Để tìm nguyên nhân lỗi
 */

const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

const RPC_URL = 'http://127.0.0.1:8545';

// Private key của account Hardhat #0
const PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

async function testRegister() {
  console.log('🧪 Testing warehouse registration...\n');

  try {
    // 1. Kết nối provider
    console.log('1️⃣ Connecting to Hardhat node...');
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    console.log('✅ Connected as:', wallet.address);

    // 2. Kiểm tra balance
    console.log('\n2️⃣ Checking balance...');
    const balance = await provider.getBalance(wallet.address);
    console.log('Balance:', ethers.formatEther(balance), 'ETH');
    
    if (balance < ethers.parseEther('0.01')) {
      console.error('❌ Insufficient balance!');
      return;
    }

    // 3. Load contract
    console.log('\n3️⃣ Loading contract...');
    const contractPath = path.join(__dirname, 'backend', 'contracts', 'WarehouseLeasing.json');
    const contractData = JSON.parse(fs.readFileSync(contractPath, 'utf-8'));
    console.log('Contract address:', contractData.address);

    const contract = new ethers.Contract(contractData.address, contractData.abi, wallet);

    // 4. Kiểm tra contract
    console.log('\n4️⃣ Checking contract...');
    const currentCounter = await contract.warehouseCounter();
    console.log('Current warehouse counter:', currentCounter.toString());

    // 5. Test data
    const testData = {
      name: 'Test Warehouse ' + Date.now(),
      location: 'Test Location',
      totalArea: 100,
      pricePerSqmPerDay: ethers.parseEther('0.00001'),
      imageUrl: 'https://example.com/image.jpg',
      description: 'Test description'
    };

    console.log('\n5️⃣ Preparing transaction...');
    console.log('Data:', {
      name: testData.name,
      location: testData.location,
      totalArea: testData.totalArea,
      price: ethers.formatEther(testData.pricePerSqmPerDay) + ' ETH',
    });

    // 6. Estimate gas
    console.log('\n6️⃣ Estimating gas...');
    try {
      const gasEstimate = await contract.registerWarehouse.estimateGas(
        testData.name,
        testData.location,
        testData.totalArea,
        testData.pricePerSqmPerDay,
        testData.imageUrl,
        testData.description
      );
      console.log('✅ Gas estimate:', gasEstimate.toString());
    } catch (gasError) {
      console.error('❌ Gas estimation failed!');
      console.error('Error:', gasError.message);
      console.error('Code:', gasError.code);
      console.error('Data:', gasError.data);
      
      if (gasError.message.includes('execution reverted')) {
        console.error('\n⚠️  Transaction would fail! Contract rejected the call.');
        console.error('Possible reasons:');
        console.error('  - Contract has validation that fails');
        console.error('  - Insufficient permissions');
        console.error('  - Contract is paused or disabled');
      }
      return;
    }

    // 7. Send transaction
    console.log('\n7️⃣ Sending transaction...');
    const tx = await contract.registerWarehouse(
      testData.name,
      testData.location,
      testData.totalArea,
      testData.pricePerSqmPerDay,
      testData.imageUrl,
      testData.description,
      {
        gasLimit: 500000
      }
    );

    console.log('Transaction hash:', tx.hash);
    console.log('Waiting for confirmation...');

    const receipt = await tx.wait();
    console.log('\n✅ Transaction confirmed!');
    console.log('Block number:', receipt.blockNumber);
    console.log('Gas used:', receipt.gasUsed.toString());
    console.log('Status:', receipt.status === 1 ? 'SUCCESS' : 'FAILED');

    // 8. Parse events
    console.log('\n8️⃣ Parsing events...');
    const event = receipt.logs.find((log) => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed.name === 'WarehouseRegistered';
      } catch (e) {
        return false;
      }
    });

    if (event) {
      const parsed = contract.interface.parseLog(event);
      console.log('✅ WarehouseRegistered event found!');
      console.log('Warehouse ID:', parsed.args.warehouseId.toString());
      console.log('Owner:', parsed.args.owner);
      console.log('Name:', parsed.args.name);

      // 9. Verify
      console.log('\n9️⃣ Verifying warehouse...');
      const warehouse = await contract.getWarehouse(parsed.args.warehouseId);
      console.log('Warehouse details:');
      console.log('  ID:', warehouse.id.toString());
      console.log('  Owner:', warehouse.owner);
      console.log('  Name:', warehouse.name);
      console.log('  Location:', warehouse.location);
      console.log('  Total Area:', warehouse.totalArea.toString());
      console.log('  Price:', ethers.formatEther(warehouse.pricePerSqmPerDay), 'ETH/m²/day');
      console.log('  Active:', warehouse.isActive);

      console.log('\n🎉 SUCCESS! Warehouse registered successfully!');
    } else {
      console.error('❌ WarehouseRegistered event not found!');
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('Code:', error.code);
    console.error('Stack:', error.stack);
  }
}

testRegister();

