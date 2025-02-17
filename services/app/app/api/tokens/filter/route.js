import { NextResponse } from 'next/server';
import tokenCache from '../../../../services/tokens';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    console.log('Filter API called with params:', Object.fromEntries(searchParams));
    
    // Get tokens based on category
    const [major, meme, vc] = await Promise.all([
      tokenCache.getMajorTokens(),
      tokenCache.getMemeTokens(),
      tokenCache.getVCBackedTokens()
    ]);

    // Select tokens based on category
    let tokens = [];
    if (searchParams.has('category')) {
      const selectedCategory = searchParams.get('category');
      if (selectedCategory === 'major') {
        tokens = major;
      } else if (selectedCategory === 'meme') {
        tokens = meme;
      } else if (selectedCategory === 'vc') {
        tokens = vc;
      } else if (selectedCategory === 'all') {
        tokens = [...major, ...meme, ...vc];
      }
    } else {
      tokens = [...major, ...meme, ...vc];
    }

    // Debug: Log initial tokens
    console.log('Initial tokens count:', tokens?.length || 0);
    
    // Parse filter parameters with proper type conversion
    const minVolume = searchParams.has('minVolume') ? parseFloat(searchParams.get('minVolume')) : 0;
    const maxVolume = searchParams.has('maxVolume') ? parseFloat(searchParams.get('maxVolume')) : Infinity;
    const minHolders = searchParams.has('minHolders') ? parseInt(searchParams.get('minHolders')) : 0;
    const maxHolders = searchParams.has('maxHolders') ? parseInt(searchParams.get('maxHolders')) : Infinity;
    const minMarketCap = searchParams.has('minMarketCap') ? parseFloat(searchParams.get('minMarketCap')) : 0;
    const maxMarketCap = searchParams.has('maxMarketCap') ? parseFloat(searchParams.get('maxMarketCap')) : Infinity;
    const minPriceChange24h = searchParams.has('minPriceChange24h') ? parseFloat(searchParams.get('minPriceChange24h')) : null;
    const maxPriceChange24h = searchParams.has('maxPriceChange24h') ? parseFloat(searchParams.get('maxPriceChange24h')) : null;

    let filteredTokens = tokens.filter(token => {
      // Parse token values with fallbacks
      const volume = parseFloat(token.volume_24h) || 0;
      const holders = parseInt(token.total_accounts || token.holder_count || token.holders || 0);
      const marketCap = parseFloat(token.marketCap) || 0;
      
      // Get price change from either priceChanges object or direct property
      let priceChange24h = null;
      if (token.priceChanges?.['24h'] !== undefined) {
        priceChange24h = parseFloat(token.priceChanges['24h']);
      } else if (token.price_change_24h !== undefined) {
        priceChange24h = parseFloat(token.price_change_24h);
      }

      // Debug individual token
      if (tokens.indexOf(token) < 3) {
        console.log('Processing token:', {
          name: token.name,
          volume,
          holders,
          marketCap,
          priceChange24h,
          rawPriceChanges: token.priceChanges,
          rawPriceChange24h: token.price_change_24h
        });
      }

      // Volume filter
      if (minVolume > 0 && volume < minVolume) return false;
      if (maxVolume < Infinity && volume > maxVolume) return false;

      // Holders filter
      if (minHolders > 0 && holders < minHolders) return false;
      if (maxHolders < Infinity && holders > maxHolders) return false;

      // Market Cap filter
      if (minMarketCap > 0 && marketCap < minMarketCap) return false;
      if (maxMarketCap < Infinity && marketCap > maxMarketCap) return false;

      // Price Change filter - only apply if we have valid data
      if (minPriceChange24h !== null && priceChange24h !== null) {
        if (priceChange24h < minPriceChange24h) return false;
      }
      if (maxPriceChange24h !== null && priceChange24h !== null) {
        if (priceChange24h > maxPriceChange24h) return false;
      }

      return true;
    });

    // Sort tokens if needed
    const sortBy = searchParams.get('sortBy') || 'volume';
    const sortDir = searchParams.get('sortDir') || 'desc';
    
    filteredTokens.sort((a, b) => {
      const multiplier = sortDir === 'desc' ? -1 : 1;
      const getValue = (token) => {
        switch(sortBy) {
          case 'volume':
            return parseFloat(token.volume_24h) || 0;
          case 'holders':
            return parseInt(token.total_accounts || token.holder_count || token.holders || 0);
          case 'marketCap':
            return parseFloat(token.marketCap) || 0;
          case 'priceChange24h':
            return parseFloat(token.priceChanges?.['24h'] || token.price_change_24h || 0);
          default:
            return 0;
        }
      };
      return multiplier * (getValue(a) - getValue(b));
    });

    // Debug final results
    console.log('Filtered tokens count:', filteredTokens.length);
    if (filteredTokens.length > 0) {
      console.log('Sample filtered token:', {
        name: filteredTokens[0].name,
        volume: filteredTokens[0].volume_24h,
        holders: filteredTokens[0].total_accounts,
        priceChange: filteredTokens[0].priceChanges?.['24h']
      });
    }

    return NextResponse.json({
      tokens: filteredTokens,
      total: filteredTokens.length
    });
  } catch (error) {
    console.error('Filter API error:', error.stack);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 