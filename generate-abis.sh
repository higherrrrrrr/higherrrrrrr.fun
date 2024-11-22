#!/bin/bash

# Create directories if they don't exist
mkdir -p app/src/types/contracts

# Move to the protocol directory
cd protocol

# Generate ABI for Higherrrrrrr
echo "Generating ABI for Higherrrrrrr..."
forge inspect src/Higherrrrrrr.sol:Higherrrrrrr abi > ../app/src/types/contracts/Higherrrrrrr.json

# Generate ABI for HigherrrrrrrFactory
echo "Generating ABI for HigherrrrrrrFactory..."
forge inspect src/HigherrrrrrrFactory.sol:HigherrrrrrrFactory abi > ../app/src/types/contracts/HigherrrrrrrFactory.json

# Generate ABI for HigherrrrrrrConviction
echo "Generating ABI for HigherrrrrrrConviction..."
forge inspect src/HigherrrrrrrConviction.sol:HigherrrrrrrConviction abi > ../app/src/types/contracts/HigherrrrrrrConviction.json

# Generate ABI for BondingCurve
echo "Generating ABI for BondingCurve..."
forge inspect src/BondingCurve.sol:BondingCurve abi > ../app/src/types/contracts/BondingCurve.json

# Move back to root
cd ..

# Run typechain
echo "Generating TypeScript types..."
npx typechain --target ethers-v6 --out-dir app/src/types/contracts './app/src/types/contracts/*.json'

echo "Done! TypeScript types have been generated in app/src/types/contracts/"