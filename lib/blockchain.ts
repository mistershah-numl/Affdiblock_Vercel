import { ethers } from "ethers";

// Hypothetical affidavit contract ABI (replace with your actual ABI)
const AFFIDAVIT_CONTRACT_ABI = [
  "function issueAffidavit(string memory documentHash) public returns (uint256)",
  "function verifyAffidavit(uint256 affidavitId) public view returns (bool)",
];

// Hypothetical contract address (replace with your deployed contract address)
const AFFIDAVIT_CONTRACT_ADDRESS = "0xYourContractAddressHere";

export async function getConnectedMetaMaskWallet(): Promise<string | null> {
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed");
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const accounts = await provider.listAccounts();
    return accounts.length > 0 ? accounts[0].address : null;
  } catch (error) {
    console.error("Error getting connected wallet:", error);
    return null;
  }
}

export async function getWalletBalance(walletAddress: string): Promise<string> {
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed");
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const balance = await provider.getBalance(walletAddress);
    return ethers.formatEther(balance);
  } catch (error) {
    console.error("Error fetching balance:", error);
    throw new Error("Unable to fetch wallet balance");
  }
}

export async function getNetworkName(): Promise<string> {
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed");
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const network = await provider.getNetwork();
    return network.name === "unknown" ? "Ganache" : network.name;
  } catch (error) {
    console.error("Error fetching network:", error);
    throw new Error("Unable to fetch network name");
  }
}

export async function issueAffidavit(documentHash: string): Promise<number> {
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed");
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(AFFIDAVIT_CONTRACT_ADDRESS, AFFIDAVIT_CONTRACT_ABI, signer);
    
    const tx = await contract.issueAffidavit(documentHash);
    const receipt = await tx.wait();
    const affidavitId = receipt.logs[0].args[0].toNumber(); // Adjust based on your contract's event
    return affidavitId;
  } catch (error) {
    console.error("Error issuing affidavit:", error);
    throw new Error("Failed to issue affidavit");
  }
}

export async function verifyAffidavit(affidavitId: number): Promise<boolean> {
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed");
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const contract = new ethers.Contract(AFFIDAVIT_CONTRACT_ADDRESS, AFFIDAVIT_CONTRACT_ABI, provider);
    
    const isValid = await contract.verifyAffidavit(affidavitId);
    return isValid;
  } catch (error) {
    console.error("Error verifying affidavit:", error);
    throw new Error("Failed to verify affidavit");
  }
}