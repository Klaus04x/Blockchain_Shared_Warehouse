const { ethers } = require('ethers');

async function testLeaseWithLowGas() {
  console.log('🧪 Testing lease creation with very low gas...');
  
  const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
  const privateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
  const wallet = new ethers.Wallet(privateKey, provider);
  
  const contractABI = [
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "warehouseId",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "area",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "duration",
          "type": "uint256"
        }
      ],
      "name": "createLease",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "id",
          "type": "uint256"
        }
      ],
      "name": "getWarehouse",
      "outputs": [
        {
          "components": [
            {
              "internalType": "uint256",
              "name": "id",
              "type": "uint256"
            },
            {
              "internalType": "address",
              "name": "owner",
              "type": "address"
            },
            {
              "internalType": "string",
              "name": "name",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "location",
              "type": "string"
            },
            {
              "internalType": "uint256",
              "name": "totalArea",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "availableArea",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "pricePerSqmPerDay",
              "type": "uint256"
            },
            {
              "internalType": "string",
              "name": "imageUrl",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "description",
              "type": "string"
            },
            {
              "internalType": "bool",
              "name": "isActive",
              "type": "bool"
            }
          ],
          "internalType": "struct WarehouseLeasing.Warehouse",
          "name": "",
          "type": "tuple"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ];
  
  const contractAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
  const contract = new ethers.Contract(contractAddress, contractABI, wallet);
  
  try {
    console.log('✅ Connected to blockchain');
    console.log('💰 Account balance:', ethers.formatEther(await provider.getBalance(wallet.address)), 'ETH');
    
    // Kiểm tra warehouse 1
    console.log('🔍 Checking warehouse 1...');
    const warehouse = await contract.getWarehouse(1);
    console.log('📦 Warehouse 1:', {
      name: warehouse.name,
      availableArea: warehouse.availableArea.toString(),
      pricePerSqmPerDay: ethers.formatEther(warehouse.pricePerSqmPerDay),
      isActive: warehouse.isActive
    });
    
    // Tính toán giá thuê
    const area = 1; // 1 m²
    const duration = 1; // 1 ngày
    const pricePerSqmPerDay = warehouse.pricePerSqmPerDay;
    const totalPrice = pricePerSqmPerDay * BigInt(area) * BigInt(duration);
    
    console.log('💰 Total price:', ethers.formatEther(totalPrice), 'ETH');
    
    // Test với gas settings vừa phải
    const gasSettings = {
      value: totalPrice,
      gasPrice: ethers.parseUnits('1', 'gwei'), // 1 Gwei
      gasLimit: 100000 // 100k gas limit
    };
    
    console.log('⛽ Gas settings:', {
      value: ethers.formatEther(totalPrice) + ' ETH',
      gasPrice: '1 Gwei',
      gasLimit: 100000
    });
    
    // Estimate gas
    console.log('🔍 Estimating gas...');
    try {
      const estimatedGas = await contract.createLease.estimateGas(1, area, duration, gasSettings);
      console.log('✅ Estimated gas:', estimatedGas.toString());
      
      // Dùng estimate + 20% buffer, nhưng không quá 100k
      const gasLimit = Math.min(Math.floor(estimatedGas * 1.2), 100000);
      gasSettings.gasLimit = gasLimit;
      console.log('🎯 Using gas limit:', gasLimit);
    } catch (estimateError) {
      console.warn('⚠️ Cannot estimate gas, using default 100k:', estimateError.message);
    }
    
    // Tạo lease
    console.log('🚀 Creating lease...');
    const tx = await contract.createLease(1, area, duration, gasSettings);
    console.log('📝 Transaction hash:', tx.hash);
    
    console.log('⏳ Waiting for confirmation...');
    const receipt = await tx.wait();
    console.log('✅ Transaction confirmed! Block:', receipt.blockNumber);
    
    // Kiểm tra warehouse sau khi thuê
    console.log('🔍 Checking warehouse after lease...');
    const warehouseAfter = await contract.getWarehouse(1);
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

testLeaseWithLowGas();
