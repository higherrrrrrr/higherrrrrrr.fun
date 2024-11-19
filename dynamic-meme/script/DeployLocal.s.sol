// script/DeployLocal.s.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Script, console2} from "forge-std/Script.sol";
import "../src/DynamicMeme.sol";
import "../src/DynamicMemeFactory.sol";
import "../src/BondingCurve.sol";

contract DeployLocal is Script {
    function run() external {
        // Get deployment private key from .env
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        // These are mainnet addresses
        address WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
        address POSITION_MANAGER = 0xC36442b4a4522E871399CD717aBDD847Ab11FE88;
        address SWAP_ROUTER = 0xE592427A0AEce92De3Edee1F18E0157C05861564;
        address MULTISIG = vm.addr(deployerPrivateKey);

        // Start deployment
        vm.startBroadcast(deployerPrivateKey);

        // Deploy factory first
        console2.log("Deploying factory...");
        DynamicMemeFactory factory = new DynamicMemeFactory(
            MULTISIG,
            MULTISIG,
            WETH,
            POSITION_MANAGER,
            SWAP_ROUTER
        );
        console2.log("Factory deployed to:", address(factory));

        // Setup meme levels for test token
        console2.log("Setting up meme levels...");
        DynamicMemeFactory.MemeLevel[] memory lengthLevels = new DynamicMemeFactory.MemeLevel[](4);
        lengthLevels[0] = DynamicMemeFactory.MemeLevel(0.001 ether, "8=D");
        lengthLevels[1] = DynamicMemeFactory.MemeLevel(0.01 ether, "8==D");
        lengthLevels[2] = DynamicMemeFactory.MemeLevel(0.1 ether, "8===D");
        lengthLevels[3] = DynamicMemeFactory.MemeLevel(1 ether, "8====D");

        // Deploy test token
        console2.log("Deploying test token...");
        address memeToken = factory.deployMeme(
            "MEME",
            "ipfs://test",
            "length",
            MULTISIG,
            lengthLevels
        );

        vm.stopBroadcast();

        // Log all addresses
        console2.log("\nDeployment Summary:");
        console2.log("==================");
        console2.log("Factory:                    ", address(factory));
        console2.log("Test meme token:            ", memeToken);
        console2.log("WETH:                       ", WETH);
        console2.log("Position Manager:           ", POSITION_MANAGER);
        console2.log("Swap Router:                ", SWAP_ROUTER);
        console2.log("Multisig/Protocol Fee:      ", MULTISIG);
    }
}