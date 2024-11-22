#!/bin/bash

# Directory where compiled contracts are stored
BUILD_DIR=out

# Maximum contract size in bytes (Ethereum limit)
MAX_CONTRACT_SIZE=24576

# Check if build directory exists
if [ ! -d "$BUILD_DIR" ]; then
    echo "Build directory '$BUILD_DIR' not found. Please run 'forge build' first."
    exit 1
fi

# Initialize an array to hold contract names and sizes
declare -a CONTRACT_SIZES

# Iterate over each JSON file in the build directory
for json_file in $(find "$BUILD_DIR" -type f -name "*.json"); do
    # Extract the contract name from the file path
    contract_name=$(basename "$json_file" .json)
    
    # Extract the bytecode.object field using jq
    bytecode=$(jq -r '.bytecode.object' "$json_file")
    
    if [ "$bytecode" = "null" ] || [ -z "$bytecode" ]; then
        # No bytecode (e.g., abstract contracts, interfaces)
        bytecode_size=0
    else
        # Remove 0x prefix if present
        bytecode=${bytecode#0x}
        
        # Calculate the size in bytes (each 2 hex digits = 1 byte)
        bytecode_length=${#bytecode}
        bytecode_size=$((bytecode_length / 2))
    fi
    
    # Add to the array
    CONTRACT_SIZES+=("$contract_name: $bytecode_size bytes")
done

# Print the results sorted by size descending
echo -e "\nContract Bytecode Sizes (sorted descending):"
echo "--------------------------------------------"
for size_info in "${CONTRACT_SIZES[@]}"; do
    echo "$size_info"
done | sort -t ' ' -k3 -nr
echo "--------------------------------------------"

# Highlight contracts exceeding the limit
echo -e "\nContracts Exceeding 24,576 Bytes (24 KB):"
echo "--------------------------------------------"
for size_info in "${CONTRACT_SIZES[@]}"; do
    size=$(echo "$size_info" | awk '{print $2}')
    if [ "$size" -gt "$MAX_CONTRACT_SIZE" ]; then
        echo "$size_info ⚠️  Over Limit"
    fi
done
echo "--------------------------------------------"
