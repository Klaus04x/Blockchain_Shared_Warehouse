const { ethers } = require('ethers');

async function createSmallWarehouse() {
  console.log('🏗️ Creating a small warehouse for testing...');
  
  const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
  const privateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
  const wallet = new ethers.Wallet(privateKey, provider);
  
  const contractABI = [
    "function registerWarehouse(string memory name, string memory location, uint256 totalArea, uint256 pricePerSqmPerDay, string memory imageUrl, string memory description) external",
    "function getWarehouse(uint256 id) external view returns (address owner, string memory name, string memory location, uint256 totalArea, uint256 availableArea, uint256 pricePerSqmPerDay, string memory imageUrl, string memory description, bool isActive)"
  ];
  
  const contractAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
  const contract = new ethers.Contract(contractAddress, contractABI, wallet);
  
  try {
    console.log('✅ Connected to blockchain');
    console.log('💰 Account balance:', ethers.formatEther(await provider.getBalance(wallet.address)), 'ETH');
    
    // Tạo warehouse nhỏ
    const warehouseData = {
      name: 'Kho Test 1m2',
      location: 'Hà Nội',
      totalArea: 1, // 1 m²
      pricePerSqmPerDay: ethers.parseEther('1'), // 1 ETH/m²/day
      imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d',
      description: 'Kho test nhỏ để thuê hết diện tích'
    };
    
    console.log('📝 Warehouse data:', {
      name: warehouseData.name,
      location: warehouseData.location,
      totalArea: warehouseData.totalArea,
      pricePerSqmPerDay: ethers.formatEther(warehouseData.pricePerSqmPerDay),
      description: warehouseData.description
    });
    
    // Gas settings
    const gasSettings = {
      gasPrice: ethers.parseUnits('2', 'gwei'),
      gasLimit: 500000
    };
    
    // Estimate gas
    console.log('🔍 Estimating gas...');
    const estimatedGas = await contract.registerWarehouse.estimateGas(
      warehouseData.name,
      warehouseData.location,
      warehouseData.totalArea,
      warehouseData.pricePerSqmPerDay,
      warehouseData.imageUrl,
      warehouseData.description
    );
    console.log('✅ Estimated gas:', estimatedGas.toString());
    
    // Register warehouse
    console.log('📝 Registering warehouse...');
    const tx = await contract.registerWarehouse(
      warehouseData.name,
      warehouseData.location,
      warehouseData.totalArea,
      warehouseData.pricePerSqmPerDay,
      warehouseData.imageUrl,
      warehouseData.description,
      gasSettings
    );
    
    console.log('⏳ Waiting for confirmation...');
    const receipt = await tx.wait();
    console.log('✅ Warehouse registered! Block:', receipt.blockNumber);
    
    // Kiểm tra warehouse vừa tạo
    console.log('🔍 Checking created warehouse...');
    const warehouse = await contract.getWarehouse(1);
    console.log('📦 Warehouse 1:', {
      name: warehouse.name,
      location: warehouse.location,
      totalArea: warehouse.totalArea.toString(),
      availableArea: warehouse.availableArea.toString(),
      pricePerSqmPerDay: ethers.formatEther(warehouse.pricePerSqmPerDay),
      isActive: warehouse.isActive,
      owner: warehouse.owner
    });
    
    console.log('🎉 SUCCESS! Small warehouse created!');
    console.log('🎯 Now you can test leasing the entire 1 m² area!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('📊 Error details:', {
      code: error.code,
      reason: error.reason,
      data: error.data
    });
  }
}

createSmallWarehouse();
