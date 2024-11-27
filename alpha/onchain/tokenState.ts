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

    console.log('Pool state:', {
      sqrtPriceX96: slot0[0].toString(),
      tick: slot0[1],
      liquidity: liquidity.toString()
    });

    // Create SDK instances
    const wethToken = new Token(base.id, WETH_ADDRESS, 18, 'WETH');
    const token = new Token(base.id, tokenAddress, 18, 'TOKEN');

    // Create tick data provider
    const tickDataProvider = new StaticTickDataProvider();

    // Create pool instance with tick data provider
    const pool = new Pool(
      wethToken,
      token,
      500, // 0.05% fee tier
      slot0[0].toString(),
      liquidity.toString(),
      slot0[1],
      tickDataProvider
    );

    // Convert tokenAmount to CurrencyAmount
    const inputToken = isBuy ? wethToken : token;
    const amount = CurrencyAmount.fromRawAmount(
      inputToken,
      tokenAmount.toString()
    );

    console.log('Calculating quote with:', {
      inputToken: inputToken.address,
      amount: amount.toExact(),
      poolPrice: pool.token0Price.toSignificant(6)
    });

    // Get quote
    if (isBuy) {
      const [outputAmount] = await pool.getOutputAmount(amount);
      return BigInt(outputAmount.quotient.toString());
    } else {
      const [outputAmount] = await pool.getInputAmount(amount);
      return BigInt(outputAmount.quotient.toString());
    }
  } catch (error) {
    console.error('Pool quote error:', error);
    throw error;
  }
} 