const { ethers } = require('ethers');

async function testMinimalLeaseOptimized() {
  console.log('🧪 Testing MINIMAL lease with OPTIMIZED gas settings...');
  
  const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
  const privateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
  const wallet = new ethers.Wallet(privateKey, provider);
  
  // Minimal ABI
  const contractABI = [
    "function createLease(uint256 warehouseId, uint256 area, uint256 duration) external payable"
  ];
  
  // Contract address - dùng đúng address từ frontend/backend
  const contractAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
  const contract = new ethers.Contract(contractAddress, contractABI, wallet);
  
  try {
    console.log('✅ Connected to blockchain');
    console.log('💰 Account balance:', ethers.formatEther(await provider.getBalance(wallet.address)), 'ETH');
    console.log('📋 Contract address:', contractAddress);
    
    // Parameters - giống như frontend
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
    
    // Gas settings tối ưu như frontend mới
    const gasSettings = {
      value: totalPrice,
      gasPrice: ethers.parseUnits('1', 'gwei'),
      gasLimit: 500000  // Tăng từ 200k lên 500k để tránh "out of gas"
    };
    
    console.log('⛽ Optimized gas settings:', {
      value: ethers.formatEther(totalPrice) + ' ETH',
      gasPrice: '1 Gwei',
      gasLimit: 500000
    });
    
    // Estimate gas trước
    console.log('🔍 Estimating gas...');
    try {
      const estimatedGas = await contract.createLease.estimateGas(
        warehouseId,
        area,
        duration,
        { value: totalPrice }
      );
      console.log('✅ Estimated gas:', estimatedGas.toString());
      
      const gasLimit = Math.min(Math.floor(Number(estimatedGas) * 1.2), 500000);
      gasSettings.gasLimit = gasLimit;
      console.log('🎯 Using gas limit:', gasLimit);
    } catch (estimateError) {
      console.warn('⚠️ Cannot estimate gas, using default 500k:', estimateError.message);
    }
    
    // Tạo lease
    console.log('🚀 Creating lease...');
    const tx = await contract.createLease(warehouseId, area, duration, gasSettings);
    console.log('📝 Transaction hash:', tx.hash);
    
    console.log('⏳ Waiting for confirmation...');
    const receipt = await tx.wait();
    console.log('✅ Transaction confirmed! Block:', receipt.blockNumber);
    console.log('🎉 SUCCESS! Lease created successfully!');
    
    // Log gas used
    console.log('⛽ Gas used:', receipt.gasUsed.toString());
    console.log('💰 Gas cost:', ethers.formatEther(receipt.gasUsed * gasSettings.gasPrice), 'ETH');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('📊 Error details:', {
      code: error.code,
      reason: error.reason,
      data: error.data
    });
  }
}

testMinimalLeaseOptimized();
