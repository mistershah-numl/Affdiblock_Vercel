import { ethers } from "ethers"

const INFURA_PROJECT_ID = process.env.NEXT_PUBLIC_INFURA_PROJECT_ID

if (!INFURA_PROJECT_ID) {
  throw new Error("NEXT_PUBLIC_INFURA_PROJECT_ID is not set in environment variables")
}

export const provider = new ethers.JsonRpcProvider(`https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`)