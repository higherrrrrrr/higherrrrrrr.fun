#!/bin/bash

# Create directories if they don't exist
mkdir -p app/src/types/contracts

# Move to the forge project directory first
cd dynamic-meme

# Generate ABI for DynamicMeme
echo "Generating ABI for DynamicMeme..."
forge inspect src/DynamicMeme.sol:DynamicMeme abi > ../app/src/types/contracts/DynamicMeme.json

# Generate ABI for DynamicMemeFactory
echo "Generating ABI for DynamicMemeFactory..."
forge inspect src/DynamicMemeFactory.sol:DynamicMemeFactory abi > ../app/src/types/contracts/DynamicMemeFactory.json

# Move back to root
cd ..

# Run typechain
echo "Generating TypeScript types..."
npx typechain --target ethers-v6 --out-dir app/src/types/contracts './app/src/types/contracts/*.json'

echo "Done! TypeScript types have been generated in app/src/types/contracts/"