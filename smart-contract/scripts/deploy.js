const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Deploying WarehouseLeasing contract...");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const WarehouseLeasing = await hre.ethers.getContractFactory("WarehouseLeasing");
  const warehouseLeasing = await WarehouseLeasing.deploy();

  await warehouseLeasing.waitForDeployment();

  const contractAddress = await warehouseLeasing.getAddress();
  console.log("WarehouseLeasing deployed to:", contractAddress);

  // Lưu địa chỉ contract và ABI
  const contractData = {
    address: contractAddress,
    abi: JSON.parse(warehouseLeasing.interface.formatJson())
  };

  // Lưu vào frontend
  const frontendDir = path.join(__dirname, "../../frontend/src/contracts");
  if (!fs.existsSync(frontendDir)) {
    fs.mkdirSync(frontendDir, { recursive: true });
  }
  
  fs.writeFileSync(
    path.join(frontendDir, "WarehouseLeasing.json"),
    JSON.stringify(contractData, null, 2)
  );

  // Lưu vào backend
  const backendDir = path.join(__dirname, "../../backend/contracts");
  if (!fs.existsSync(backendDir)) {
    fs.mkdirSync(backendDir, { recursive: true });
  }
  
  fs.writeFileSync(
    path.join(backendDir, "WarehouseLeasing.json"),
    JSON.stringify(contractData, null, 2)
  );

  console.log("Contract data saved to frontend and backend");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


