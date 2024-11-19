module.exports = {
  solidity: "0.8.0",
  paths: {
    sources: "./contracts/src", // Specify your contracts directory
  },
  typechain: {
    outDir: "types",
    target: "ethers-v5",
  },
};
