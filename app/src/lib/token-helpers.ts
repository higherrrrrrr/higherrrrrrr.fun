import { ethers } from 'ethers';
import { Higherrrrrrr, MarketType } from './contracts/higherrrrrrr';
import { TokenApiType } from '@/api';

export interface OnChainTokenData {
  price: bigint;
  totalSupply: bigint;
  priceLevels: {
    price: bigint;
    name: string;
  }[];
}

export interface TransactionStatus {
  loading: boolean;
  error: string | null;
  hash: string | null;
}

export interface TokenTransactionResult {
  success: boolean;
  error?: string;
  hash?: string;
  newData?: OnChainTokenData;
}

// Helper to format prices and market caps
export function formatPrice(price: number): string {
  return price.toFixed(4);
}

export function formatMarketCap(marketCap: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(marketCap);
}

// Helper to convert on-chain data to display format
export function convertOnChainData(data: OnChainTokenData) {
  return {
    price: Number(data.price) / 1e18,
    marketCap: Number(data.price * data.totalSupply) / 1e18,
    priceLevels: data.priceLevels.map(level => ({
      name: level.name,
      greater_than: (Number(level.price) / 1e18).toString()
    }))
  };
}

// Helper to find current level
export function findCurrentLevel(priceLevels: { name: string; greater_than: string }[], price: number) {
  if (!priceLevels?.length) return null;
  
  return priceLevels.reduce((current, level) => {
    return Number(level.greater_than) <= price ? level : current;
  }, priceLevels[0]);
}

// Helper to fetch on-chain data
export async function fetchOnChainData(
  address: string,
  provider: ethers.Provider
): Promise<OnChainTokenData> {
  const contract = new Higherrrrrrr(address, provider);
  
  const [price, totalSupply, priceLevels] = await Promise.all([
    contract.getCurrentPrice().catch(() => BigInt(0)),
    contract.totalSupply().catch(() => BigInt(0)),
    contract.getPriceLevels().catch(() => [])
  ]);

  return { price, totalSupply, priceLevels };
}

// Helper for buy transaction
export async function buyToken(
  contract: Higherrrrrrr,
  userAddress: string,
  ethAmount: bigint
): Promise<TokenTransactionResult> {
  try {
    // Get quote for ETH amount
    const minTokens = await contract.getEthBuyQuote(ethAmount);

    // Execute buy transaction
    const tx = await contract.buy(
      userAddress,
      userAddress,
      "",
      MarketType.BONDING_CURVE,
      minTokens,
      BigInt(0),
      ethAmount
    );

    const receipt = await tx.wait();
    
    // Fetch updated data
    const [price, totalSupply, priceLevels] = await Promise.all([
      contract.getCurrentPrice(),
      contract.totalSupply(),
      contract.getPriceLevels()
    ]);

    return {
      success: true,
      hash: receipt.hash,
      newData: { price, totalSupply, priceLevels }
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Transaction failed"
    };
  }
}

// Helper for sell transaction
export async function sellToken(
  contract: Higherrrrrrr,
  userAddress: string,
  sellPercentage: number = 10
): Promise<TokenTransactionResult> {
  try {
    // Get user's balance
    const balance = await contract.balanceOf(userAddress);
    if (balance === BigInt(0)) {
      throw new Error("No tokens to sell");
    }

    // Calculate sell amount (default 10%)
    const sellAmount = (balance * BigInt(sellPercentage)) / BigInt(100);
    const minEth = await contract.getTokenSellQuote(sellAmount);

    // Execute sell transaction
    const tx = await contract.sell(
      sellAmount,
      userAddress,
      "",
      MarketType.BONDING_CURVE,
      minEth,
      BigInt(0)
    );

    const receipt = await tx.wait();
    
    // Fetch updated data
    const [price, totalSupply, priceLevels] = await Promise.all([
      contract.getCurrentPrice(),
      contract.totalSupply(),
      contract.getPriceLevels()
    ]);

    return {
      success: true,
      hash: receipt.hash,
      newData: { price, totalSupply, priceLevels }
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Transaction failed"
    };
  }
}

// Helper to validate token data
export function validateTokenData(token: TokenApiType): boolean {
  return !!(
    token &&
    token.address &&
    token.name &&
    token.symbol &&
    token.price_levels &&
    Array.isArray(token.price_levels)
  );
}

// Helper to generate BaseScan URL
export function getBaseScanUrl(hash: string): string {
  return `https://basescan.org/tx/${hash}`;
} 