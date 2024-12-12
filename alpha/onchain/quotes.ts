import { ethers } from 'ethers';
import { UNISWAP_QUOTER_ADDRESS, CURRENT_RPC_URL } from './config';
import { getTokenState } from './tokenState';
import { higherrrrrrrAbi } from './generated';

// Create provider once
const provider = new ethers.JsonRpcProvider(CURRENT_RPC_URL);

// Uniswap V3 Quoter ABI (only the functions we need)
const QUOTER_ABI = [
  'function quoteExactInputSingle(address tokenIn, address tokenOut, uint24 fee, uint256 amountIn, uint160 sqrtPriceLimitX96) external returns (uint256 amountOut)',
  'function quoteExactOutputSingle(address tokenIn, address tokenOut, uint24 fee, uint256 amountOut, uint160 sqrtPriceLimitX96) external returns (uint256 amountIn)'
];

export async function getQuote(
  tokenAddress: string,
  amount: bigint,
  isSelling: boolean
): Promise<bigint> {
  console.log('getQuote called with:', {
    tokenAddress,
    amount: amount.toString(),
    isSelling
  });

  // First check if token is on bonding curve
  const tokenState = await getTokenState(tokenAddress);
  console.log('Token state:', {
    marketType: tokenState.marketType,
    currentPrice: tokenState.currentPrice
  });
  
  if (tokenState.marketType === 0) { // Bonding curve market
    // Use token's built-in quote functions
    const token = new ethers.Contract(
      tokenAddress,
      higherrrrrrrAbi,
      provider
    );

    try {
      if (isSelling) {
        console.log('Getting bonding curve sell quote');
        const quote = await token.getSellQuote(amount);
        console.log('Got sell quote:', quote.toString());
        return quote;
      } else {
        console.log('Getting bonding curve buy quote');
        const quote = await token.getBuyQuote(amount);
        console.log('Got buy quote:', quote.toString());
        return quote;
      }
    } catch (error) {
      console.error('Failed to get bonding curve quote:', error);
      return BigInt(0);
    }
  } else {
    // Use Uniswap quote for AMM market
    return getUniswapQuote(
      tokenAddress,
      amount,
      isSelling
    );
  }
}

async function getUniswapQuote(
  tokenAddress: string,
  amount: bigint,
  isSelling: boolean
): Promise<bigint> {
  const quoter = new ethers.Contract(
    UNISWAP_QUOTER_ADDRESS,
    QUOTER_ABI,
    provider
  );

  const WETH = '0x4200000000000000000000000000000000000006'; // Base WETH
  const FEE_TIER = 500; // 0.05% fee tier - matches contract LP_FEE
  
  try {
    if (isSelling) {
      // Selling token for ETH - token is input, WETH is output
      console.log('Getting sell quote:', {
        tokenIn: tokenAddress,
        tokenOut: WETH,
        amount: amount.toString()
      });
      return await quoter.quoteExactInputSingle(
        tokenAddress, // tokenIn
        WETH,        // tokenOut
        FEE_TIER,
        amount,      // amountIn
        0
      );
    } else {
      // Buying token with ETH - WETH is input, token is output
      console.log('Getting buy quote:', {
        tokenIn: WETH,
        tokenOut: tokenAddress,
        amount: amount.toString()
      });
      return await quoter.quoteExactInputSingle(
        WETH,        // tokenIn
        tokenAddress, // tokenOut
        FEE_TIER,
        amount,      // amountIn
        0
      );
    }
  } catch (error) {
    console.error('Failed to get Uniswap quote:', error);
    return BigInt(0);
  }
} 