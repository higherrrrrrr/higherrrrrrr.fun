import { createPublicClient, http, formatEther } from 'viem';
import { base } from 'wagmi/chains';
import { getCurrentChain } from '../components/Web3Provider';
import { higherrrrrrrAbi } from './generated';
import { Pool } from '@uniswap/v3-sdk';
import { Token } from '@uniswap/sdk-core';

const getPublicClient = () => {
  const chain = getCurrentChain();
  return createPublicClient({
    chain: chain as any,
    transport: http(chain.rpcUrls.default.http[0])
  });
};

export interface PriceLevel {
  price: string;
  name: string;
}

export interface TokenState {
  name: string;
  symbol: string;
  totalSupply: string;
  currentPrice: string;
  maxSupply: string;
  priceLevels: PriceLevel[];
  currentName: string;
  marketType: number;
  bondingCurve: string;
  convictionNFT: string;
  CONVICTION_THRESHOLD: string;
  MIN_ORDER_SIZE: string;
  TOTAL_FEE_BPS: number;
  MAX_TOTAL_SUPPLY: string;
  poolAddress: string;
}

// Add pool constants from contract
const LP_FEE = 500; // 0.05%

export async function getTokenState(tokenAddress: string): Promise<TokenState> {
  const publicClient = getPublicClient();

  // Get price levels by iterating until we find a null value
  const priceLevels: PriceLevel[] = [];
  let index = 0;
  
  while (true) {
    try {
      const level = await publicClient.readContract({
        address: tokenAddress as `0x${string}`,
        abi: higherrrrrrrAbi,
        functionName: 'priceLevels',
        args: [BigInt(index)]
      });

      if (!level || !level[1]) break;

      priceLevels.push({
        price: formatEther(level[0]),
        name: level[1]
      });

      index++;
    } catch (error) {
      break;
    }
  }

  const results = await publicClient.multicall({
    contracts: [
      {
        address: tokenAddress as `0x${string}`,
        abi: higherrrrrrrAbi,
        functionName: 'name'
      },
      {
        address: tokenAddress as `0x${string}`,
        abi: higherrrrrrrAbi,
        functionName: 'symbol'
      },
      {
        address: tokenAddress as `0x${string}`,
        abi: higherrrrrrrAbi,
        functionName: 'totalSupply'
      },
      {
        address: tokenAddress as `0x${string}`,
        abi: higherrrrrrrAbi,
        functionName: 'getCurrentPrice'
      },
      {
        address: tokenAddress as `0x${string}`,
        abi: higherrrrrrrAbi,
        functionName: 'MAX_TOTAL_SUPPLY'
      },
      {
        address: tokenAddress as `0x${string}`,
        abi: higherrrrrrrAbi,
        functionName: 'marketType'
      },
      {
        address: tokenAddress as `0x${string}`,
        abi: higherrrrrrrAbi,
        functionName: 'bondingCurve'
      },
      {
        address: tokenAddress as `0x${string}`,
        abi: higherrrrrrrAbi,
        functionName: 'convictionNFT'
      },
      {
        address: tokenAddress as `0x${string}`,
        abi: higherrrrrrrAbi,
        functionName: 'CONVICTION_THRESHOLD'
      },
      {
        address: tokenAddress as `0x${string}`,
        abi: higherrrrrrrAbi,
        functionName: 'MIN_ORDER_SIZE'
      },
      {
        address: tokenAddress as `0x${string}`,
        abi: higherrrrrrrAbi,
        functionName: 'TOTAL_FEE_BPS'
      },
      {
        address: tokenAddress as `0x${string}`,
        abi: higherrrrrrrAbi,
        functionName: 'poolAddress'
      }
    ]
  });

  return {
    name: results[0].result?.toString() || '',
    symbol: results[1].result?.toString() || '',
    totalSupply: formatEther(results[2].result || BigInt(0)),
    currentPrice: formatEther(results[3].result || BigInt(0)),
    maxSupply: formatEther(results[4].result || BigInt(0)),
    marketType: Number(results[5].result || 0),
    bondingCurve: results[6].result?.toString() || '',
    convictionNFT: results[7].result?.toString() || '',
    CONVICTION_THRESHOLD: formatEther(results[8].result || BigInt(0)),
    MIN_ORDER_SIZE: formatEther(results[9].result || BigInt(0)),
    TOTAL_FEE_BPS: Number(results[10].result || 0),
    priceLevels,
    currentName: results[0].result?.toString() || '',
    MAX_TOTAL_SUPPLY: formatEther(results[4].result || BigInt(0)),
    poolAddress: results[11].result?.toString() || '',
  };
}

// Helper to get progress to next level
export function getProgressToNextLevel(state: TokenState): number {
  // For bonding curve progress
  if (state.marketType === 0) { // BONDING_CURVE
    const totalSupply = parseFloat(state.totalSupply);
    const maxBondingSupply = 800_000_000; // 800M tokens
    return (totalSupply / maxBondingSupply) * 100;
  }
  return 0;
}

// Add function to get Uniswap quote
export async function getUniswapQuote(
  tokenAddress: string, 
  poolAddress: string,
  tokenAmount: bigint,
  isBuy: boolean
): Promise<bigint> {
  const publicClient = getPublicClient();

  // Get pool state
  const [slot0, liquidity] = await Promise.all([
    publicClient.readContract({
      address: poolAddress as `0x${string}`,
      abi: UniswapV3PoolABI,
      functionName: 'slot0'
    }),
    publicClient.readContract({
      address: poolAddress as `0x${string}`,
      abi: UniswapV3PoolABI,
      functionName: 'liquidity'
    })
  ]);

  // Create SDK instances
  const WETH = new Token(base.id, WETH_ADDRESS, 18, 'WETH');
  const TOKEN = new Token(base.id, tokenAddress, 18);

  const pool = new Pool(
    WETH,
    TOKEN,
    LP_FEE,
    slot0.sqrtPriceX96.toString(),
    liquidity.toString(),
    slot0.tick
  );

  // Get quote
  if (isBuy) {
    const quote = await pool.getOutputAmount(tokenAmount);
    return quote[0].quotient;
  } else {
    const quote = await pool.getInputAmount(tokenAmount);
    return quote[0].quotient;
  }
} 