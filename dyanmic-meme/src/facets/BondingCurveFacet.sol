// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {LibDiamond} from "../libraries/LibDiamond.sol";
import {LibToken} from "../libraries/LibToken.sol";
import {IBondingCurve} from "../interfaces/IBondingCurve.sol";
import {MemeFacet} from "./MemeFacet.sol";

contract BondingCurveFacet {
    uint256 public constant MIN_ORDER_SIZE = 0.0000001 ether;

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

    error SlippageTooHigh();
    error OrderTooSmall();
    error NotBondingCurve();
    error AlreadyGraduated();
    error MaxSupplyReached();
    error ZeroAddress();

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

        // Calculate tokens to buy
        uint256 ethForTokens = msg.value;
        tokensBought = IBondingCurve(ds.bondingCurve).getEthBuyQuote(
            ds.totalSupply,
            ethForTokens
        );

        if (tokensBought < minTokensOut) revert SlippageTooHigh();

        // Check if this would exceed PRIMARY_MARKET_SUPPLY
        uint256 newSupply = ds.totalSupply + tokensBought;
        if (newSupply > LibDiamond.PRIMARY_MARKET_SUPPLY) {
            // Calculate exact amount to reach PRIMARY_MARKET_SUPPLY
            tokensBought = LibDiamond.PRIMARY_MARKET_SUPPLY - ds.totalSupply;

            // Recalculate ETH needed
            ethForTokens = IBondingCurve(ds.bondingCurve).getTokenBuyQuote(
                ds.totalSupply,
                tokensBought
            );

            // Refund excess ETH
            uint256 refund = msg.value - ethForTokens;
            if (refund > 0) {
                (bool success,) = refundRecipient.call{value: refund}("");
                require(success, "ETH refund failed");
            }
        }

        // Mint tokens to recipient
        LibToken._mint(recipient, tokensBought);

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

        // Calculate ETH to receive
        ethAmount = IBondingCurve(ds.bondingCurve).getTokenSellQuote(
            ds.totalSupply,
            tokenAmount
        );

        if (ethAmount < minEthOut) revert SlippageTooHigh();
        if (ethAmount < MIN_ORDER_SIZE) revert OrderTooSmall();

        // Burn tokens from seller
        LibToken._burn(msg.sender, tokenAmount);

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

    function getTokensForEth(uint256 ethAmount) external view onlyBondingCurve returns (uint256) {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        return IBondingCurve(ds.bondingCurve).getEthBuyQuote(
            ds.totalSupply,
            ethAmount
        );
    }

    function getEthForTokens(uint256 tokenAmount) external view onlyBondingCurve returns (uint256) {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        return IBondingCurve(ds.bondingCurve).getTokenSellQuote(
            ds.totalSupply,
            tokenAmount
        );
    }

    function getCurrentPriceView() public view returns (uint256) {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();

        uint256 remainingTokenLiquidity = ds.balances[address(this)];
        uint256 ethBalance = address(this).balance;

        if (ethBalance < 0.01 ether) {
            ethBalance = 0.01 ether;
        }

        return (remainingTokenLiquidity * 1e18) / ethBalance;
    }

    /// @notice Gets current price and updates meme if needed
    function getCurrentPrice() external returns (uint256) {
        // Update meme based on current price
        if (LibDiamond.diamondStorage().marketType == 1) { // Only if in Uniswap market
            MemeFacet(address(this)).updateMeme();
        }

        return getCurrentPriceView();
    }

    receive() external payable {
        if (msg.sender != LibDiamond.diamondStorage().weth) {
            this.buy(msg.sender, msg.sender, 0);
        }
    }

    // Helper function to check remaining supply in primary market
    function remainingPrimarySupply() external view returns (uint256) {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        if (ds.totalSupply >= LibDiamond.PRIMARY_MARKET_SUPPLY) return 0;
        return LibDiamond.PRIMARY_MARKET_SUPPLY - ds.totalSupply;
    }

    /// @notice Gets market state using view function
    function getMarketState() external view returns (
        uint256 totalSupply,
        uint256 ethBalance,
        uint256 spotPrice,
        bool isGraduated
    ) {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        return (
            ds.totalSupply,
            address(this).balance,
            getCurrentPriceView(), // Use view version
            ds.marketType != 0
        );
    }

}