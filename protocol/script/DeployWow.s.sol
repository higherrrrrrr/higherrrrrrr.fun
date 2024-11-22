// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Script, console} from "forge-std/Script.sol";
import {WowEnhancedFactory} from "../src/WowEnhancedFactory.sol";

contract DeployWow is Script {
    // Base Mainnet addresses
    address constant PROTOCOL_FEE_RECIPIENT = address(0x1234); // Replace with actual address
    address constant PROTOCOL_REWARDS = address(0x1234); // Replace with actual address
    address constant WETH = 0x4200000000000000000000000000000000000006;
    address constant NONFUNGIBLE_POSITION_MANAGER = 0x03A520b32c04bf3Be5F46662Ae1bD6c0C40E2c44;
    address constant SWAP_ROUTER = 0x2626664c2603336E57B271c5C0b26F421741e481;

    function run() public {
        // Begin recording transactions for deployment
        vm.startBroadcast();

        // Deploy WowEnhancedFactory
        WowEnhancedFactory factory = new WowEnhancedFactory(
            PROTOCOL_FEE_RECIPIENT,
            PROTOCOL_REWARDS,
            WETH,
            NONFUNGIBLE_POSITION_MANAGER,
            SWAP_ROUTER
        );

        // Example deployment of a Wow token
        WowEnhancedFactory.NameConfig memory nameConfig = WowEnhancedFactory.NameConfig({
            priceThresholds: new uint256[](3),
            names: new string[](3)
        });

        // Set up name configuration
        nameConfig.priceThresholds[0] = 0.01 ether;
        nameConfig.priceThresholds[1] = 0.1 ether;
        nameConfig.priceThresholds[2] = 1 ether;

        nameConfig.names[0] = "Smol Wow";
        nameConfig.names[1] = "Medium Wow";
        nameConfig.names[2] = "Big Wow";

        // Deploy a Wow token with 1 ETH initial liquidity
        address wowToken = factory.deployWow{value: 1 ether}(
            msg.sender, // token creator
            address(0), // platform referrer (will default to protocol fee recipient)
            "ipfs://QmExample", // token URI
            "Wow Token", // base token name
            "WOW", // token symbol
            nameConfig
        );

        console.log("WowEnhancedFactory deployed to:", address(factory));
        console.log("Wow token deployed to:", wowToken);

        vm.stopBroadcast();
    }
} 