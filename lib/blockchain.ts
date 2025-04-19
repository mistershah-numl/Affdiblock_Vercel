import { ethers } from "ethers"

// Environment variables
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID"
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0xYourContractAddress"
const CONTRACT_ABI = [
  // Simplified ABI for affidavit contract
  {
    "constant": false,
    "inputs": [
      { "name": "recipient", "type": "address" },
      { "name": "affidavitHash", "type": "string" },
      { "name": "metadata", "type": "string" }
    ],
    "name": "issueAffidavit",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [
      { "name": "affidavitHash", "type": "string" }
    ],
    "name": "verifyAffidavit",
    "outputs": [
      { "name": "isValid", "type": "bool" },
      { "name": "issuer", "type": "address" },
      { "name": "timestamp", "type": "uint256" }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  }
]

// Initialize provider
const provider = new ethers.JsonRpcProvider(RPC_URL)

// Initialize contract
const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider)

/**
 * Get a signer for the given private key
 * @param privateKey The private key of the wallet
 * @returns Signer instance
 */
export function getSigner(privateKey: string) {
  return new ethers.Wallet(privateKey, provider)
}

/**
 * Issue an affidavit on the blockchain
 * @param recipient The recipient's wallet address
 * @param affidavitHash The hash of the affidavit content
 * @param metadata Additional metadata (e.g., JSON string)
 * @param privateKey The issuer's private key
 * @returns Transaction receipt
 */
export async function issueAffidavit(
  recipient: string,
  affidavitHash: string,
  metadata: string,
  privateKey: string
) {
  try {
    if (!ethers.isAddress(recipient)) {
      throw new Error("Invalid recipient address")
    }
    const signer = getSigner(privateKey)
    const contractWithSigner = contract.connect(signer)

    const tx = await contractWithSigner.issueAffidavit(recipient, affidavitHash, metadata, {
      gasLimit: 200000,
    })

    const receipt = await tx.wait()
    console.log("Affidavit issued:", receipt)
    return receipt
  } catch (error) {
    console.error("Error issuing affidavit:", error)
    throw error
  }
}

/**
 * Verify an affidavit on the blockchain
 * @param affidavitHash The hash of the affidavit to verify
 * @returns Verification result { isValid, issuer, timestamp }
 */
export async function verifyAffidavit(affidavitHash: string) {
  try {
    const result = await contract.verifyAffidavit(affidavitHash)
    return {
      isValid: result[0],
      issuer: result[1],
      timestamp: Number(result[2])
    }
  } catch (error) {
    console.error("Error verifying affidavit:", error)
    throw error
  }
}

/**
 * Parse units for ether values
 * @param value The value to parse
 * @param decimals Number of decimals
 * @returns BigNumberish
 */
export function parseUnits(value: string, decimals: number = 18) {
  return ethers.parseUnits(value, decimals)
}

/**
 * Format units for ether values
 * @param value The value to format
 * @param decimals Number of decimals
 * @returns String
 */
export function formatUnits(value: ethers.BigNumberish, decimals: number = 18) {
  return ethers.formatUnits(value, decimals)
}