#!/usr/bin/env node

/**
 * Script chuyển ETH từ Hardhat account #0 sang account khác
 */

const { ethers } = require('ethers');

const RPC_URL = 'http://127.0.0.1:8545';
const PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

// Account cần nạp tiền (thay bằng địa chỉ MetaMask của bạn)
const TARGET_ADDRESS = process.argv[2];

async function fundAccount() {
  if (!TARGET_ADDRESS) {
    console.error('❌ Vui lòng cung cấp địa chỉ ví cần nạp!');
    console.log('Usage: node fund-account.js <address>');
    console.log('Example: node fund-account.js 0x2546BcD3c84621e976D8185a91A922aE77ECEc30');
    return;
  }

  console.log('💰 Funding account...\n');

  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

    console.log('From:', wallet.address);
    console.log('To:', TARGET_ADDRESS);
    console.log('Amount: 100 ETH\n');

    // Kiểm tra balance hiện tại
    const currentBalance = await provider.getBalance(TARGET_ADDRESS);
    console.log('Current balance:', ethers.formatEther(currentBalance), 'ETH');

    // Chuyển 100 ETH
    const tx = await wallet.sendTransaction({
      to: TARGET_ADDRESS,
      value: ethers.parseEther('100')
    });

    console.log('Transaction hash:', tx.hash);
    console.log('Waiting for confirmation...');

    await tx.wait();
    
    const newBalance = await provider.getBalance(TARGET_ADDRESS);
    console.log('\n✅ Success!');
    console.log('New balance:', ethers.formatEther(newBalance), 'ETH');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fundAccount();

