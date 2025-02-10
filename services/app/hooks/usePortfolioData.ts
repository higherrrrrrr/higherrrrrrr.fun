import { useState, useEffect } from 'react';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { helius } from '@/lib/helius';
import type { Portfolio, TokenBalance, NFT } from '@/lib/types';
import { toast } from 'react-hot-toast';
import { getPnLData } from '@/lib/analytics';
import { getWalletTransactions } from '@/lib/helius';

const MIN_USD_VALUE = 0.01; // Minimum USD value to show in portfolio
const SOL_MINT = 'So11111111111111111111111111111111111111112';

async function fetchTokenBalances(address: string) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    // Call our own API endpoint instead of Helius directly
    const response = await fetch(
      `/api/wallet/${address}/balances`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${errorText}`);
    }

    const balanceResponse = await response.json();
    clearTimeout(timeoutId);

    // Check for valid response structure
    if (!balanceResponse?.tokens && !balanceResponse?.nativeBalance) {
      console.error('Invalid balance response:', balanceResponse);
      throw new Error('Invalid response from API');
    }

    console.log('Balance response:', balanceResponse);

    // Get token mints including SOL
    const tokenMints = [
      SOL_MINT,
      ...balanceResponse.tokens
        .filter(token => token.mint && token.amount > 0)
        .map(token => token.mint)
    ];

    // Fetch prices from our own API endpoint
    let priceData = { data: {} };
    if (tokenMints.length > 0) {
      try {
        const priceResponse = await fetch(
          `/api/prices?tokens=${tokenMints.join(',')}`,
          {
            method: 'GET',
            headers: {
              'Accept': 'application/json'
            },
            signal: AbortSignal.timeout(5000) // 5 second timeout for prices
          }
        );

        if (priceResponse.ok) {
          priceData = await priceResponse.json();
        }
      } catch (priceError) {
        console.warn('Failed to fetch prices, using defaults:', priceError);
      }
    }

    const tokens: TokenBalance[] = [];

    // Add SOL balance
    if (balanceResponse.nativeBalance) {
      const solBalance = balanceResponse.nativeBalance / 1e9;
      const solPrice = priceData.data[SOL_MINT]?.price || 0;
      const solValue = solBalance * solPrice;

      if (solValue >= MIN_USD_VALUE) {
        tokens.push({
          address: SOL_MINT,
          symbol: 'SOL',
          name: 'Solana',
          amount: solBalance,
          price: solPrice,
          value: solValue,
          priceChange24h: priceData.data[SOL_MINT]?.priceChange24h || 0,
          lastUpdated: new Date()
        });
      }
    }

    // Add other tokens
    balanceResponse.tokens
      .filter(token => token.mint && token.amount > 0)
      .forEach(token => {
        const balance = token.amount / Math.pow(10, token.decimals);
        const price = priceData.data[token.mint]?.price || 0;
        const value = balance * price;

        if (value >= MIN_USD_VALUE) {
          tokens.push({
            address: token.mint,
            symbol: token.symbol || 'Unknown',
            name: token.name || 'Unknown Token',
            amount: balance,
            price: price,
            value: value,
            priceChange24h: priceData.data[token.mint]?.priceChange24h || 0,
            lastUpdated: new Date()
          });
        }
      });

    return tokens.sort((a, b) => b.value - a.value);
  } catch (error) {
    console.error('Error fetching token data:', error);
    throw error;
  }
}

export function usePortfolioData() {
  const { primaryWallet } = useDynamicContext();
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    console.log('Primary wallet:', primaryWallet);

    let mounted = true;
    let retryTimeout: NodeJS.Timeout;

    async function fetchPortfolio() {
      if (!primaryWallet?.address) {
        setIsLoading(false);
        return;
      }

      try {
        // Fetch all data in parallel
        const [tokens, transactions] = await Promise.all([
          fetchTokenBalances(primaryWallet.address),
          getWalletTransactions(primaryWallet.address)
        ]);

        // Filter and sort tokens by value
        const validTokens = tokens
          .filter(token => token.value >= MIN_USD_VALUE)
          .sort((a, b) => b.value - a.value);

        // Calculate portfolio metrics
        const totalValue = validTokens.reduce((sum, token) => sum + token.value, 0);
        const change24h = validTokens.reduce((sum, token) => {
          const previousValue = token.value / (1 + (token.priceChange24h / 100));
          return sum + (token.value - previousValue);
        }, 0);

        // Calculate PnL data
        const pnl = await getPnLData(primaryWallet.address, validTokens);

        // Transform transactions
        const transformedTransactions = (transactions || [])
          .filter(tx => {
            const token = validTokens.find(t => t.address === tx.tokenAddress);
            return token && token.value >= MIN_USD_VALUE;
          })
          .map(tx => ({
            signature: tx.signature,
            timestamp: new Date(tx.timestamp * 1000),
            type: tx.type,
            token: {
              address: tx.tokenAddress,
              symbol: validTokens.find(t => t.address === tx.tokenAddress)?.symbol || 'Unknown',
              amount: tx.amount,
              price: tx.price,
              value: tx.amount * (tx.price || 0)
            },
            status: tx.confirmed ? 'confirmed' : 'pending'
          }))
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

        if (mounted) {
          setPortfolio({
            tokens: validTokens,
            nfts: [], // NFTs handled separately if needed
            totalValue,
            change24h,
            pnl,
            transactions: transformedTransactions
          });
          setError(null);
        }
      } catch (err) {
        console.error('Failed to fetch portfolio:', err);
        if (mounted) {
          setError(err as Error);
          toast.error('Failed to fetch portfolio data');
          retryTimeout = setTimeout(fetchPortfolio, 5000);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    fetchPortfolio();
    const interval = setInterval(fetchPortfolio, 30000);

    return () => {
      mounted = false;
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
      clearInterval(interval);
    };
  }, [primaryWallet?.address]);

  return { portfolio, isLoading, error };
} 