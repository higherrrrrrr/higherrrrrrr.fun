import { ethers } from 'ethers';
import { getTokenState } from './tokenState';
import { higherrrrrrrAbi } from './generated';
import { createPublicClient, http } from 'viem';
import { base } from 'wagmi/chains';
import { formatUnits, parseUnits } from 'ethers';
import { getBuyQuote as getApiBuyQuote, getSellQuote as getApiSellQuote } from '../api/token';
import { CURRENT_RPC_URL } from './config';

// Use the same public client setup as tokenState.ts
const publicClient = createPublicClient({
  chain: base,
  transport: http(CURRENT_RPC_URL)
});

export async function getBuyQuote(
  tokenAddress: string,
  ethAmount: bigint // Amount in ETH
): Promise<bigint> {
  try {
    const tokenState = await getTokenState(tokenAddress);
    
    if (tokenState.marketType === 0) { // Bonding curve market
      try {
        // Use publicClient for contract reads
        const quote = await publicClient.readContract({
          address: tokenAddress as `0x${string}`,
          abi: higherrrrrrrAbi,
          functionName: 'getEthBuyQuote',
          args: [ethAmount]
        });
        return quote;
      } catch (error) {
        console.error('Failed to get bonding curve buy quote:', {
          error,
          tokenAddress,
          ethAmount: ethAmount.toString()
        });
        return BigInt(0);
      }
    } else {
      // Use API helper for Uniswap quote
      try {
        const quote = await getApiBuyQuote(tokenAddress, ethAmount.toString(), tokenState.poolAddress);
        return BigInt(quote.outputAmount);
      } catch (error) {
        console.error('Failed to get API buy quote:', error);
        return BigInt(0);
      }
    }
  } catch (error) {
    console.error('Failed in getBuyQuote:', error);
    throw error;
  }
}

export async function getSellQuote(
  tokenAddress: string,
  tokenAmount: bigint // Amount in tokens
): Promise<bigint> {
  try {
    const tokenState = await getTokenState(tokenAddress);
    
    if (tokenState.marketType === 0) { // Bonding curve market
      try {
        // Use publicClient for contract reads
        const quote = await publicClient.readContract({
          address: tokenAddress as `0x${string}`,
          abi: higherrrrrrrAbi,
          functionName: 'getTokenSellQuote',
          args: [tokenAmount]
        });
        return quote;
      } catch (error) {
        console.error('Failed to get bonding curve sell quote:', {
          error,
          tokenAddress,
          tokenAmount: tokenAmount.toString()
        });
        return BigInt(0);
      }
    } else {
      // Use API helper for Uniswap quote
      try {
        const quote = await getApiSellQuote(tokenAddress, tokenAmount.toString(), tokenState.poolAddress);
        return BigInt(quote.outputAmount);
      } catch (error) {
        console.error('Failed to get API sell quote:', error);
        return BigInt(0);
      }
    }
  } catch (error) {
    console.error('Failed in getSellQuote:', error);
    throw error;
  }
} 