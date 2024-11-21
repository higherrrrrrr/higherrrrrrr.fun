// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Script, console2} from "forge-std/Script.sol";
import "../src/DynamicMeme.sol";
import "../src/DynamicMemeFactory.sol";
import "../src/BondingCurve.sol";
import "../src/facets/DiamondCutFacet.sol";
import "../src/facets/ERC20Facet.sol";
import "../src/facets/CoreFacet.sol";
import "../src/facets/BondingCurveFacet.sol";
import "../src/facets/UniswapFacet.sol";
import "../src/facets/FeeFacet.sol";
import "../src/facets/MemeFacet.sol";
import "../src/facets/NFTConvictionFacet.sol";
import {LibDiamond} from "../src/libraries/LibDiamond.sol";

contract DeployLocal is Script {
    function run() external {
        // Get deployment private key and multisig address
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address FEE_MULTISIG = vm.envAddress("FEE_MULTISIG");

        // Tenderly Base testnet addresses
        address WETH = 0x4200000000000000000000000000000000000006;
        address POSITION_MANAGER = 0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1;
        address SWAP_ROUTER = 0x2626664c2603336E57B271c5C0b26F421741e481;
        address DEPLOYER = vm.addr(deployerPrivateKey);

        console2.log("Starting deployment on Tenderly Base testnet...");
        console2.log("Deployer address:", DEPLOYER);
        console2.log("Fee Multisig address:", FEE_MULTISIG);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy factory
        console2.log("\nDeploying DynamicMemeFactory...");
        DynamicMemeFactory factory = new DynamicMemeFactory(
            FEE_MULTISIG,        // feeRecipient
            WETH,                // weth
            POSITION_MANAGER,    // positionManager
            SWAP_ROUTER         // swapRouter
        );

        console2.log("Factory deployed to:", address(factory));

        // Log facet addresses
        console2.log("\nFacet Addresses:");
        console2.log("----------------");
        console2.log("DiamondCut Facet:   ", factory.diamondCutFacet());
        console2.log("ERC20 Facet:        ", factory.erc20Facet());
        console2.log("Core Facet:         ", factory.coreFacet());
        console2.log("BondingCurve Facet: ", factory.bondingCurveFacet());
        console2.log("Uniswap Facet:      ", factory.uniswapFacet());
        console2.log("Fee Facet:          ", factory.feeFacet());
        console2.log("Meme Facet:         ", factory.memeFacet());
        console2.log("NFT Conviction:     ", factory.nftConvictionFacet());

        // Setup test deployment
        console2.log("\nPreparing test deployment...");
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

        // Deploy test token
        console2.log("Deploying test meme token...");
        try factory.deployMeme(
            "MEME",          // symbol
            "ipfs://test",   // tokenURI
            "length",        // memeType
            priceThresholds,
            memeNames
        ) returns (address memeToken, address bondingCurveAddress) {
            console2.log("Test meme token deployed at:", memeToken);
            console2.log("Bonding curve deployed at:", bondingCurveAddress);

            // Final deployment summary
            console2.log("\nDeployment Summary:");
            console2.log("==================");
            console2.log("Network:          Tenderly Base Testnet");
            console2.log("Factory:          ", address(factory));
            console2.log("Test token:       ", memeToken);
            console2.log("Bonding Curve:    ", bondingCurveAddress);
            console2.log("WETH:             ", WETH);
            console2.log("Position Manager: ", POSITION_MANAGER);
            console2.log("Swap Router:      ", SWAP_ROUTER);
            console2.log("Fee Multisig:     ", FEE_MULTISIG);

        } catch Error(string memory reason) {
            console2.log("\nFailed to deploy meme token!");
            console2.log("Reason:", reason);
        }

        vm.stopBroadcast();
    }
}