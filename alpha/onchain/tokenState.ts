import { createPublicClient, http, formatEther } from 'viem';
import { base } from 'wagmi/chains';
import { getCurrentChain } from '../components/Web3Provider';
import { higherrrrrrrAbi } from './generated';

// Create public client
const publicClient = createPublicClient({
  chain: base,
  transport: http('https://base-mainnet.g.alchemy.com/v2/l0XzuD715Z-zd21ie5dbpLKrptTuq07a')
});

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

// Helper function to get a single token's state
async function getSingleTokenState(address: string): Promise<TokenState> {
  console.log('Getting state for token:', address);
  
  try {
    // Create multicall for single token
    const calls = [
      {
        address: address as `0x${string}`,
        abi: higherrrrrrrAbi,
        functionName: 'name'
      },
      {
        address: address as `0x${string}`,
        abi: higherrrrrrrAbi,
        functionName: 'symbol'
      },
      {
        address: address as `0x${string}`,
        abi: higherrrrrrrAbi,
        functionName: 'totalSupply'
      },
      {
        address: address as `0x${string}`,
        abi: higherrrrrrrAbi,
        functionName: 'getCurrentPrice'
      },
      {
        address: address as `0x${string}`,
        abi: higherrrrrrrAbi,
        functionName: 'MAX_TOTAL_SUPPLY'
      },
      {
        address: address as `0x${string}`,
        abi: higherrrrrrrAbi,
        functionName: 'marketType'
      },
      {
        address: address as `0x${string}`,
        abi: higherrrrrrrAbi,
        functionName: 'bondingCurve'
      },
      {
        address: address as `0x${string}`,
        abi: higherrrrrrrAbi,
        functionName: 'convictionNFT'
      },
      {
        address: address as `0x${string}`,
        abi: higherrrrrrrAbi,
        functionName: 'CONVICTION_THRESHOLD'
      },
      {
        address: address as `0x${string}`,
        abi: higherrrrrrrAbi,
        functionName: 'MIN_ORDER_SIZE'
      },
      {
        address: address as `0x${string}`,
        abi: higherrrrrrrAbi,
        functionName: 'TOTAL_FEE_BPS'
      },
      {
        address: address as `0x${string}`,
        abi: higherrrrrrrAbi,
        functionName: 'poolAddress'
      }
    ];

    const results = await publicClient.multicall({ contracts: calls });
    
    // Get price levels
    const priceLevels: PriceLevel[] = [];
    let levelIndex = 0;
    while (levelIndex < 20) {
      try {
        const level = await publicClient.readContract({
          address: address as `0x${string}`,
          abi: higherrrrrrrAbi,
          functionName: 'priceLevels',
          args: [BigInt(levelIndex)]
        });
        if (!level || !level[1]) break;
        priceLevels.push({
          price: formatEther(level[0]),
          name: level[1]
        });
        levelIndex++;
      } catch {
        break;
      }
    }

    return {
      name: results[0]?.result?.toString() || '',
      symbol: results[1]?.result?.toString() || '',
      totalSupply: formatEther(BigInt(results[2]?.result?.toString() || '0')),
      currentPrice: formatEther(BigInt(results[3]?.result?.toString() || '0')),
      maxSupply: formatEther(BigInt(results[4]?.result?.toString() || '0')),
      marketType: Number(results[5]?.result || 0),
      bondingCurve: results[6]?.result?.toString() || '',
      convictionNFT: results[7]?.result?.toString() || '',
      CONVICTION_THRESHOLD: formatEther(BigInt(results[8]?.result?.toString() || '0')),
      MIN_ORDER_SIZE: formatEther(BigInt(results[9]?.result?.toString() || '0')),
      TOTAL_FEE_BPS: Number(results[10]?.result || 0),
      poolAddress: results[11]?.result?.toString() || '',
      priceLevels,
      currentName: results[0]?.result?.toString() || '',
      MAX_TOTAL_SUPPLY: formatEther(BigInt(results[4]?.result?.toString() || '0'))
    };
  } catch (error) {
    console.error(`Error getting state for token ${address}:`, error);
    throw error;
  }
}

export async function getTokenStates(tokenAddresses: string[]): Promise<{ [key: string]: TokenState }> {
  console.log('Getting states for tokens:', tokenAddresses);
  const states: { [key: string]: TokenState } = {};

  // Process one token at a time
  for (const address of tokenAddresses) {
    try {
      states[address] = await getSingleTokenState(address);
      console.log(`Completed state for token ${address}`);
    } catch (error) {
      console.error(`Failed to get state for token ${address}:`, error);
    }
  }

  return states;
}

// Keep single token getter
export async function getTokenState(tokenAddress: string): Promise<TokenState> {
  return await getSingleTokenState(tokenAddress);
} 