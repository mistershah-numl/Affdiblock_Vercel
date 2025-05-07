require("@nomicfoundation/hardhat-toolbox")

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.19",
  networks: {
    hardhat: {
      chainId: 1337,
    },
    localhost: {
      url: "http://127.0.0.1:7545", // Match Ganache's port
      accounts: {
        mnemonic: "lady spring actual able smoke wave palace drink citizen timber then barrel",
      },
    },
    ganache: {
      url: "http://127.0.0.1:7545",
      accounts: {
        mnemonic: "lady spring actual able smoke wave palace drink citizen timber then barrel",
      },
    },
  },
  paths: {
    artifacts: "./artifacts",
    cache: "./cache",
    sources: "./contracts",
    tests: "./test",
  },
}