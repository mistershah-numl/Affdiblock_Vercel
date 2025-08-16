import { ethers } from "ethers";

const AffidavitRegistryABI = [
  {
    "inputs": [
      { "internalType": "string", "name": "_affidavitId", "type": "string" },
      { "internalType": "string", "name": "_title", "type": "string" },
      { "internalType": "string", "name": "_category", "type": "string" },
      { "internalType": "string", "name": "_description", "type": "string" },
      { "internalType": "string", "name": "_declaration", "type": "string" },
      { "internalType": "string", "name": "_issuerId", "type": "string" },
      { "internalType": "string", "name": "_sellerId", "type": "string" },
      { "internalType": "string", "name": "_buyerId", "type": "string" },
      { "internalType": "string[]", "name": "_witnessIds", "type": "string[]" },
      { "internalType": "string[]", "name": "_ipfsHashes", "type": "string[]" },
      { "internalType": "string", "name": "_dataHash", "type": "string" }
    ],
    "name": "createAffidavit",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "string", "name": "_affidavitId", "type": "string" }
    ],
    "name": "getAffidavit",
    "outputs": [
      { "internalType": "string", "name": "affidavitId", "type": "string" },
      { "internalType": "string", "name": "title", "type": "string" },
      { "internalType": "string", "name": "category", "type": "string" },
      { "internalType": "string", "name": "description", "type": "string" },
      { "internalType": "string", "name": "declaration", "type": "string" },
      { "internalType": "string", "name": "issuerId", "type": "string" },
      { "internalType": "string", "name": "sellerId", "type": "string" },
      { "internalType": "string", "name": "buyerId", "type": "string" },
      { "internalType": "string[]", "name": "ipfsHashes", "type": "string[]" },
      { "internalType": "string", "name": "dataHash", "type": "string" },
      { "internalType": "uint256", "name": "timestamp", "type": "uint256" },
      { "internalType": "bool", "name": "onBlockchain", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "string", "name": "_affidavitId", "type": "string" }
    ],
    "name": "getWitnesses",
    "outputs": [
      { "internalType": "string[]", "name": "", "type": "string[]" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

export async function createAffidavitOnBlockchain(
  data: {
    affidavitId: string;
    title: string;
    category: string;
    description: string;
    declaration: string;
    issuerId: string;
    sellerId: string;
    buyerId: string;
    witnessIds: string[];
    ipfsHashes: string[];
    dataHash: string;
  }
) {
  try {
    if (!window.ethereum) {
      throw new Error("MetaMask is not installed. Please install MetaMask and try again.");
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0xED7864989c1f88481C5Ac0242F263DC4CE2D427d";
    const contract = new ethers.Contract(contractAddress, AffidavitRegistryABI, signer);

    const tx = await contract.createAffidavit(
      data.affidavitId,
      data.title,
      data.category,
      data.description,
      data.declaration,
      data.issuerId,
      data.sellerId,
      data.buyerId,
      data.witnessIds,
      data.ipfsHashes,
      data.dataHash
    );

    const receipt = await tx.wait();
    const block = await provider.getBlock(receipt.blockNumber);

    return {
      transactionHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
      timestamp: block?.timestamp || Math.floor(Date.now() / 1000),
    };
  } catch (error: any) {
    console.error("Error creating affidavit on blockchain:", error);
    throw new Error(`Failed to create affidavit on blockchain: ${error.message}`);
  }
}