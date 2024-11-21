// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "../src/facets/BondingCurveFacet.sol";
import "../src/libraries/LibDiamond.sol";

contract EvolutionaryMemeTest is Test {
    BondingCurveFacet bondingCurve;

    function setUp() public {
        bondingCurve = new BondingCurveFacet();
    }

    function test_bondingCurveCalculations() public {
        // Test getEthBuyQuote
        uint256 supply = 0;
        uint256 ethAmount = 1 ether;
        uint256 tokenAmount = bondingCurve.getEthBuyQuote(supply, ethAmount);
        assertGt(tokenAmount, 0, "Token amount should be greater than 0");

        // Test getTokenSellQuote
        supply = 1000000 ether;
        uint256 tokensToSell = 100000 ether;
        uint256 ethOut = bondingCurve.getTokenSellQuote(supply, tokensToSell);
        assertGt(ethOut, 0, "ETH out should be greater than 0");

        // Test getCurrentPrice
        uint256 price = bondingCurve.getCurrentPrice(supply);
        assertGt(price, 0, "Price should be greater than 0");

        // Test price increases with supply
        uint256 higherSupply = supply + 1000000 ether;
        uint256 higherPrice = bondingCurve.getCurrentPrice(higherSupply);
        assertGt(higherPrice, price, "Price should increase with supply");
    }

    function test_bondingCurveConstants() public {
        assertGt(bondingCurve.A(), 0, "A should be greater than 0");
        assertGt(bondingCurve.B(), 0, "B should be greater than 0");
    }

    // Single helper function for logging state
    function _logState(string memory label) internal view {
        console.log("\n=== %s ===", label);
        console.log("Current Price:", bondingCurve.getCurrentPrice(0));
        console.log("Price at 1 ETH Supply:", bondingCurve.getCurrentPrice(1 ether));
    }
} 