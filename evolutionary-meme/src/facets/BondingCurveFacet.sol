// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {LibDiamond} from "../libraries/LibDiamond.sol";
import {FixedPointMathLib} from "solady/utils/FixedPointMathLib.sol";

contract BondingCurveFacet {
    using FixedPointMathLib for uint256;
    using FixedPointMathLib for int256;

    error InsufficientLiquidity();
    error OrderTooSmall();
    error ZeroAddress();
    error NotBondingCurve();
    error SlippageTooHigh();

    uint256 public constant MIN_ORDER_SIZE = 0.0000001 ether;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event BondingCurveBuy(
        address buyer,
        address recipient,
        uint256 ethAmount,
        uint256 tokenAmount,
        uint256 newTotalSupply
    );
    event BondingCurveSell(
        address seller,
        address recipient,
        uint256 tokenAmount,
        uint256 ethAmount,
        uint256 newTotalSupply
    );

    modifier onlyBondingCurve() {
        if (LibDiamond.diamondStorage().marketType != 0) revert NotBondingCurve();
        _;
    }

    function buy(
        address recipient,
        address refundRecipient,
        uint256 minTokensOut
    ) external payable onlyBondingCurve returns (uint256 tokensBought) {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();

        if (msg.value < MIN_ORDER_SIZE) revert OrderTooSmall();
        if (recipient == address(0)) revert ZeroAddress();

        // Calculate tokens to buy using bonding curve formula
        uint256 ethForTokens = msg.value;
        tokensBought = getEthBuyQuote(ds.totalSupply, ethForTokens);

        if (tokensBought < minTokensOut) revert SlippageTooHigh();

        // Check if this would exceed PRIMARY_MARKET_SUPPLY
        uint256 newSupply = ds.totalSupply + tokensBought;
        if (newSupply > LibDiamond.PRIMARY_MARKET_SUPPLY) {
            tokensBought = LibDiamond.PRIMARY_MARKET_SUPPLY - ds.totalSupply;
            ethForTokens = getTokenBuyQuote(ds.totalSupply, tokensBought);

            // Refund excess ETH
            uint256 refund = msg.value - ethForTokens;
            if (refund > 0) {
                (bool success,) = refundRecipient.call{value: refund}("");
                require(success, "ETH refund failed");
            }
        }

        // Mint tokens to recipient
        ds.totalSupply += tokensBought;
        ds.balances[recipient] += tokensBought;
        emit Transfer(address(0), recipient, tokensBought);

        emit BondingCurveBuy(
            msg.sender,
            recipient,
            ethForTokens,
            tokensBought,
            ds.totalSupply
        );

        // Check if we should graduate to Uniswap
        if (ds.totalSupply >= LibDiamond.PRIMARY_MARKET_SUPPLY) {
            ds.marketType = 1; // Graduate to UNISWAP_POOL
        }

        return tokensBought;
    }

    function sell(
        uint256 tokenAmount,
        address recipient,
        uint256 minEthOut
    ) external onlyBondingCurve returns (uint256 ethAmount) {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();

        if (recipient == address(0)) revert ZeroAddress();
        require(tokenAmount <= ds.balances[msg.sender], "Insufficient balance");

        // Calculate ETH to receive using bonding curve formula
        ethAmount = getTokenSellQuote(ds.totalSupply, tokenAmount);

        if (ethAmount < minEthOut) revert SlippageTooHigh();
        if (ethAmount < MIN_ORDER_SIZE) revert OrderTooSmall();

        // Burn tokens from seller
        ds.balances[msg.sender] -= tokenAmount;
        ds.totalSupply -= tokenAmount;
        emit Transfer(msg.sender, address(0), tokenAmount);

        // Send ETH to recipient
        (bool success,) = recipient.call{value: ethAmount}("");
        require(success, "ETH transfer failed");

        emit BondingCurveSell(
            msg.sender,
            recipient,
            tokenAmount,
            ethAmount,
            ds.totalSupply
        );

        return ethAmount;
    }

    // Bonding curve calculation functions
    function getEthSellQuote(uint256 currentSupply, uint256 ethOrderSize) public pure returns (uint256) {
        uint256 deltaY = ethOrderSize;
        uint256 x0 = currentSupply;
        uint256 exp_b_x0 = uint256((int256(B().mulWad(x0))).expWad());

        uint256 exp_b_x1 = exp_b_x0 - deltaY.fullMulDiv(B(), A());
        uint256 x1 = uint256(int256(exp_b_x1).lnWad()).divWad(B());
        uint256 tokensToSell = x0 - x1;

        return tokensToSell;
    }

    function getTokenSellQuote(uint256 currentSupply, uint256 tokensToSell) public pure returns (uint256) {
        if (currentSupply < tokensToSell) revert InsufficientLiquidity();
        uint256 x0 = currentSupply;
        uint256 x1 = x0 - tokensToSell;

        uint256 exp_b_x0 = uint256((int256(B().mulWad(x0))).expWad());
        uint256 exp_b_x1 = uint256((int256(B().mulWad(x1))).expWad());

        uint256 deltaY = (exp_b_x0 - exp_b_x1).fullMulDiv(A(), B());

        return deltaY;
    }

    function getEthBuyQuote(uint256 currentSupply, uint256 ethOrderSize) public pure returns (uint256) {
        uint256 x0 = currentSupply;
        uint256 deltaY = ethOrderSize;

        uint256 exp_b_x0 = uint256((int256(B().mulWad(x0))).expWad());
        uint256 exp_b_x1 = exp_b_x0 + deltaY.fullMulDiv(B(), A());
        uint256 deltaX = uint256(int256(exp_b_x1).lnWad()).divWad(B()) - x0;

        return deltaX;
    }

    function getTokenBuyQuote(uint256 currentSupply, uint256 tokenOrderSize) public pure returns (uint256) {
        uint256 x0 = currentSupply;
        uint256 x1 = tokenOrderSize + currentSupply;

        uint256 exp_b_x0 = uint256((int256(B().mulWad(x0))).expWad());
        uint256 exp_b_x1 = uint256((int256(B().mulWad(x1))).expWad());

        uint256 deltaY = (exp_b_x1 - exp_b_x0).fullMulDiv(A(), B());

        return deltaY;
    }

    function getCurrentPrice(uint256 totalSupply) public pure returns (uint256) {
        uint256 exp_b_x = uint256((int256(B().mulWad(totalSupply))).expWad());
        return A().mulWad(exp_b_x);
    }

    // Constants as functions to match interface
    function A() public pure returns (uint256) {
        return 1060848709;
    }

    function B() public pure returns (uint256) {
        return 4379701787;
    }

    // Helper view functions
    function getCurrentPriceView() public view returns (uint256) {
        return getCurrentPrice(LibDiamond.diamondStorage().totalSupply);
    }

    function remainingPrimarySupply() external view returns (uint256) {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        if (ds.totalSupply >= LibDiamond.PRIMARY_MARKET_SUPPLY) return 0;
        return LibDiamond.PRIMARY_MARKET_SUPPLY - ds.totalSupply;
    }

    receive() external payable {
        if (msg.sender != LibDiamond.diamondStorage().weth) {
            this.buy{value: msg.value}(msg.sender, msg.sender, 0);
        }
    }
}