import { createPublicClient, http, formatEther } from 'viem';
import { baseMainnet } from 'viem/chains';
import { CURRENT_RPC_URL } from './config';
import { HigherrrrrrrABI } from './generated';

const publicClient = createPublicClient({
  chain: baseMainnet,
  transport: http(CURRENT_RPC_URL)
});

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
  const [
    name,
    symbol,
    totalSupply,
    currentPrice,
    maxSupply,
    owner,
    paused,
    priceIncreaseFactor,
    priceDecreaseFactor,
    lastActionTimestamp,
    cooldownPeriod
  ] = await publicClient.multicall({
    contracts: [
      {
        address: tokenAddress,
        abi: HigherrrrrrrABI,
        functionName: 'name'
      },
      {
        address: tokenAddress,
        abi: HigherrrrrrrABI,
        functionName: 'symbol'
      },
      {
        address: tokenAddress,
        abi: HigherrrrrrrABI,
        functionName: 'totalSupply'
      },
      {
        address: tokenAddress,
        abi: HigherrrrrrrABI,
        functionName: 'getCurrentPrice'
      },
      {
        address: tokenAddress,
        abi: HigherrrrrrrABI,
        functionName: 'maxSupply'
      },
      {
        address: tokenAddress,
        abi: HigherrrrrrrABI,
        functionName: 'owner'
      },
      {
        address: tokenAddress,
        abi: HigherrrrrrrABI,
        functionName: 'paused'
      },
      {
        address: tokenAddress,
        abi: HigherrrrrrrABI,
        functionName: 'priceIncreaseFactor'
      },
      {
        address: tokenAddress,
        abi: HigherrrrrrrABI,
        functionName: 'priceDecreaseFactor'
      },
      {
        address: tokenAddress,
        abi: HigherrrrrrrABI,
        functionName: 'lastActionTimestamp'
      },
      {
        address: tokenAddress,
        abi: HigherrrrrrrABI,
        functionName: 'cooldownPeriod'
      }
    ]
  });

  return {
    name: name.result as string,
    symbol: symbol.result as string,
    totalSupply: formatEther(totalSupply.result as bigint),
    currentPrice: formatEther(currentPrice.result as bigint),
    maxSupply: formatEther(maxSupply.result as bigint),
    owner: owner.result as string,
    paused: paused.result as boolean,
    priceIncreaseFactor: (priceIncreaseFactor.result as bigint).toString(),
    priceDecreaseFactor: (priceDecreaseFactor.result as bigint).toString(),
    lastActionTimestamp: Number(lastActionTimestamp.result),
    cooldownPeriod: Number(cooldownPeriod.result)
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