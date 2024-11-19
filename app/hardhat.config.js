const path = require("path");

module.exports = {
  solidity: "0.8.0",
  paths: {
    sources: "./contracts/src", // Specify your contracts directory
    libraries: path.join(__dirname, "lib"), // Add this line to include Foundry libraries
  },
  typechain: {
    outDir: "types",
    target: "ethers-v5",
  },
};
