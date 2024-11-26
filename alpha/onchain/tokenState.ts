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
}

export async function getTokenState(tokenAddress: string): Promise<TokenState> {
  const publicClient = getPublicClient();
  console.log('Getting token state for:', tokenAddress);

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
      }
    ]
  });

  console.log('Multicall results:', results);

  // Check if any of the results failed
  if (results.some(r => !r.status)) {
    throw new Error('Failed to fetch token state');
  }

  return {
    name: results[0].result?.toString() || '',
    symbol: results[1].result?.toString() || '',
    totalSupply: formatEther(results[2].result || 0n),
    currentPrice: formatEther(results[3].result || 0n),
    maxSupply: formatEther(results[4].result || 0n),
    owner: results[5].result?.toString() || '',
    paused: Boolean(results[6].result),
    priceIncreaseFactor: formatEther(results[7].result || 0n),
    priceDecreaseFactor: formatEther(results[8].result || 0n),
    lastActionTimestamp: Number(results[9].result || 0),
    cooldownPeriod: Number(results[10].result || 0)
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