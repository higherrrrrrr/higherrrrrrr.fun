'use client';

import { LAMPORTS_PER_SOL } from '@solana/web3.js';

export async function getSplBalances(walletAddress) {
  if (!walletAddress) {
    console.warn('No wallet address provided to getSplBalances');
    return [];
  }

  try {
    console.log('Fetching balances for wallet:', walletAddress);
    const response = await fetch(`/api/helius/assets?owner=${walletAddress}`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }

    console.log('Helius response data:', {
      nativeBalance: data.nativeBalance,
      nativeBalanceUsd: data.nativeBalanceUsd,
      itemCount: data.items?.length,
      firstItem: data.items?.[0]
    });

    const tokens = [];

    // Always add SOL balance, even if 0
    console.log('Native SOL balance:', (data.nativeBalance || 0) / LAMPORTS_PER_SOL);
    tokens.push({
      mint: 'SOL',
      symbol: 'SOL',
      name: 'Solana',
      logoUrl: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
      amount: data.nativeBalanceUsd?.toFixed(2) ?? '0.00',
      displayAmount: ((data.nativeBalance || 0) / LAMPORTS_PER_SOL).toFixed(4),
      usdValue: data.nativeBalanceUsd || 0
    });

    // Filter and add fungible tokens only
    const fungibleTokens = await Promise.all(
      (data.items || [])
        .filter(asset => 
          asset.interface === 'FungibleToken' || 
          asset.interface === 'FungibleAsset'
        )
        .map(async token => {
          try {
            console.log('Processing token:', {
              id: token.id,
              interface: token.interface,
              balance: token.token_info?.balance,
              decimals: token.token_info?.decimals
            });
            const metadata = await getTokenMetadata(token.id);
            const balance = parseFloat(token.token_info?.balance || 0);
            const decimals = token.token_info?.decimals || 9;
            const price = token.token_info?.price_info?.price_per_token || 0;
            const usdValue = (balance / Math.pow(10, decimals)) * price;
            
            return {
              mint: token.id,
              symbol: metadata?.symbol || token.content?.metadata?.symbol || 'Unknown',
              name: metadata?.name || token.content?.metadata?.name || 'Unknown Token',
              logoUrl: metadata?.logoUrl || token.content?.metadata?.json?.image || '/images/token-placeholder.png',
              amount: usdValue.toFixed(2),
              displayAmount: (balance / Math.pow(10, decimals)).toFixed(decimals),
              usdValue
            };
          } catch (e) {
            console.warn(`Failed to process token ${token.id}:`, e);
            return null;
          }
        })
    );

    const validTokens = fungibleTokens.filter(Boolean);
    console.log('Processed tokens count:', validTokens.length);
    tokens.push(...validTokens);
    return tokens;
  } catch (error) {
    console.error('Error fetching SPL balances:', error);
    return [];
  }
}

async function getTokenMetadata(mint) {
  try {
    // Try Jupiter first
    const jupiterResponse = await fetch(`https://token.jup.ag/all`);
    const jupiterData = await jupiterResponse.json();
    const jupiterToken = jupiterData.tokens.find(t => t.address === mint);
    
    if (jupiterToken) {
      return {
        name: jupiterToken.name,
        symbol: jupiterToken.symbol,
        logoUrl: jupiterToken.logoURI
      };
    }

    // Try DexScreener as backup
    const dexResponse = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${mint}`);
    const dexData = await dexResponse.json();
    const dexToken = dexData?.pairs?.[0]?.baseToken;

    if (dexToken) {
      return {
        name: dexToken.name,
        symbol: dexToken.symbol,
        logoUrl: dexToken.logoURI
      };
    }

    return null;
  } catch (e) {
    console.warn(`Failed to fetch metadata for ${mint}`);
    return null;
  }
}

export async function getNftsByOwner(walletAddress) {
  try {
    const response = await fetch(`/api/helius/assets?owner=${walletAddress}`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch NFTs');
    }

    return data.items
      .filter(asset => 
        asset.interface === 'V1_NFT' || 
        asset.interface === 'V1_Metadata' ||
        asset.interface === 'ProgrammableNFT'
      )
      .map(nft => ({
        mint: nft.id,
        name: nft.content?.metadata?.name || 'Unnamed NFT',
        symbol: nft.content?.metadata?.symbol,
        image: nft.content?.files?.[0]?.uri || 
               nft.content?.links?.image || 
               nft.image ||
               '/images/nft-placeholder.png',
        collection: nft.grouping?.[0]?.group_value || 'Unknown Collection'
      }));
  } catch (error) {
    console.error('Error fetching NFTs:', error);
    throw error;
  }
} 