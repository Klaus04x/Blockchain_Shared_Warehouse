const { ethers } = require('ethers');

async function testLeaseWithNewContract() {
  console.log('🧪 Testing lease with NEW contract address...');
  
  const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
  const privateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
  const wallet = new ethers.Wallet(privateKey, provider);
  
  // Minimal ABI
  const contractABI = [
    "function createLease(uint256 warehouseId, uint256 area, uint256 duration) external payable"
  ];
  
  // NEW contract address
  const contractAddress = '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707';
  const contract = new ethers.Contract(contractAddress, contractABI, wallet);
  
  try {
    console.log('✅ Connected to blockchain');
    console.log('💰 Account balance:', ethers.formatEther(await provider.getBalance(wallet.address)), 'ETH');
    console.log('📋 Contract address:', contractAddress);
    
    // Parameters
    const warehouseId = 1;
    const area = 1; // 1 m²
    const duration = 1; // 1 ngày
    const totalPrice = ethers.parseEther('1'); // 1 ETH
    
    console.log('📝 Lease parameters:', {
      warehouseId,
      area,
      duration,
      totalPrice: ethers.formatEther(totalPrice) + ' ETH'
    });
    
    // Gas settings như frontend
    const gasSettings = {
      value: totalPrice,
      gasPrice: ethers.parseUnits('1', 'gwei'),
      gasLimit: 300000
    };
    
    console.log('⛽ Gas settings:', {
      value: ethers.formatEther(totalPrice) + ' ETH',
      gasPrice: '1 Gwei',
      gasLimit: 300000
    });
    
    // Tạo lease
    console.log('🚀 Creating lease...');
    const tx = await contract.createLease(warehouseId, area, duration, gasSettings);
    console.log('📝 Transaction hash:', tx.hash);
    
    console.log('⏳ Waiting for confirmation...');
    const receipt = await tx.wait();
    console.log('✅ Transaction confirmed! Block:', receipt.blockNumber);
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

testLeaseWithNewContract();
