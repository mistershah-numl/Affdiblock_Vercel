import { ethers } from "ethers"
import AffidavitRegistryABI from "../../blockchain/artifacts/contracts/AffidavitRegistry.sol/AffidavitRegistry.json"

// Contract address - this will be set after deployment
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3" // Default local deployment address

// RPC URL for the blockchain network
const RPC_URL = process.env.NEXT_PUBLIC_GANACHE_RPC_URL || "http://127.0.0.1:7545"

/**
 * Get a provider instance
 * @returns An ethers provider
 */
export function getProvider() {
  if (typeof window !== "undefined" && window.ethereum) {
    return new ethers.BrowserProvider(window.ethereum)
  }
  return new ethers.JsonRpcProvider(RPC_URL)
}

/**
 * Get a contract instance
 * @param providerOrSigner A provider or signer to connect with
 * @returns The contract instance
 */
export function getContract(providerOrSigner: ethers.Provider | ethers.Signer) {
  return new ethers.Contract(CONTRACT_ADDRESS, AffidavitRegistryABI.abi, providerOrSigner)
}

/**
 * Create a new affidavit on the blockchain
 * @param affidavitData The affidavit data to store
 * @param payerAddresses Array of wallet addresses that will pay for the transaction
 * @returns The transaction receipt
 */
export async function createAffidavitOnBlockchain(
  affidavitData: {
    affidavitId: string
    title: string
    category: string
    description: string
    declaration: string
    issuerAddress: string
    sellerAddress?: string
    buyerAddress?: string
    witnessIds: string[]
    ipfsHash: string
  },
  payerAddresses: string[],
) {
  try {
    if (typeof window === "undefined" || !window.ethereum) {
      throw new Error("MetaMask is not installed. Please install MetaMask to proceed.")
    }

    // Request account access if needed
    await window.ethereum.request({ method: "eth_requestAccounts" })

    const provider = getProvider() as ethers.BrowserProvider
    const signer = await provider.getSigner()
    const contract = getContract(signer)

    // Prepare addresses (use zero address if not provided)
    const sellerAddress = affidavitData.sellerAddress || ethers.ZeroAddress
    const buyerAddress = affidavitData.buyerAddress || ethers.ZeroAddress

    // Estimate gas for the transaction
    const gasEstimate = await contract.createAffidavit.estimateGas(
      affidavitData.affidavitId,
      affidavitData.title,
      affidavitData.category,
      affidavitData.description,
      affidavitData.declaration,
      affidavitData.issuerAddress,
      sellerAddress,
      buyerAddress,
      affidavitData.witnessIds,
      affidavitData.ipfsHash,
    )

    // Add 20% buffer to gas estimate
    const gasLimit = Math.floor(gasEstimate * 1.2)

    // Create transaction with gas limit
    const tx = await contract.createAffidavit(
      affidavitData.affidavitId,
      affidavitData.title,
      affidavitData.category,
      affidavitData.description,
      affidavitData.declaration,
      affidavitData.issuerAddress,
      sellerAddress,
      buyerAddress,
      affidavitData.witnessIds,
      affidavitData.ipfsHash,
      { gasLimit },
    )

    // Wait for transaction to be mined
    const receipt = await tx.wait()

    return {
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    console.error("Error creating affidavit on blockchain:", error)
    throw error
  }
}

/**
 * Verify an affidavit on the blockchain
 * @param affidavitId The ID of the affidavit to verify
 * @returns Object containing verification results
 */
export async function verifyAffidavitOnBlockchain(affidavitId: string) {
  try {
    const provider = getProvider()
    const contract = getContract(provider)

    // Verify the affidavit exists and is active
    const [exists, isActive] = await contract.verifyAffidavit(affidavitId)

    if (!exists) {
      return { verified: false, reason: "Affidavit does not exist on blockchain" }
    }

    if (!isActive) {
      return { verified: false, reason: "Affidavit has been revoked on blockchain" }
    }

    // Get the full affidavit details
    const affidavitDetails = await contract.getAffidavit(affidavitId)

    return {
      verified: true,
      details: {
        affidavitId: affidavitDetails[0],
        title: affidavitDetails[1],
        category: affidavitDetails[2],
        description: affidavitDetails[3],
        declaration: affidavitDetails[4],
        issuer: affidavitDetails[5],
        seller: affidavitDetails[6],
        buyer: affidavitDetails[7],
        ipfsHash: affidavitDetails[8],
        timestamp: new Date(Number(affidavitDetails[9]) * 1000),
        isActive: affidavitDetails[10],
      },
    }
  } catch (error) {
    console.error("Error verifying affidavit on blockchain:", error)
    return { verified: false, reason: "Error connecting to blockchain" }
  }
}

/**
 * Get wallet balance
 * @param address The wallet address
 * @returns The balance in ETH
 */
export async function getWalletBalance(address: string): Promise<string> {
  try {
    const provider = getProvider()
    const balance = await provider.getBalance(address)
    return ethers.formatEther(balance)
  } catch (error) {
    console.error("Error getting wallet balance:", error)
    throw error
  }
}

/**
 * Get network name
 * @returns The name of the connected network
 */
export async function getNetworkName(): Promise<string> {
  try {
    const provider = getProvider()
    const network = await provider.getNetwork()
    return network.name || "localhost"
  } catch (error) {
    console.error("Error getting network name:", error)
    return "unknown"
  }
}

/**
 * Get connected MetaMask wallet
 * @returns The connected wallet address or null
 */
export async function getConnectedMetaMaskWallet(): Promise<string | null> {
  if (typeof window === "undefined" || !window.ethereum) {
    return null
  }

  try {
    const accounts = await window.ethereum.request({ method: "eth_accounts" })
    return accounts.length > 0 ? accounts[0] : null
  } catch (error) {
    console.error("Error getting connected wallet:", error)
    return null
  }
}
