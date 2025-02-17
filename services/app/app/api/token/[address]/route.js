import { NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import { tokenCache } from '@/app/services/tokenCache';

export async function GET(request, { params }) {
  try {
    const { address } = await params;
    console.log('Token API called for address:', address);

    if (!address) {
      return NextResponse.json(
        { error: 'Missing token address' },
        { status: 400 }
      );
    }

    // Check cache first
    const cached = tokenCache.get(address);
    if (cached && !tokenCache.isStale(address)) {
      console.log('Returning cached data for:', address);
      return NextResponse.json(cached);
    }

    // Initialize Solana connection
    const connection = new Connection(process.env.NEXT_PUBLIC_RPC_URL || 'https://api.mainnet-beta.solana.com');

    // Get token supply and decimals first
    let totalSupply = null;
    let inputDecimals = 9;
    let symbol = null;

    try {
      const tokenSupply = await connection.getTokenSupply(new PublicKey(address));
      totalSupply = tokenSupply.value.uiAmount;
      inputDecimals = tokenSupply.value.decimals;
      console.log('Token supply:', totalSupply, 'decimals:', inputDecimals);
    } catch (error) {
      console.warn('Error fetching token supply:', error);
    }

    // Get Jupiter token info
    try {
      const tokenListResponse = await fetch('https://token.jup.ag/all');
      const tokenList = await tokenListResponse.json();
      const tokenInfo = tokenList.find(t => t.address === address);
      
      if (tokenInfo) {
        inputDecimals = tokenInfo.decimals;
        symbol = tokenInfo.symbol;
        console.log('Found token in Jupiter list:', { symbol, decimals: inputDecimals });
      }
    } catch (error) {
      console.warn('Error fetching Jupiter token list:', error);
    }

    const USDC_ADDRESS = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
    const SOL_ADDRESS = 'So11111111111111111111111111111111111111112';
    
    let outputMint;
    let isStablecoin = false;

    if (address === USDC_ADDRESS) {
      outputMint = SOL_ADDRESS;
      isStablecoin = true;
    } else {
      outputMint = address; // We want to receive 1 token
    }

    // Calculate quote amount for 1 USDC in base units (6 decimals)
    const quoteAmount = '1000000'; // 1 USDC
    console.log('Using quote amount:', quoteAmount, 'for USDC input');

    // Get quote from Jupiter
    const quoteUrl = 'https://quote-api.jup.ag/v6/quote';
    const quoteParams = new URLSearchParams({
      inputMint: USDC_ADDRESS, // Starting with USDC
      outputMint: outputMint,  // Getting token
      amount: quoteAmount,     // 1 USDC in base units
      slippageBps: '50',
      onlyDirectRoutes: 'false'
    });

    console.log('Calling Jupiter Quote API:', `${quoteUrl}?${quoteParams}`);

    const quoteResponse = await fetch(`${quoteUrl}?${quoteParams}`);
    const quoteData = await quoteResponse.json();
    
    if (!quoteResponse.ok || quoteData.error) {
      console.error('Jupiter Quote API error:', quoteData);
      return NextResponse.json({
        address,
        symbol: symbol || 'Unknown',
        decimals: inputDecimals,
        verified: symbol !== null,
        price: null,
        totalSupply: totalSupply ? totalSupply.toString() : null,
        marketCap: null,
        error: quoteData.error || 'No liquidity available'
      });
    }

    // Calculate price
    let price;
    if (isStablecoin) {
      price = 1;
    } else {
      // Calculate how many tokens we get for 1 USDC
      const outAmount = BigInt(quoteData.outAmount);
      const tokensPerUSDC = Number(outAmount) / Math.pow(10, inputDecimals);
      // Price is 1/tokensPerUSDC to get USDC per token
      price = 1 / tokensPerUSDC;
      
      console.log('Price calculation:', {
        usdcAmount: quoteAmount,
        tokenOutput: outAmount.toString(),
        tokensPerUSDC,
        pricePerToken: price,
        inputDecimals
      });
    }

    // Calculate market cap
    const marketCap = price && totalSupply ? price * totalSupply : null;

    // Get historical prices from DexScreener
    let priceChanges = {
      '1h': null,
      '6h': null,
      '24h': null
    };

    try {
      const dexscreenerUrl = `https://api.dexscreener.com/latest/dex/tokens/${address}`;
      console.log('Fetching DexScreener data for:', address);
      
      const response = await fetch(dexscreenerUrl);
      const data = await response.json();
      
      if (data.pairs && data.pairs.length > 0) {
        const mainPair = data.pairs.sort((a, b) => {
          const liquidityA = Number(a.liquidity?.usd) || 0;
          const liquidityB = Number(b.liquidity?.usd) || 0;
          const volumeA = Number(a.volume?.h24) || 0;
          const volumeB = Number(b.volume?.h24) || 0;
          
          return (liquidityB + volumeB) - (liquidityA + volumeA);
        })[0];

        console.log('Raw pair data:', {
          pairAddress: mainPair.pairAddress,
          priceChange: mainPair.priceChange,
          pairCreatedAt: mainPair.pairCreatedAt
        });

        if (mainPair.priceChange) {
          // Map DexScreener fields to our timeframes
          const changes = {
            '1h': mainPair.priceChange.h1,
            '6h': mainPair.priceChange.h6,
            '24h': mainPair.priceChange.h24
          };

          // Parse and validate each timeframe
          Object.entries(changes).forEach(([timeframe, value]) => {
            if (value !== undefined && value !== null) {
              const parsed = parseFloat(value);
              priceChanges[timeframe] = !isNaN(parsed) ? parsed : null;
            }
          });
        }

        console.log('Processed price changes:', priceChanges);
      } else {
        console.log('No pairs found for token:', address);
      }
    } catch (error) {
      console.warn('Error fetching historical prices:', error);
    }

    const response_data = {
      address,
      symbol: symbol || 'Unknown',
      decimals: inputDecimals,
      verified: symbol !== null,
      price: price ? price.toString() : null,
      priceChanges,
      totalSupply: totalSupply ? totalSupply.toString() : null,
      marketCap: price && totalSupply ? (price * totalSupply).toString() : null,
      bestRoute: {
        inAmount: quoteData?.inAmount,
        outAmount: quoteData?.outAmount,
        priceImpact: quoteData?.priceImpactPct,
        marketInfos: quoteData?.marketInfos || []
      },
      timestamp: Date.now()
    };

    // Cache the response
    tokenCache.set(address, response_data);
    
    return NextResponse.json(response_data);

  } catch (error) {
    console.error('Error in token API:', error);
    return NextResponse.json({
      address,
      symbol: symbol || 'Unknown',
      decimals: inputDecimals,
      verified: symbol !== null,
      price: null,
      priceChanges: { '1h': null, '6h': null, '24h': null },
      totalSupply: totalSupply ? totalSupply.toString() : null,
      marketCap: null,
      error: error.message || 'Internal server error'
    });
  }
}