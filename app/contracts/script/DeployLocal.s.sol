// script/DeployLocal.s.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Script, console2} from "forge-std/Script.sol";
import "../src/DynamicMeme.sol";
import "../src/DynamicMemeFactory.sol";
import "../src/BondingCurve.sol";

contract DeployLocal is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        address WETH = address(0x1);
        address POSITION_MANAGER = address(0x2);
        address SWAP_ROUTER = address(0x3);
        address MULTISIG = vm.addr(deployerPrivateKey);

        vm.startBroadcast(deployerPrivateKey);

        DynamicMemeFactory factory = new DynamicMemeFactory(
            MULTISIG,
            MULTISIG,
            WETH,
            POSITION_MANAGER,
            SWAP_ROUTER
        );

        DynamicMemeFactory.MemeLevel[] memory lengthLevels = new DynamicMemeFactory.MemeLevel[](4);
        lengthLevels[0] = DynamicMemeFactory.MemeLevel(0.001 ether, "8=D");
        lengthLevels[1] = DynamicMemeFactory.MemeLevel(0.01 ether, "8==D");
        lengthLevels[2] = DynamicMemeFactory.MemeLevel(0.1 ether, "8===D");
        lengthLevels[3] = DynamicMemeFactory.MemeLevel(1 ether, "8====D");

        address memeToken = factory.deployMeme(
            "MEME",
            "ipfs://test",
            "length",
            MULTISIG,
            lengthLevels
        );

        vm.stopBroadcast();

        console2.log("Factory deployed to:", address(factory));
        console2.log("Test meme token deployed to:", memeToken);
        console2.log("WETH address:", WETH);
        console2.log("Position Manager address:", POSITION_MANAGER);
        console2.log("Swap Router address:", SWAP_ROUTER);
        console2.log("Multisig/Protocol Fee Recipient:", MULTISIG);
    }
}