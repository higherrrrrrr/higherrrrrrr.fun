// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "../src/EvolutionaryMemeFactory.sol";
import "../src/facets/BondingCurveFacet.sol";
import "../src/libraries/LibDiamond.sol";

contract EvolutionaryMemeTest is Test {
    EvolutionaryMemeFactory factory;
    address memeToken;
    address bondingCurveFacet;

    // Test addresses
    address constant WETH = address(0x1);
    address constant POSITION_MANAGER = address(0x2);
    address constant SWAP_ROUTER = address(0x3);
    address constant FEE_RECIPIENT = address(0x4);

    function setUp() public {
        console.log("Starting setup...");
        
        // Mock WETH behavior
        vm.mockCall(
            WETH,
            abi.encodeWithSelector(IWETH.deposit.selector),
            abi.encode()
        );
        console.log("WETH deposit mock successful");

        vm.mockCall(
            WETH,
            abi.encodeWithSelector(IWETH.withdraw.selector),
            abi.encode()
        );
        console.log("WETH withdraw mock successful");

        vm.mockCall(
            WETH,
            abi.encodeWithSelector(IERC20.transfer.selector),
            abi.encode(true)
        );
        console.log("WETH transfer mock successful");

        vm.mockCall(
            WETH,
            abi.encodeWithSelector(IERC20.transferFrom.selector),
            abi.encode(true)
        );
        console.log("WETH transferFrom mock successful");
        console.log("WETH mocks completed, continuing setup...");

        // Deploy factory with test addresses
        console.log("Deploying factory...");
        factory = new EvolutionaryMemeFactory(
            FEE_RECIPIENT,
            WETH,
            POSITION_MANAGER,
            SWAP_ROUTER
        );
        console.log("Factory deployed successfully at:", address(factory));

        // Deploy a test meme token
        console.log("Setting up meme levels...");
        string[] memory memeNames = new string[](1);
        memeNames[0] = "Test Meme";
        
        uint256[] memory priceThresholds = new uint256[](1);
        priceThresholds[0] = 1 ether;

        console.log("Deploying meme token...");

        try factory.deployMeme(
            "TEST",
            "test.com",
            "test",
            priceThresholds,
            memeNames
        ) returns (address _memeToken, address _bondingCurveFacet) {
            console.log("Meme token deployment successful");
            memeToken = _memeToken;
            bondingCurveFacet = _bondingCurveFacet;
            console.log("Meme token deployed at:", memeToken);
            console.log("Bonding curve facet at:", bondingCurveFacet);
        } catch Error(string memory reason) {
            console.log("Meme token deployment failed with reason:", reason);
            revert("Meme token deployment failed with reason");
        } catch (bytes memory) {
            console.log("Meme token deployment failed with low-level error");
            console.log("Factory address:", address(factory));
            console.log("WETH address:", WETH);
            console.log("Position Manager address:", POSITION_MANAGER);
            console.log("Swap Router address:", SWAP_ROUTER);
            revert("Meme token deployment failed with low-level error");
        }

        console.log("Setup completed successfully");
    }

    function test_bondingCurveCalculations() public {
        console.log("Starting bonding curve calculations test");
        
        // Test getEthBuyQuote
        uint256 supply = 0;
        uint256 ethAmount = 1 ether;
        uint256 tokenAmount = BondingCurveFacet(bondingCurveFacet).getEthBuyQuote(supply, ethAmount);
        assertGt(tokenAmount, 0, "Token amount should be greater than 0");

        // Test getTokenSellQuote
        supply = 1000000 ether;
        uint256 tokensToSell = 100000 ether;
        uint256 ethOut = BondingCurveFacet(bondingCurveFacet).getTokenSellQuote(supply, tokensToSell);
        assertGt(ethOut, 0, "ETH out should be greater than 0");

        // Test getCurrentPrice
        uint256 price = BondingCurveFacet(bondingCurveFacet).getCurrentPrice(supply);
        assertGt(price, 0, "Price should be greater than 0");

        // Test price increases with supply
        uint256 higherSupply = supply + 1000000 ether;
        uint256 higherPrice = BondingCurveFacet(bondingCurveFacet).getCurrentPrice(higherSupply);
        assertGt(higherPrice, price, "Price should increase with supply");

        console.log("Bonding curve calculations test completed successfully");
    }

    function test_bondingCurveConstants() public {
        console.log("Starting bonding curve constants test");
        assertGt(BondingCurveFacet(bondingCurveFacet).A(), 0, "A should be greater than 0");
        assertGt(BondingCurveFacet(bondingCurveFacet).B(), 0, "B should be greater than 0");
        console.log("Bonding curve constants test completed successfully");
    }

    // Helper function for logging state
    function _logState(string memory label) internal view {
        console.log("\n=== %s ===", label);
        console.log("Current Price:", BondingCurveFacet(bondingCurveFacet).getCurrentPrice(0));
        console.log("Price at 1 ETH Supply:", BondingCurveFacet(bondingCurveFacet).getCurrentPrice(1 ether));
    }
} 