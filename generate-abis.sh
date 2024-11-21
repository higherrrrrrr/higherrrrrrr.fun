#!/bin/bash

# Create directories if they don't exist
mkdir -p app/src/types/contracts

# Move to the forge project directory first
cd evolutionary-meme

# Generate ABI for EvolutionaryMeme
echo "Generating ABI for EvolutionaryMeme..."
forge inspect src/EvolutionaryMeme.sol:EvolutionaryMeme abi > ../app/src/types/contracts/EvolutionaryMeme.json

# Generate ABI for EvolutionaryMemeFactory
echo "Generating ABI for EvolutionaryMemeFactory..."
forge inspect src/EvolutionaryMemeFactory.sol:EvolutionaryMemeFactory abi > ../app/src/types/contracts/EvolutionaryMemeFactory.json

# Move back to root
cd ..

# Run typechain
echo "Generating TypeScript types..."
npx typechain --target ethers-v6 --out-dir app/src/types/contracts './app/src/types/contracts/*.json'

echo "Done! TypeScript types have been generated in app/src/types/contracts/"