import { NextResponse } from 'next/server';
import tokenCache from '../../../../services/tokens';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse filter parameters
    const minVolume = searchParams.has('minVolume') ? parseFloat(searchParams.get('minVolume')) : 0;
    const maxVolume = searchParams.has('maxVolume') ? parseFloat(searchParams.get('maxVolume')) : Infinity;
    const minHolders = searchParams.has('minHolders') ? parseInt(searchParams.get('minHolders')) : 0;
    const maxHolders = searchParams.has('maxHolders') ? parseInt(searchParams.get('maxHolders')) : Infinity;
    const maxAge = searchParams.has('maxAge') ? parseInt(searchParams.get('maxAge')) : null;
    const selectedCategory = searchParams.get('category');

    // Get tokens based on category
    const [major, meme, vc] = await Promise.all([
      tokenCache.getMajorTokens(),
      tokenCache.getMemeTokens(),
      tokenCache.getVCBackedTokens()
    ]);

    // Select tokens based on category
    let tokens = [];
    if (selectedCategory === 'major') {
      tokens = major;
    } else if (selectedCategory === 'meme') {
      tokens = meme;
    } else if (selectedCategory === 'vc') {
      tokens = vc;
    } else {
      tokens = [...major, ...meme, ...vc];
    }

    // Apply basic filters
    const filteredTokens = tokens.filter(token => {
      const volume = parseFloat(token.volume_24h) || 0;
      const holders = parseInt(token.total_accounts || token.holder_count || token.holders || 0);
      let ageInDays = null;

      if (token.created_at) {
        const createdDate = new Date(token.created_at);
        if (!isNaN(createdDate.getTime())) {
          ageInDays = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
        }
      }

      if (minVolume > 0 && volume < minVolume) return false;
      if (maxVolume < Infinity && volume > maxVolume) return false;
      if (minHolders > 0 && holders < minHolders) return false;
      if (maxHolders < Infinity && holders > maxHolders) return false;
      if (maxAge && ageInDays !== null && ageInDays > maxAge) return false;

      return true;
    });

    return NextResponse.json({ tokens: filteredTokens });

  } catch (error) {
    console.error('Filter error:', error);
    return NextResponse.json({ error: 'Failed to filter tokens' }, { status: 500 });
  }
} 