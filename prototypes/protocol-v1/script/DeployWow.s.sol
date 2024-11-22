// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Script, console} from "forge-std/Script.sol";
import {WowEnhancedFactory} from "../src/WowEnhancedFactory.sol";

contract DeployWow is Script {
    // Base Mainnet addresses
    address constant PROTOCOL_FEE_RECIPIENT = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266; // Using first anvil address
    address constant PROTOCOL_REWARDS = 0x70997970C51812dc3A010C7d01b50e0d17dc79C8; // Using second anvil address
    address constant WETH = 0x4200000000000000000000000000000000000006;
    address constant NONFUNGIBLE_POSITION_MANAGER = 0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1;
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

        // Create arrays for price thresholds and names
        uint256[] memory priceThresholds = new uint256[](3);
        string[] memory names = new string[](3);

        // Set up price thresholds and names
        priceThresholds[0] = 0.01 ether;
        priceThresholds[1] = 0.1 ether;
        priceThresholds[2] = 1 ether;

        names[0] = "Smol Wow";
        names[1] = "Medium Wow";
        names[2] = "Big Wow";

        // Deploy a Wow token with 1 ETH initial liquidity
        address wowToken = factory.deployWow{value: 1 ether}(
            msg.sender, // token creator
            address(0xE67b8aC0CCF95c6eBDd2F8800246d73ff5058932), // platform referrer
            "ipfs://QmExample", // token URI
            "Wow Token", // base token name
            "WOW", // token symbol
            priceThresholds,
            names
        );

        console.log("WowEnhancedFactory deployed to:", address(factory));
        console.log("Wow token deployed to:", wowToken);

        vm.stopBroadcast();
    }
}