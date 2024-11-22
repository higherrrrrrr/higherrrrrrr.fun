#!/bin/bash

# Start local Anvil fork of Base mainnet
anvil --fork-url https://mainnet.base.org \
      --fork-block-number 5000000 \
      &

# Wait for Anvil to start
sleep 2

# Deploy contracts
forge script script/DeployWow.s.sol:DeployWow \
    --rpc-url http://localhost:8545 \
    --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
    --broadcast

# Kill Anvil process
trap "kill 0" EXIT 