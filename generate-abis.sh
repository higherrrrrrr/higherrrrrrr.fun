#!/bin/bash

# Create directories if they don't exist
mkdir -p alpha/src/types/contracts

# Move to the protocol directory
cd higherrrrrrr-protocol

# Generate ABI for Higherrrrrrr
echo "Generating ABI for Higherrrrrrr..."
forge inspect src/Higherrrrrrr.sol:Higherrrrrrr abi > ../alpha/src/types/contracts/Higherrrrrrr.json

# Generate ABI for HigherrrrrrrFactory
echo "Generating ABI for HigherrrrrrrFactory..."
forge inspect src/HigherrrrrrrFactory.sol:HigherrrrrrrFactory abi > ../alpha/src/types/contracts/HigherrrrrrrFactory.json

# Generate ABI for HigherrrrrrrConviction
echo "Generating ABI for HigherrrrrrrConviction..."
forge inspect src/HigherrrrrrrConviction.sol:HigherrrrrrrConviction abi > ../alpha/src/types/contracts/HigherrrrrrrConviction.json

# Generate ABI for BondingCurve
echo "Generating ABI for BondingCurve..."
forge inspect src/BondingCurve.sol:BondingCurve abi > ../alpha/src/types/contracts/BondingCurve.json

# Move back to root
cd ..

# Install typechain if not already installed
cd alpha
yarn add -D typechain @typechain/ethers-v6

# Run typechain
echo "Generating TypeScript types..."
npx typechain --target ethers-v6 --out-dir src/types/contracts './src/types/contracts/*.json'

echo "Done! TypeScript types have been generated in alpha/src/types/contracts/"