// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Script.sol";
import "../src/EvolutionaryMemeFactory.sol";

contract Deploy is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        // Base Testnet addresses
        address WETH = 0x4200000000000000000000000000000000000006;
        address POSITION_MANAGER = 0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1;
        address SWAP_ROUTER = 0x2626664c2603336E57B271c5C0b26F421741e481;

        console2.log("Deploying with address:", deployer);
        vm.startBroadcast(deployerPrivateKey);

        // Deploy factory
        EvolutionaryMemeFactory factory = new EvolutionaryMemeFactory(
            deployer,              // fee recipient
            WETH,
            POSITION_MANAGER,
            SWAP_ROUTER
        );
        console2.log("Factory deployed to:", address(factory));

        // Deploy test meme token
        uint256[] memory priceThresholds = new uint256[](4);
        priceThresholds[0] = 0.0001 ether;
        priceThresholds[1] = 0.001 ether;
        priceThresholds[2] = 0.01 ether;
        priceThresholds[3] = 0.1 ether;

        string[] memory memeNames = new string[](4);
        memeNames[0] = "8=D";
        memeNames[1] = "8==D";
        memeNames[2] = "8===D";
        memeNames[3] = "8====D";

        // Deploy meme token
        (address memeToken, address bondingCurve) = factory.deployMeme(
            "MEME",              // symbol
            "ipfs://test",       // tokenURI
            "length",            // memeType
            priceThresholds,
            memeNames
        );

        console2.log("\nDeployment Summary:");
        console2.log("==================");
        console2.log("Factory:", address(factory));
        console2.log("First Meme Token:", memeToken);
        console2.log("Bonding Curve:", bondingCurve);

        vm.stopBroadcast();
    }
}