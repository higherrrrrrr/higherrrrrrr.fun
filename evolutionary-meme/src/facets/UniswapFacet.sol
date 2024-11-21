// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {LibDiamond} from "../libraries/LibDiamond.sol";
import {LibToken} from "../libraries/LibToken.sol";
import {IWETH} from "../interfaces/IWETH.sol";
import {ISwapRouter} from "../interfaces/ISwapRouter.sol";
import {IUniswapV3Pool} from "../interfaces/IUniswapV3Pool.sol";
import {INonfungiblePositionManager} from "../interfaces/INonfungiblePositionManager.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract UniswapFacet {
    using SafeERC20 for IERC20;

    uint24 internal constant LP_FEE = 500;
    int24 internal constant LP_TICK_LOWER = -887200;
    int24 internal constant LP_TICK_UPPER = 887200;
    uint160 internal constant POOL_SQRT_PRICE_X96 = 79228162514264337593543950336; // 1:1 initial price

    event MarketGraduated(
        address token,
        address pool,
        uint256 ethLiquidity,
        uint256 tokenLiquidity,
        uint256 positionId
    );

    event SwapExecuted(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOut
    );

    function initializePool() external returns (address pool) {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        require(ds.poolAddress == address(0), "Pool already initialized");

        // Create and initialize pool
        pool = INonfungiblePositionManager(ds.nonfungiblePositionManager).createAndInitializePoolIfNecessary(
            address(this),    // token0
            ds.weth,         // token1
            LP_FEE,
            POOL_SQRT_PRICE_X96
        );

        ds.poolAddress = pool;

        // Cache token addresses for price calculations
        ds.cachedToken0 = address(this);
        ds.cachedToken1 = ds.weth;
        ds.tokensInitialized = true;

        return pool;
    }

    function graduateMarket() external {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        require(ds.marketType == 0, "Already graduated");
        require(ds.poolAddress != address(0), "Pool not initialized");

        // Update market type
        ds.marketType = 1; // UNISWAP_POOL

        // Get ETH balance and convert to WETH
        uint256 ethLiquidity = address(this).balance;
        IWETH(ds.weth).deposit{value: ethLiquidity}();

        // Mint secondary market supply using LibToken
        uint256 secondarySupply = LibDiamond.SECONDARY_MARKET_SUPPLY;
        LibToken._mint(address(this), secondarySupply);

        // Approve the position manager
        IERC20(ds.weth).safeIncreaseAllowance(ds.nonfungiblePositionManager, ethLiquidity);
        IERC20(address(this)).safeIncreaseAllowance(ds.nonfungiblePositionManager, secondarySupply);

        // Set up liquidity position
        INonfungiblePositionManager.MintParams memory params = INonfungiblePositionManager.MintParams({
            token0: address(this),
            token1: ds.weth,
            fee: LP_FEE,
            tickLower: LP_TICK_LOWER,
            tickUpper: LP_TICK_UPPER,
            amount0Desired: secondarySupply,
            amount1Desired: ethLiquidity,
            amount0Min: 0,
            amount1Min: 0,
            recipient: address(this),
            deadline: block.timestamp
        });

        // Mint position
        (uint256 positionId,,,) = INonfungiblePositionManager(ds.nonfungiblePositionManager).mint(params);
        ds.positionId = positionId;

        emit MarketGraduated(
            address(this),
            ds.poolAddress,
            ethLiquidity,
            secondarySupply,
            positionId
        );
    }

    function swapExactInputSingle(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOutMinimum,
        uint160 sqrtPriceLimitX96
    ) external returns (uint256 amountOut) {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        require(ds.marketType == 1, "Not graduated");

        // Approve router
        IERC20(tokenIn).safeIncreaseAllowance(ds.swapRouter, amountIn);

        // Create swap params
        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
            tokenIn: tokenIn,
            tokenOut: tokenOut,
            fee: LP_FEE,
            recipient: msg.sender,
            amountIn: amountIn,
            amountOutMinimum: amountOutMinimum,
            sqrtPriceLimitX96: sqrtPriceLimitX96
        });

        // Execute swap
        amountOut = ISwapRouter(ds.swapRouter).exactInputSingle(params);

        emit SwapExecuted(tokenIn, tokenOut, amountIn, amountOut);
        return amountOut;
    }

    function getCurrentPrice() external view returns (uint256) {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        require(ds.marketType == 1 && ds.tokensInitialized, "Not ready");

        IUniswapV3Pool pool = IUniswapV3Pool(ds.poolAddress);
        (uint160 sqrtPriceX96, , , , , ,) = pool.slot0();

        uint256 price = uint256(sqrtPriceX96) * uint256(sqrtPriceX96) * (10**18) >> (96 * 2);

        // If token1 is WETH, flip the price
        if(ds.cachedToken1 == ds.weth) {
            price = (10**36) / price;
        }

        return price;
    }

    // Uniswap callback for flash swaps
    function uniswapV3SwapCallback(
        int256 /* amount0Delta */,
        int256 /* amount1Delta */,
        bytes calldata /* data */
    ) external view {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        require(msg.sender == ds.poolAddress, "Not authorized");
    }

    // For receiving NFT position
    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external view returns (bytes4) {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        require(msg.sender == ds.poolAddress, "Not pool");
        return this.onERC721Received.selector;
    }
}