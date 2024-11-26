import { createPublicClient, http, formatEther } from 'viem';
import { base } from 'wagmi/chains';
import { getCurrentChain } from '../components/Web3Provider';
import { higherrrrrrrAbi } from './generated';

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
  owner: string;
  paused: boolean;
  priceIncreaseFactor: string;
  priceDecreaseFactor: string;
  lastActionTimestamp: number;
  cooldownPeriod: number;
  currentLevel: number;
  currentLevelName: string;
  nextLevelPrice: string;
  priceLevels: PriceLevel[];
  convictionThreshold: string;
  minOrderSize: string;
  totalFeeBps: number;
  bondingCurve: string;
  currentName: string;
}

export async function getTokenState(tokenAddress: string): Promise<TokenState> {
  const publicClient = getPublicClient();
  console.log('Getting token state for:', tokenAddress);

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

      if (!level || !level[1]) break; // Break if we get a null name

      priceLevels.push({
        price: formatEther(level[0]),
        name: level[1]
      });

      index++;
    } catch (error) {
      console.log('Finished reading price levels at index:', index);
      break;
    }
  }

  console.log('Found price levels:', priceLevels);

  // Get the rest of the token state
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
        functionName: 'owner'
      },
      {
        address: tokenAddress as `0x${string}`,
        abi: higherrrrrrrAbi,
        functionName: 'paused'
      },
      {
        address: tokenAddress as `0x${string}`,
        abi: higherrrrrrrAbi,
        functionName: 'PRICE_INCREASE_FACTOR'
      },
      {
        address: tokenAddress as `0x${string}`,
        abi: higherrrrrrrAbi,
        functionName: 'PRICE_DECREASE_FACTOR'
      },
      {
        address: tokenAddress as `0x${string}`,
        abi: higherrrrrrrAbi,
        functionName: 'lastActionTimestamp'
      },
      {
        address: tokenAddress as `0x${string}`,
        abi: higherrrrrrrAbi,
        functionName: 'COOLDOWN_PERIOD'
      },
      {
        address: tokenAddress as `0x${string}`,
        abi: higherrrrrrrAbi,
        functionName: 'getCurrentLevel'
      },
      {
        address: tokenAddress as `0x${string}`,
        abi: higherrrrrrrAbi,
        functionName: 'getCurrentLevelName'
      },
      {
        address: tokenAddress as `0x${string}`,
        abi: higherrrrrrrAbi,
        functionName: 'getNextLevelPrice'
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
        functionName: 'bondingCurve'
      },
      {
        address: tokenAddress as `0x${string}`,
        abi: higherrrrrrrAbi,
        functionName: 'name'
      }
    ]
  });

  const currentName = results[18].result?.toString() || '';
  console.log('Current token name:', currentName);

  return {
    name: results[0].result?.toString() || '',
    symbol: results[1].result?.toString() || '',
    totalSupply: formatEther(results[2].result || BigInt(0)),
    currentPrice: formatEther(results[3].result || BigInt(0)),
    maxSupply: formatEther(results[4].result || BigInt(0)),
    owner: results[5].result?.toString() || '',
    paused: Boolean(results[6].result),
    priceIncreaseFactor: formatEther(results[7].result || BigInt(0)),
    priceDecreaseFactor: formatEther(results[8].result || BigInt(0)),
    lastActionTimestamp: Number(results[9].result || 0),
    cooldownPeriod: Number(results[10].result || 0),
    currentLevel: Number(results[11].result || 0),
    currentLevelName: results[12].result?.toString() || '',
    nextLevelPrice: formatEther(results[13].result || BigInt(0)),
    priceLevels,
    convictionThreshold: formatEther(results[14].result || BigInt(0)),
    minOrderSize: formatEther(results[15].result || BigInt(0)),
    totalFeeBps: Number(results[16].result || 0),
    bondingCurve: results[17].result?.toString() || '',
    currentName,
  };
}

// Helper to check if token is in cooldown
export function isInCooldown(state: TokenState): boolean {
  const now = Math.floor(Date.now() / 1000);
  return now - state.lastActionTimestamp < state.cooldownPeriod;
}

// Helper to get time remaining in cooldown
export function getCooldownRemaining(state: TokenState): number {
  const now = Math.floor(Date.now() / 1000);
  const timeSinceLastAction = now - state.lastActionTimestamp;
  return Math.max(0, state.cooldownPeriod - timeSinceLastAction);
}

// Helper to get progress to next level
export function getProgressToNextLevel(state: TokenState): number {
  const currentPrice = parseFloat(state.currentPrice);
  const nextLevelPrice = parseFloat(state.nextLevelPrice);
  
  // Add guards for invalid numbers
  if (!currentPrice || !nextLevelPrice || nextLevelPrice === 0) {
    return 0;
  }
  
  // Calculate progress percentage
  const progress = (currentPrice / nextLevelPrice) * 100;
  
  // Ensure we return a valid number between 0 and 100
  if (isNaN(progress)) {
    return 0;
  }
  
  return Math.min(100, Math.max(0, progress));
}

// Helper to format BPS
export function formatBPS(bps: number): string {
  return `${(bps / 100).toFixed(2)}%`;
} 