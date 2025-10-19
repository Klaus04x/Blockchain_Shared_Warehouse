const { ethers } = require('ethers');

async function testSimpleLease() {
  console.log('🧪 Testing simple lease creation...');
  
  // Kết nối Hardhat node
  const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
  
  // Contract info
  const contractAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
  const contractABI = [
    "function createLease(uint256 warehouseId, uint256 area, uint256 duration) external payable",
    "function getWarehouse(uint256 id) external view returns (address owner, string memory name, string memory location, uint256 totalArea, uint256 availableArea, uint256 pricePerSqmPerDay, string memory imageUrl, string memory description, bool isActive)"
  ];
  
  try {
    // Sử dụng private key của Hardhat account đầu tiên
    const privateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
    const wallet = new ethers.Wallet(privateKey, provider);
    
    console.log('✅ Connected to account:', wallet.address);
    console.log('💰 Balance:', ethers.formatEther(await provider.getBalance(wallet.address)), 'ETH');
    
    // Tạo contract instance
    const contract = new ethers.Contract(contractAddress, contractABI, wallet);
    
    // Kiểm tra tất cả warehouses
    console.log('🔍 Checking all warehouses...');
    for (let i = 1; i <= 5; i++) {
      try {
        const warehouse = await contract.getWarehouse(i);
        console.log(`📦 Warehouse ${i}:`, {
          name: warehouse.name,
          availableArea: warehouse.availableArea.toString(),
          pricePerSqmPerDay: ethers.formatEther(warehouse.pricePerSqmPerDay),
          isActive: warehouse.isActive
        });
      } catch (e) {
        console.log(`📦 Warehouse ${i}: Not found`);
      }
    }
    
    // Tìm warehouse active với diện tích nhỏ nhất
    let targetWarehouse = null;
    let minArea = Infinity;
    
    for (let i = 1; i <= 5; i++) {
      try {
        const warehouse = await contract.getWarehouse(i);
        if (warehouse.isActive && warehouse.availableArea > 0) {
          const area = parseInt(warehouse.availableArea.toString());
          if (area < minArea) {
            minArea = area;
            targetWarehouse = { id: i, ...warehouse };
          }
        }
      } catch (e) {
        // Skip
      }
    }
    
    if (!targetWarehouse) {
      throw new Error('Không tìm thấy warehouse nào active!');
    }
    
    console.log('🎯 Target warehouse:', {
      id: targetWarehouse.id,
      name: targetWarehouse.name,
      availableArea: targetWarehouse.availableArea.toString(),
      pricePerSqmPerDay: ethers.formatEther(targetWarehouse.pricePerSqmPerDay),
      isActive: targetWarehouse.isActive
    });
    
    // Tính toán giá thuê
    const area = Math.min(1, parseInt(targetWarehouse.availableArea.toString())); // Thuê 1 m² hoặc tất cả nếu < 1
    const duration = 1; // 1 ngày
    const pricePerSqmPerDay = targetWarehouse.pricePerSqmPerDay;
    const totalPrice = pricePerSqmPerDay * BigInt(area) * BigInt(duration);
    
    console.log('💰 Total price:', ethers.formatEther(totalPrice), 'ETH');
    
    // Gas settings đơn giản
    const gasSettings = {
      value: totalPrice,
      gasPrice: ethers.parseUnits('2', 'gwei'),
      gasLimit: 100000
    };
    
    console.log('⛽ Gas settings:', {
      value: ethers.formatEther(totalPrice) + ' ETH',
      gasPrice: '2 Gwei',
      gasLimit: 100000
    });
    
    // Estimate gas
    console.log('🔍 Estimating gas...');
    const estimatedGas = await contract.createLease.estimateGas(targetWarehouse.id, area, duration, gasSettings);
    console.log('✅ Estimated gas:', estimatedGas.toString());
    
    // Tạo lease
    console.log('🚀 Creating lease...');
    const tx = await contract.createLease(targetWarehouse.id, area, duration, gasSettings);
    console.log('📝 Transaction hash:', tx.hash);
    
    console.log('⏳ Waiting for confirmation...');
    const receipt = await tx.wait();
    console.log('✅ Transaction confirmed! Block:', receipt.blockNumber);
    
    // Kiểm tra warehouse sau khi thuê
    console.log('🔍 Checking warehouse after lease...');
    const warehouseAfter = await contract.getWarehouse(targetWarehouse.id);
    console.log('📦 Warehouse after:', {
      availableArea: warehouseAfter.availableArea.toString(),
      isActive: warehouseAfter.isActive
    });
    
    console.log('🎉 SUCCESS! Lease created successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('📊 Error details:', {
      code: error.code,
      reason: error.reason,
      data: error.data
    });
  }
}

testSimpleLease();
