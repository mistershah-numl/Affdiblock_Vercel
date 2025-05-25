const hre = require("hardhat");

async function main() {
  console.log("Deploying AffidavitRegistry contract...");

  // Get the contract factory
  const AffidavitRegistry = await hre.ethers.getContractFactory("AffidavitRegistry");

  // Deploy the contract
  const affidavitRegistry = await AffidavitRegistry.deploy();

  // Wait for the contract to be mined (no need for .deployed())
  await affidavitRegistry.waitForDeployment();

  // Get the deployed contract address
  const contractAddress = await affidavitRegistry.getAddress();

  console.log("AffidavitRegistry deployed to:", contractAddress);
  console.log("Add this address to your .env file as NEXT_PUBLIC_CONTRACT_ADDRESS");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });