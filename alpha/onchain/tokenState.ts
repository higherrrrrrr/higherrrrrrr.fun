import { createPublicClient, http, formatEther } from 'viem';
import { base } from 'wagmi/chains';
import { getCurrentChain } from '../components/Web3Provider';
import { higherrrrrrrAbi } from './generated';
import { Pool, TickMath, TICK_SPACINGS } from '@uniswap/v3-sdk';
import { Token, CurrencyAmount } from '@uniswap/sdk-core';

// Add Uniswap V3 Pool ABI
const UniswapV3PoolABI = [
  {
    "inputs": [],
    "name": "slot0",
    "outputs": [
      { "internalType": "uint160", "name": "sqrtPriceX96", "type": "uint160" },
      { "internalType": "int24", "name": "tick", "type": "int24" },
      { "internalType": "uint16", "name": "observationIndex", "type": "uint16" },
      { "internalType": "uint16", "name": "observationCardinality", "type": "uint16" },
      { "internalType": "uint16", "name": "observationCardinalityNext", "type": "uint16" },
      { "internalType": "uint8", "name": "feeProtocol", "type": "uint8" },
      { "internalType": "bool", "name": "unlocked", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "liquidity",
    "outputs": [{ "internalType": "uint128", "name": "", "type": "uint128" }],
    "stateMutability": "view",
    "type": "function"
  }
];

// Add WETH address
const WETH_ADDRESS = '0x4200000000000000000000000000000000000006';

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

// Add tick data provider interface
interface TickDataProvider {
  getTick(tick: number): Promise<{
    liquidityNet: string;
    liquidityGross: string;
  }>;
  nextInitializedTickWithinOneWord(
    tick: number,
    lte: boolean,
    tickSpacing: number
  ): Promise<[number, boolean]>;
}

// Complete tick data provider implementation
class StaticTickDataProvider implements TickDataProvider {
  async getTick(tick: number) {
    return {
      liquidityNet: '0',
      liquidityGross: '0'
    };
  }

  async nextInitializedTickWithinOneWord(
    tick: number,
    lte: boolean,
    tickSpacing: number
  ): Promise<[number, boolean]> {
    // Calculate the next tick based on direction
    const nextTick = lte 
      ? Math.floor(tick / tickSpacing) * tickSpacing 
      : Math.ceil(tick / tickSpacing) * tickSpacing;

    // Return the next tick and whether it's initialized (always false in this case)
    return [nextTick, false];
  }
}

// Simple price calculation without SDK
export async function getUniswapQuote(
  tokenAddress: string,
  poolAddress: string,
  tokenAmount: bigint,
  isBuy: boolean
): Promise<bigint> {
  console.log('Getting Uniswap quote:', {
    tokenAddress,
    poolAddress,
    tokenAmount: tokenAmount.toString(),
    isBuy
  });

  const publicClient = getPublicClient();

  try {
    // Get pool state with proper typing
    const slot0Result = await publicClient.readContract({
      address: poolAddress as `0x${string}`,
      abi: UniswapV3PoolABI,
      functionName: 'slot0'
    });

    if (!slot0Result || !Array.isArray(slot0Result)) {
      throw new Error('Invalid slot0 response');
    }

    const sqrtPriceX96 = slot0Result[0];
    
    if (!sqrtPriceX96) {
      throw new Error('Invalid sqrtPriceX96');
    }

    console.log('Pool state:', {
      sqrtPriceX96: sqrtPriceX96.toString()
    });
    
    // Calculate price using multiplication instead of exponents
    const Q96 = BigInt('79228162514264337593543950336'); // 2^96
    const priceX96Squared = (sqrtPriceX96 * sqrtPriceX96);
    
    if (isBuy) {
      // For buying tokens: multiply token amount by price
      return (tokenAmount * priceX96Squared) / (Q96 * Q96);
    } else {
      // For selling tokens: divide token amount by price
      return (tokenAmount * (Q96 * Q96)) / priceX96Squared;
    }

  } catch (error) {
    console.error('Pool quote error:', error);
    throw error;
  }
} 