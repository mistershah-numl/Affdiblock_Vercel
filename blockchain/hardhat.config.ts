import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.20",
  networks: {
    ganache: {
      url: "http://127.0.0.1:7545", // Ganache default RPC URL
      chainId: 1337, // Ganache default chain ID
      accounts: {
        mnemonic: "lady spring actual able smoke wave palace drink citizen timber then barrel", // Replace with your Ganache mnemonic
      },
    },
  },
};

export default config;