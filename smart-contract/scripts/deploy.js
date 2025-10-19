const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

// Import ContractAddressManager
const ContractAddressManager = require("../../contract-address-manager");

async function main() {
  console.log("🚀 Deploying WarehouseLeasing contract...");

  const [deployer] = await hre.ethers.getSigners();
  console.log("📋 Deploying with account:", deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH");

  const WarehouseLeasing = await hre.ethers.getContractFactory("WarehouseLeasing");
  const warehouseLeasing = await WarehouseLeasing.deploy();

  console.log("⏳ Waiting for deployment...");
  await warehouseLeasing.waitForDeployment();

  const contractAddress = await warehouseLeasing.getAddress();
  console.log("✅ WarehouseLeasing deployed to:", contractAddress);

  // Lấy ABI
  const contractABI = JSON.parse(warehouseLeasing.interface.formatJson());

  // Lưu địa chỉ contract và metadata
  const deployInfo = {
    deployer: deployer.address,
    gasUsed: "Unknown", // Hardhat không cung cấp gas used trong deployment
    blockNumber: await deployer.provider.getBlockNumber()
  };

  const saved = ContractAddressManager.saveContractAddress(contractAddress, contractABI, deployInfo);
  
  if (saved) {
    console.log("✅ Contract address saved successfully!");
    console.log("💡 Contract will be reused on next startup");
  } else {
    console.log("❌ Failed to save contract address");
  }

  console.log("🎉 Deployment completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });


