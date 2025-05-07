const hre = require("hardhat")

async function main() {
  console.log("Deploying AffidavitRegistry contract...")

  const AffidavitRegistry = await hre.ethers.getContractFactory("AffidavitRegistry")
  const affidavitRegistry = await AffidavitRegistry.deploy()

  await affidavitRegistry.deployed()

  console.log("AffidavitRegistry deployed to:", affidavitRegistry.address)
  console.log("Add this address to your .env file as NEXT_PUBLIC_CONTRACT_ADDRESS")
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
