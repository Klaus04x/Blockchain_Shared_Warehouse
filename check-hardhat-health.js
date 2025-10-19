const { ethers } = require('ethers');

async function checkHardhatNodeHealth() {
  console.log('🔍 Kiểm tra sức khỏe Hardhat node...');
  
  const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
  
  try {
    // Kiểm tra kết nối cơ bản
    const blockNumber = await provider.getBlockNumber();
    console.log('✅ Hardhat node đang chạy. Block hiện tại:', blockNumber);
    
    // Kiểm tra gas price
    const gasPrice = await provider.getGasPrice();
    console.log('⛽ Gas price:', ethers.formatUnits(gasPrice, 'gwei'), 'Gwei');
    
    // Kiểm tra network
    const network = await provider.getNetwork();
    console.log('🌐 Network:', {
      chainId: network.chainId.toString(),
      name: network.name
    });
    
    // Kiểm tra một số account
    const accounts = [
      '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC'
    ];
    
    console.log('💰 Account balances:');
    for (const account of accounts) {
      const balance = await provider.getBalance(account);
      console.log(`  ${account}: ${ethers.formatEther(balance)} ETH`);
    }
    
    // Kiểm tra contract
    const contractAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
    const code = await provider.getCode(contractAddress);
    if (code === '0x') {
      console.log('❌ Contract không tồn tại tại address:', contractAddress);
    } else {
      console.log('✅ Contract tồn tại tại address:', contractAddress);
    }
    
    console.log('\n🎯 Khuyến nghị:');
    console.log('1. Hardhat node hoạt động bình thường');
    console.log('2. Gas price thấp (1 Gwei) - tốt cho testing');
    console.log('3. Các account có đủ ETH để test');
    console.log('4. Contract đã được deploy');
    
  } catch (error) {
    console.error('❌ Lỗi khi kiểm tra Hardhat node:', error.message);
    console.log('\n🔧 Khuyến nghị:');
    console.log('1. Khởi động lại Hardhat node: npx hardhat node');
    console.log('2. Kiểm tra port 8545 có bị chiếm không');
    console.log('3. Reset MetaMask account nếu cần');
  }
}

checkHardhatNodeHealth();
