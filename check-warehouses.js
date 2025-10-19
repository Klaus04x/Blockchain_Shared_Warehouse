const { ethers } = require('ethers');

async function checkWarehouses() {
  console.log('🔍 Checking all warehouses on blockchain...');
  
  const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
  const contractABI = [
    "function getWarehouse(uint256 id) external view returns (address owner, string memory name, string memory location, uint256 totalArea, uint256 availableArea, uint256 pricePerSqmPerDay, string memory imageUrl, string memory description, bool isActive)"
  ];
  
  const contractAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
  const contract = new ethers.Contract(contractAddress, contractABI, provider);
  
  try {
    console.log('✅ Connected to blockchain');
    
    // Kiểm tra warehouses từ 1 đến 20
    for (let i = 1; i <= 20; i++) {
      try {
        const warehouse = await contract.getWarehouse(i);
        
        // Chỉ hiển thị warehouses active và có diện tích nhỏ
        if (warehouse.isActive && warehouse.availableArea > 0) {
          const area = parseInt(warehouse.availableArea.toString());
          const price = ethers.formatEther(warehouse.pricePerSqmPerDay);
          
          console.log(`📦 Warehouse ${i}:`);
          console.log(`   Name: ${warehouse.name}`);
          console.log(`   Location: ${warehouse.location}`);
          console.log(`   Available Area: ${area} m²`);
          console.log(`   Price: ${price} ETH/m²/day`);
          console.log(`   Active: ${warehouse.isActive}`);
          console.log(`   Owner: ${warehouse.owner}`);
          console.log('');
          
          // Nếu có warehouse với diện tích ≤ 5 m², đó là ứng viên tốt để test
          if (area <= 5) {
            console.log(`🎯 PERFECT FOR TESTING! Warehouse ${i} has only ${area} m²`);
          }
        }
      } catch (e) {
        // Warehouse không tồn tại
        break;
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkWarehouses();
