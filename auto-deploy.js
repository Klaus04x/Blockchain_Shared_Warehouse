#!/usr/bin/env node

/**
 * Script tự động deploy contract sau khi hardhat node sẵn sàng
 * Được gọi bởi npm run dev:all
 */

const { ethers } = require('ethers');
const { spawn } = require('child_process');
const path = require('path');

const RPC_URL = 'http://127.0.0.1:8545';
const MAX_RETRIES = 30; // 30 lần, mỗi lần chờ 1 giây = 30 giây

async function waitForNode(retries = 0) {
  if (retries >= MAX_RETRIES) {
    console.error('❌ Hardhat node không khởi động sau 30 giây');
    process.exit(1);
  }

  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    await provider.getBlockNumber();
    return true;
  } catch (error) {
    process.stdout.write('.');
    await new Promise(resolve => setTimeout(resolve, 1000));
    return waitForNode(retries + 1);
  }
}

async function deployContract() {
  console.log('\n📦 Deploying smart contract...');
  
  return new Promise((resolve, reject) => {
    const deploy = spawn('npx', ['hardhat', 'run', 'scripts/deploy.js', '--network', 'localhost'], {
      cwd: path.join(__dirname, 'smart-contract'),
      shell: true,
      stdio: 'inherit'
    });

    deploy.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Contract deployed successfully!\n');
        resolve();
      } else {
        console.error('❌ Deploy failed');
        reject(new Error('Deploy failed'));
      }
    });
  });
}

async function main() {
  console.log('⏳ Đợi Hardhat node khởi động');
  await waitForNode();
  console.log('\n✅ Hardhat node sẵn sàng!');
  
  await deployContract();
  
  console.log('🎉 Blockchain ready! Backend và Frontend đang khởi động...\n');
}

main().catch(error => {
  console.error('❌ Lỗi:', error.message);
  process.exit(1);
});

