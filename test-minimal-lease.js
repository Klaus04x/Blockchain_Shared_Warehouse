const { ethers } = require('ethers');

async function testMinimalLease() {
  console.log('🧪 Testing MINIMAL lease creation...');
  
  const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
  const privateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
  const wallet = new ethers.Wallet(privateKey, provider);
  
  // Minimal ABI - chỉ có createLease
  const contractABI = [
    "function createLease(uint256 warehouseId, uint256 area, uint256 duration) external payable"
  ];
  
  const contractAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
  const contract = new ethers.Contract(contractAddress, contractABI, wallet);
  
  try {
    console.log('✅ Connected to blockchain');
    console.log('💰 Account balance:', ethers.formatEther(await provider.getBalance(wallet.address)), 'ETH');
    
    // Parameters tối thiểu
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
    
    // Gas settings tối thiểu
    const gasSettings = {
      value: totalPrice,
      gasPrice: ethers.parseUnits('1', 'gwei'),
      gasLimit: 300000 // Tăng lên 300k cho platform fee processing
    };
    
    console.log('⛽ Gas settings:', {
      value: ethers.formatEther(totalPrice) + ' ETH',
      gasPrice: '1 Gwei',
      gasLimit: 300000
    });
    
    // Không estimate gas, dùng trực tiếp
    console.log('🚀 Creating lease (no gas estimation)...');
    const tx = await contract.createLease(warehouseId, area, duration, gasSettings);
    console.log('📝 Transaction hash:', tx.hash);
    
    console.log('⏳ Waiting for confirmation...');
    const receipt = await tx.wait();
    console.log('✅ Transaction confirmed! Block:', receipt.blockNumber);
    console.log('🎉 SUCCESS! Lease created successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.message.includes('Internal JSON-RPC error')) {
      console.log('💡 Suggestion: Try with even lower gas limit or restart Hardhat node');
    }
    
    console.error('📊 Error details:', {
      code: error.code,
      reason: error.reason,
      data: error.data
    });
  }
}

testMinimalLease();
