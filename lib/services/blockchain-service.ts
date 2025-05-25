import { ethers } from "ethers";
import AffidavitRegistryABI from "../../blockchain/artifacts/contracts/AffidavitRegistry.sol/AffidavitRegistry.json";

// Contract address - this will be set after deployment
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Default local deployment address

// RPC URL for the blockchain network
const RPC_URL = process.env.NEXT_PUBLIC_GANACHE_RPC_URL || "http://127.0.0.1:7545";

export function getProvider() {
  if (typeof window !== "undefined" && window.ethereum) {
    return new ethers.BrowserProvider(window.ethereum);
  }
  return new ethers.JsonRpcProvider(RPC_URL);
}

export function getContract(providerOrSigner: ethers.Provider | ethers.Signer) {
  return new ethers.Contract(CONTRACT_ADDRESS, AffidavitRegistryABI.abi, providerOrSigner);
}

export async function createAffidavitOnBlockchain(
  affidavitData: {
    affidavitId: string;
    title: string;
    category: string;
    description: string;
    declaration: string;
    issuerAddress: string;
    sellerAddress?: string;
    buyerAddress?: string;
    witnessIds: string[];
    ipfsHashes: string[]; // Changed to array
    dataHash: string; // Added dataHash
  },
  payerAddresses: string[],
) {
  try {
    if (typeof window === "undefined" || !window.ethereum) {
      throw new Error("MetaMask is not installed. Please install MetaMask to proceed.");
    }

    await window.ethereum.request({ method: "eth_requestAccounts" });

    const provider = getProvider() as ethers.BrowserProvider;
    const signer = await provider.getSigner();
    const contract = getContract(signer);

    const sellerAddress = affidavitData.sellerAddress || "";
    const buyerAddress = affidavitData.buyerAddress || "";

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
      affidavitData.ipfsHashes,
      affidavitData.dataHash,
    );

    const gasLimit = Math.floor(Number(gasEstimate) * 1.2);

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
      affidavitData.ipfsHashes,
      affidavitData.dataHash,
      { gasLimit },
    );

    const receipt = await tx.wait();

    return {
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error creating affidavit on blockchain:", error);
    throw error;
  }
}

export async function verifyAffidavitOnBlockchain(affidavitId: string) {
  try {
    const provider = getProvider();
    const contract = getContract(provider);

    const [exists, isActive] = await contract.verifyAffidavit(affidavitId);

    if (!exists) {
      return { verified: false, reason: "Affidavit does not exist on blockchain" };
    }

    if (!isActive) {
      return { verified: false, reason: "Affidavit has been revoked on blockchain" };
    }

    const affidavitDetails = await contract.getAffidavit(affidavitId);

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
        ipfsHashes: affidavitDetails[8],
        dataHash: affidavitDetails[9],
        timestamp: new Date(Number(affidavitDetails[10]) * 1000),
        isActive: affidavitDetails[11],
      },
    };
  } catch (error) {
    console.error("Error verifying affidavit on blockchain:", error);
    return { verified: false, reason: "Error connecting to blockchain" };
  }
}

export async function getWalletBalance(address: string): Promise<string> {
  try {
    const provider = getProvider();
    const balance = await provider.getBalance(address);
    return ethers.formatEther(balance);
  } catch (error) {
    console.error("Error getting wallet balance:", error);
    throw error;
  }
}

export async function getNetworkName(): Promise<string> {
  try {
    const provider = getProvider();
    const network = await provider.getNetwork();
    return network.name || "localhost";
  } catch (error) {
    console.error("Error getting network name:", error);
    return "unknown";
  }
}

export async function getConnectedMetaMaskWallet(): Promise<string | null> {
  if (typeof window === "undefined" || !window.ethereum) {
    return null;
  }

  try {
    const accounts = await window.ethereum.request({ method: "eth_accounts" });
    return accounts.length > 0 ? accounts[0] : null;
  } catch (error) {
    console.error("Error getting connected wallet:", error);
    return null;
  }
}