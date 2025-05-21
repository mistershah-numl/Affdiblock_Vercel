import { ethers } from "ethers";
import AffidavitRegistryABI from "@/blockchain/artifacts/contracts/AffidavitRegistry.sol/AffidavitRegistry.json";

const contractAddress = "0x2444c02943aA4f09D2C63D607f82668413F713d6";

export async function deployAffidavitContract(affidavitData: any, token: string) {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("MetaMask is not installed or not running in a browser environment");
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const contract = new ethers.Contract(contractAddress, AffidavitRegistryABI.abi, signer);

  const fetchWalletAddress = async (userId: string) => {
    const response = await fetch(`/api/user?filter=_id:${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    if (!data.success || !data.users[0]?.walletAddress) {
      throw new Error(`Wallet address not found for user ${userId}`);
    }
    return data.users[0].walletAddress;
  };

  const issuerAddress = await fetchWalletAddress(affidavitData.issuerId);
  const sellerAddress = affidavitData.sellerId
    ? await fetchWalletAddress(affidavitData.sellerId)
    : ethers.ZeroAddress;
  const buyerAddress = affidavitData.buyerId
    ? await fetchWalletAddress(affidavitData.buyerId)
    : ethers.ZeroAddress;

  try {
    const witnesses = Array.isArray(affidavitData.witnesses) ? affidavitData.witnesses : [];
    await window.ethereum.request({ method: "eth_requestAccounts" });

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
    );

    const receipt = await tx.wait();
    const blockNumber = receipt.blockNumber;

    return {
      transactionHash: tx.hash,
      blockNumber,
      ipfsHash: affidavitData.ipfsHash,
    };
  } catch (error: any) {
    console.error("Error deploying affidavit to blockchain:", error);
    throw new Error(`Failed to deploy affidavit to blockchain: ${error.message}`);
  }
}

// New function to issue an affidavit (wrapper for createAffidavit)
export async function issueAffidavit(affidavitId: string, affidavitData: any, token: string) {
  return deployAffidavitContract(affidavitData, token); // Reuse deploy logic for simplicity
}

// New function to verify an affidavit
export async function verifyAffidavit(affidavitId: string) {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("MetaMask is not installed or not running in a browser environment");
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const contract = new ethers.Contract(contractAddress, AffidavitRegistryABI.abi, provider);

  try {
    const [exists, onBlockchain] = await contract.verifyAffidavit(affidavitId);
    if (exists && onBlockchain) {
      const [
        _affidavitId,
        title,
        category,
        description,
        declaration,
        issuer,
        seller,
        buyer,
        ipfsHash,
        timestamp,
        _onBlockchain,
      ] = await contract.getAffidavit(affidavitId);
      return {
        success: true,
        isValid: true,
        data: { affidavitId, title, category, description, declaration, issuer, ipfsHash, timestamp },
      };
    }
    return { success: true, isValid: false, error: "Affidavit not found or not on blockchain" };
  } catch (error: any) {
    console.error("Error verifying affidavit:", error);
    return { success: false, error: `Failed to verify affidavit: ${error.message}` };
  }
}

// New function to get connected MetaMask wallet
export async function getConnectedMetaMaskWallet() {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("MetaMask is not installed or not running in a browser environment");
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const accounts = await provider.send("eth_requestAccounts", []);
  return accounts[0] || null;
}

// New function to get wallet balance
export async function getWalletBalance(walletAddress: string) {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("MetaMask is not installed or not running in a browser environment");
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const balance = await provider.getBalance(walletAddress);
  return ethers.formatEther(balance);
}

// New function to get network name
export async function getNetworkName() {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("MetaMask is not installed or not running in a browser environment");
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const network = await provider.getNetwork();
  return network.name || "Unknown";
}