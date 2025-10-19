const { ethers } = require('ethers');
const mysql = require('mysql2/promise');

async function syncWarehousesToBlockchain() {
  console.log('🔄 Syncing warehouses from MySQL to Blockchain...');
  
  // Kết nối database
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'warehouse_sharing'
  });
  
  // Kết nối blockchain
  const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
  const privateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
  const wallet = new ethers.Wallet(privateKey, provider);
  
  // Contract ABI
  const contractABI = [
    "function registerWarehouse(string memory name, string memory location, uint256 totalArea, uint256 pricePerSqmPerDay, string memory imageUrl, string memory description) external",
    "function getWarehouse(uint256 id) external view returns (address owner, string memory name, string memory location, uint256 totalArea, uint256 availableArea, uint256 pricePerSqmPerDay, string memory imageUrl, string memory description, bool isActive)"
  ];
  
  const contractAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
  const contract = new ethers.Contract(contractAddress, contractABI, wallet);
  
  try {
    console.log('✅ Connected to database and blockchain');
    console.log('💰 Account balance:', ethers.formatEther(await provider.getBalance(wallet.address)), 'ETH');
    
    // Lấy warehouses từ database
    const [rows] = await connection.execute(`
      SELECT id, name, location, available_area, price_per_sqm_per_day, image_url, description, is_active
      FROM warehouses 
      WHERE is_active = 1
      ORDER BY id
    `);
    
    console.log(`📦 Found ${rows.length} warehouses in database`);
    
    // Kiểm tra warehouses hiện tại trên blockchain bằng cách thử đọc warehouse 1
    let currentCount = 0;
    try {
      await contract.getWarehouse(1);
      console.log('⚠️ Blockchain already has warehouses. Checking count...');
      
      // Đếm warehouses bằng cách thử đọc từng warehouse
      for (let i = 1; i <= 10; i++) {
        try {
          await contract.getWarehouse(i);
          currentCount = i;
        } catch (e) {
          break;
        }
      }
      console.log(`🔗 Current warehouses on blockchain: ${currentCount}`);
      
      if (currentCount > 0) {
        console.log('⚠️ Blockchain already has warehouses. Skipping sync to avoid duplicates.');
        return;
      }
    } catch (e) {
      console.log('✅ Blockchain is empty, proceeding with sync...');
    }
    
    // Sync từng warehouse
    for (const warehouse of rows) {
      console.log(`\n🚀 Syncing warehouse: ${warehouse.name}`);
      
      // Chuẩn bị data
      const name = warehouse.name || 'Unnamed Warehouse';
      const location = warehouse.location || 'Unknown Location';
      const totalArea = warehouse.available_area || 100;
      const pricePerSqmPerDay = ethers.parseEther(warehouse.price_per_sqm_per_day || '1');
      const imageUrl = warehouse.image_url || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d';
      const description = (warehouse.description || 'No description').substring(0, 100); // Limit description
      
      console.log('📝 Warehouse data:', {
        name,
        location,
        totalArea,
        pricePerSqmPerDay: ethers.formatEther(pricePerSqmPerDay),
        description: description.substring(0, 50) + '...'
      });
      
      // Gas settings
      const gasSettings = {
        gasPrice: ethers.parseUnits('2', 'gwei'),
        gasLimit: 500000
      };
      
      try {
        // Estimate gas
        console.log('🔍 Estimating gas...');
        const estimatedGas = await contract.registerWarehouse.estimateGas(
          name, location, totalArea, pricePerSqmPerDay, imageUrl, description
        );
        console.log('✅ Estimated gas:', estimatedGas.toString());
        
        // Register warehouse
        console.log('📝 Registering warehouse...');
        const tx = await contract.registerWarehouse(
          name, location, totalArea, pricePerSqmPerDay, imageUrl, description,
          gasSettings
        );
        
        console.log('⏳ Waiting for confirmation...');
        const receipt = await tx.wait();
        console.log('✅ Warehouse registered! Block:', receipt.blockNumber);
        
        // Update database với blockchain_id (tính toán dựa trên số warehouse đã sync)
        const newBlockchainId = currentCount + 1;
        await connection.execute(
          'UPDATE warehouses SET blockchain_id = ? WHERE id = ?',
          [newBlockchainId.toString(), warehouse.id]
        );
        
        console.log(`✅ Updated database: warehouse ${warehouse.id} -> blockchain_id ${newBlockchainId}`);
        currentCount++;
        
        // Đợi một chút để tránh nonce conflict
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error(`❌ Error syncing warehouse ${warehouse.name}:`, error.message);
        continue;
      }
    }
    
    // Kiểm tra kết quả
    console.log(`\n🎉 Sync completed!`);
    console.log(`📊 Final warehouse count on blockchain: ${currentCount}`);
    
    // Hiển thị warehouses đã sync
    console.log('\n📦 Synced warehouses:');
    for (let i = 1; i <= currentCount; i++) {
      try {
        const warehouse = await contract.getWarehouse(i);
        console.log(`  ${i}. ${warehouse.name} - ${warehouse.availableArea.toString()} m² - ${ethers.formatEther(warehouse.pricePerSqmPerDay)} ETH/day`);
      } catch (e) {
        console.log(`  ${i}. Error reading warehouse`);
      }
    }
    
  } catch (error) {
    console.error('❌ Sync failed:', error.message);
  } finally {
    await connection.end();
  }
}

syncWarehousesToBlockchain();
