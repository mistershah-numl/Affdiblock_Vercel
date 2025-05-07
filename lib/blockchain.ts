import { ethers } from "ethers"
import AffidavitRegistryABI from "@/blockchain/artifacts/contracts/AffidavitRegistry.sol/AffidavitRegistry.json"

const contractAddress = "0x2444c02943aA4f09D2C63D607f82668413F713d6"

export async function deployAffidavitContract(affidavitData: any, token: string) {
  // Ensure this function only runs in a browser environment
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("MetaMask is not installed or not running in a browser environment")
  }

  const provider = new ethers.BrowserProvider(window.ethereum)
  const signer = await provider.getSigner()
  const contract = new ethers.Contract(contractAddress, AffidavitRegistryABI.abi, signer)

  // Step 1: Fetch wallet addresses for all involved parties
  const fetchWalletAddress = async (userId: string) => {
    const response = await fetch(`/api/user?filter=_id:${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await response.json()
    if (!data.success || !data.users[0]?.walletAddress) {
      throw new Error(`Wallet address not found for user ${userId}`)
    }
    return data.users[0].walletAddress
  }

  const issuerAddress = await fetchWalletAddress(affidavitData.issuerId)
  const sellerAddress = affidavitData.sellerId
    ? await fetchWalletAddress(affidavitData.sellerId)
    : ethers.ZeroAddress
  const buyerAddress = affidavitData.buyerId
    ? await fetchWalletAddress(affidavitData.buyerId)
    : ethers.ZeroAddress

  // Step 2: Deploy to blockchain (IPFS upload is already handled in the API route)
  try {
    // Ensure witnesses is an array
    const witnesses = Array.isArray(affidavitData.witnesses) ? affidavitData.witnesses : []

    // Request account access to ensure MetaMask popup triggers
    await window.ethereum.request({ method: "eth_requestAccounts" })

    const tx = await contract.createAffidavit(
      affidavitData.affidavitId,
      affidavitData.title,
      affidavitData.category,
      affidavitData.description,
      affidavitData.declaration,
      issuerAddress,
      sellerAddress,
      buyerAddress,
      witnesses,
      affidavitData.ipfsHash,
    )

    const receipt = await tx.wait()
    const blockNumber = receipt.blockNumber

    return {
      transactionHash: tx.hash,
      blockNumber,
      ipfsHash: affidavitData.ipfsHash,
    }
  } catch (error: any) {
    console.error("Error deploying affidavit to blockchain:", error)
    throw new Error(`Failed to deploy affidavit to blockchain: ${error.message}`)
  }
}