const { ethers } = require('ethers');
const path = require('path');
const fs = require('fs');

// Load contract data written by deploy script
const contractDataPath = path.join(__dirname, '..', 'contracts', 'WarehouseLeasing.json');
let contractData = null;
if (fs.existsSync(contractDataPath)) {
  contractData = JSON.parse(fs.readFileSync(contractDataPath, 'utf-8'));
}

const RPC_URL = process.env.RPC_URL || 'http://127.0.0.1:8545';
// Default to Hardhat account #1 private key on local (for seeding only)
const DEFAULT_HARDHAT_PK = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d';
const SEED_PRIVATE_KEY = process.env.SEED_PRIVATE_KEY || process.env.PRIVATE_KEY || DEFAULT_HARDHAT_PK;

const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(SEED_PRIVATE_KEY, provider);

function getContractWithWallet() {
  if (!contractData?.address || !contractData?.abi) {
    throw new Error('Contract data not found. Deploy contract first.');
  }
  return new ethers.Contract(contractData.address, contractData.abi, wallet);
}

module.exports = { provider, wallet, getContractWithWallet };


