// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {LibDiamond} from "../libraries/LibDiamond.sol";
import {LibToken} from "../libraries/LibToken.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IWETH} from "../interfaces/IWETH.sol";
import {ISwapRouter} from "../interfaces/ISwapRouter.sol";
import {IUniswapV3Pool} from "../interfaces/IUniswapV3Pool.sol";
import {INonfungiblePositionManager} from "../interfaces/INonfungiblePositionManager.sol";
import {IBondingCurve} from "../interfaces/IBondingCurve.sol";

contract MarketFacet {
    using SafeERC20 for IERC20;

    // Constants (from Wow contract)
    uint24 internal constant LP_FEE = 500;
    int24 internal constant LP_TICK_LOWER = -887200;
    int24 internal constant LP_TICK_UPPER = 887200;
    uint256 internal constant MIN_ORDER_SIZE = 0.0000001 ether;

    // Events
    event TokensPurchased(
        address indexed buyer,
        address indexed recipient,
        uint256 ethAmount,
        uint256 tokenAmount,
        uint8 marketType
    );

    event TokensSold(
        address indexed seller,
        address indexed recipient,
        uint256 tokenAmount,
        uint256 ethAmount,
        uint8 marketType
    );

    event MarketGraduated(
        address token,
        address pool,
        uint256 ethLiquidity,
        uint256 tokenLiquidity,
        uint256 positionId
    );

    // Errors
    error SlippageTooHigh();
    error OrderTooSmall();
    error InvalidMarketType();
    error TransferFailed();
    error ZeroAddress();

    /**
     * @notice Buy tokens with ETH
     * @param recipient Address to receive tokens
     * @param minTokensOut Minimum tokens expected
     */
    function buy(
        address recipient,
        uint256 minTokensOut
    ) external payable returns (uint256 tokensBought) {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();

        if (msg.value < MIN_ORDER_SIZE) revert OrderTooSmall();
        if (recipient == address(0)) revert ZeroAddress();

        // Calculate and take fee
        uint256 fee = (msg.value * 100) / 10000; // 1% fee
        uint256 amountForPurchase = msg.value - fee;

        // Send fee to recipient
        (bool success,) = ds.protocolFeeRecipient.call{value: fee}("");
        if (!success) revert TransferFailed();

        // Execute purchase based on market type
        if (ds.marketType == 0) {
            // Bonding Curve Market
            tokensBought = _buyFromBondingCurve(recipient, amountForPurchase, minTokensOut);

            // Check if we should graduate to Uniswap
            if (ds.totalSupply >= LibDiamond.PRIMARY_MARKET_SUPPLY) {
                _graduateMarket();
            }
        } else {
            // Uniswap Market
            tokensBought = _buyFromUniswap(recipient, amountForPurchase, minTokensOut);
        }

        // Check for NFT eligibility
        _checkAndMintNFT(recipient);

        emit TokensPurchased(
            msg.sender,
            recipient,
            msg.value,
            tokensBought,
            ds.marketType
        );

        return tokensBought;
    }

    /**
     * @notice Sell tokens for ETH
     */
    function sell(
        uint256 tokenAmount,
        uint256 minEthOut,
        address recipient
    ) external returns (uint256 ethAmount) {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();

        if (tokenAmount == 0) revert OrderTooSmall();
        if (recipient == address(0)) revert ZeroAddress();

        if (ds.marketType == 0) {
            ethAmount = _sellToBondingCurve(tokenAmount, minEthOut);
        } else {
            ethAmount = _sellToUniswap(tokenAmount, minEthOut);
        }

        // Calculate and take fee
        uint256 fee = (ethAmount * 100) / 10000; // 1% fee
        uint256 amountAfterFee = ethAmount - fee;

        // Send fee
        (bool feeSuccess,) = ds.protocolFeeRecipient.call{value: fee}("");
        if (!feeSuccess) revert TransferFailed();

        // Send ETH to recipient
        (bool success,) = recipient.call{value: amountAfterFee}("");
        if (!success) revert TransferFailed();

        emit TokensSold(
            msg.sender,
            recipient,
            tokenAmount,
            ethAmount,
            ds.marketType
        );

        return ethAmount;
    }

    /**
     * @notice Internal function to handle bonding curve purchases
     */
    function _buyFromBondingCurve(
        address recipient,
        uint256 ethAmount,
        uint256 minTokensOut
    ) internal returns (uint256) {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();

        uint256 tokensBought = IBondingCurve(ds.bondingCurve).getEthBuyQuote(
            ds.totalSupply,
            ethAmount
        );

        if (tokensBought < minTokensOut) revert SlippageTooHigh();

        // Check if this would exceed PRIMARY_MARKET_SUPPLY
        uint256 newSupply = ds.totalSupply + tokensBought;
        if (newSupply > LibDiamond.PRIMARY_MARKET_SUPPLY) {
            tokensBought = LibDiamond.PRIMARY_MARKET_SUPPLY - ds.totalSupply;
        }

        LibToken._mint(recipient, tokensBought);
        return tokensBought;
    }

    /**
     * @notice Internal function to handle Uniswap purchases
     */
    function _buyFromUniswap(
        address recipient,
        uint256 ethAmount,
        uint256 minTokensOut
    ) internal returns (uint256) {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();

        // Convert ETH to WETH
        IWETH(ds.weth).deposit{value: ethAmount}();

        // Approve router
        IERC20(ds.weth).safeIncreaseAllowance(ds.swapRouter, ethAmount);

        // Execute swap
        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
            tokenIn: ds.weth,
            tokenOut: address(this),
            fee: LP_FEE,
            recipient: recipient,
            amountIn: ethAmount,
            amountOutMinimum: minTokensOut,
            sqrtPriceLimitX96: 0
        });

        return ISwapRouter(ds.swapRouter).exactInputSingle(params);
    }

    /**
     * @notice Internal function to handle bonding curve sells
     */
    function _sellToBondingCurve(
        uint256 tokenAmount,
        uint256 minEthOut
    ) internal returns (uint256) {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();

        uint256 ethAmount = IBondingCurve(ds.bondingCurve).getTokenSellQuote(
            ds.totalSupply,
            tokenAmount
        );

        if (ethAmount < minEthOut) revert SlippageTooHigh();

        // Burn tokens from seller
        LibToken._burn(msg.sender, tokenAmount);

        return ethAmount;
    }

    /**
     * @notice Internal function to handle Uniswap sells
     */
    function _sellToUniswap(
        uint256 tokenAmount,
        uint256 minEthOut
    ) internal returns (uint256) {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();

        // Transfer tokens to contract
        LibToken._transfer(msg.sender, address(this), tokenAmount);

        // Approve router
        LibToken._approve(address(this), ds.swapRouter, tokenAmount);

        // Execute swap
        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
            tokenIn: address(this),
            tokenOut: ds.weth,
            fee: LP_FEE,
            recipient: address(this),
            amountIn: tokenAmount,
            amountOutMinimum: minEthOut,
            sqrtPriceLimitX96: 0
        });

        uint256 wethAmount = ISwapRouter(ds.swapRouter).exactInputSingle(params);

        // Unwrap WETH
        IWETH(ds.weth).withdraw(wethAmount);

        return wethAmount;
    }

    /**
     * @notice Graduate from bonding curve to Uniswap
     */
    function _graduateMarket() internal {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();

        // Update market type
        ds.marketType = 1; // UNISWAP_POOL

        // Get ETH balance and convert to WETH
        uint256 ethLiquidity = address(this).balance;
        IWETH(ds.weth).deposit{value: ethLiquidity}();

        // Mint secondary market supply
        uint256 tokenLiquidity = LibDiamond.SECONDARY_MARKET_SUPPLY;
        LibToken._mint(address(this), tokenLiquidity);

        // Approve position manager
        IERC20(ds.weth).safeIncreaseAllowance(ds.nonfungiblePositionManager, ethLiquidity);
        LibToken._approve(address(this), ds.nonfungiblePositionManager, tokenLiquidity);

        // Determine token order
        bool isWethToken0 = address(ds.weth) < address(this);
        address token0 = isWethToken0 ? ds.weth : address(this);
        address token1 = isWethToken0 ? address(this) : ds.weth;
        uint256 amount0 = isWethToken0 ? ethLiquidity : tokenLiquidity;
        uint256 amount1 = isWethToken0 ? tokenLiquidity : ethLiquidity;

        // Create liquidity position
        INonfungiblePositionManager.MintParams memory params = INonfungiblePositionManager.MintParams({
            token0: token0,
            token1: token1,
            fee: LP_FEE,
            tickLower: LP_TICK_LOWER,
            tickUpper: LP_TICK_UPPER,
            amount0Desired: amount0,
            amount1Desired: amount1,
            amount0Min: 0,
            amount1Min: 0,
            recipient: address(this),
            deadline: block.timestamp
        });

        // Mint position
        (uint256 positionId, uint128 liquidity, uint256 amount0Used, uint256 amount1Used) =
                                INonfungiblePositionManager(ds.nonfungiblePositionManager).mint(params);

        // Save position ID
        ds.positionId = positionId;

        emit MarketGraduated(
            address(this),
            ds.poolAddress,
            amount0Used,
            amount1Used,
            positionId
        );
    }

    /**
     * @notice Check NFT eligibility and mint if qualified
     */
    function _checkAndMintNFT(address user) internal {
        // Only try to mint if they don't already have an NFT
        if (!NFTConvictionFacet(address(this)).hasConviction(user)) {
            LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
            if (ds.balances[user] >= LibDiamond.CONVICTION_THRESHOLD) {
                try NFTConvictionFacet(address(this)).mintConviction() {
                    // NFT minted successfully
                } catch {
                    // Mint failed - user can mint manually later
                }
            }
        }
    }

    /**
     * @notice Get current market info
     */
    function getMarketInfo() external view returns (
        uint8 currentMarketType,
        address marketAddress,
        uint256 currentSupply,
        uint256 totalSupply,
        uint256 convictionThreshold
    ) {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        return (
            ds.marketType,
            ds.marketType == 0 ? address(this) : ds.poolAddress,
            ds.totalSupply,
            LibDiamond.MAX_TOTAL_SUPPLY,
            LibDiamond.CONVICTION_THRESHOLD
        );
    }

    receive() external payable {
        if (msg.sender != LibDiamond.diamondStorage().weth) {
            this.buy{value: msg.value}(msg.sender, 0);
        }
    }

    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external view returns (bytes4) {
        if (msg.sender != LibDiamond.diamondStorage().poolAddress) {
            revert("Not pool");
        }
        return this.onERC721Received.selector;
    }
}