// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Script, console} from "forge-std/Script.sol";
import {WowEnhancedFactory} from "../src/WowEnhancedFactory.sol";

contract DeployWow is Script {
    // Base Mainnet addresses
    address constant PROTOCOL_FEE_RECIPIENT = address(0x1234); // Replace with actual address
    address constant PROTOCOL_REWARDS = address(0x1234); // Replace with actual address
    address constant WETH = 0x4200000000000000000000000000000000000006;
    address constant NONFUNGIBLE_POSITION_MANAGER = 0x03A520b32c04bf3Be5F46662Ae1bD6c0C40E2c44; // Fixed checksum
    address constant SWAP_ROUTER = 0x2626664c2603336E57B271c5C0b26F421741e481;

    function run() public {
        // Rest of the code remains the same...
    }
} 