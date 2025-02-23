import pool from '../lib/db';
import { logger } from '../lib/logger';

export async function getTokenMetadata(mint) {
  try {
    // Check cache first
    const cached = await pool.query(
      `SELECT metadata FROM token_metadata 
       WHERE mint = $1 
       AND updated_at > NOW() - INTERVAL '24 hours'`,
      [mint]
    );

    if (cached.rows.length > 0) {
      return cached.rows[0].metadata;
    }

    // Try Jupiter first
    const jupiterResponse = await fetch(`https://token.jup.ag/all`);
    const jupiterData = await jupiterResponse.json();
    const jupiterToken = jupiterData.tokens.find(t => t.address === mint);
    
    if (jupiterToken) {
      const metadata = {
        name: jupiterToken.name,
        symbol: jupiterToken.symbol,
        logoUrl: jupiterToken.logoURI
      };
      await cacheMetadata(mint, metadata);
      return metadata;
    }

    // Try DexScreener as backup
    const dexResponse = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${mint}`);
    const dexData = await dexResponse.json();
    const dexToken = dexData?.pairs?.[0]?.baseToken;

    if (dexToken) {
      const metadata = {
        name: dexToken.name,
        symbol: dexToken.symbol,
        logoUrl: dexToken.logoURI
      };
      await cacheMetadata(mint, metadata);
      return metadata;
    }

    return null;
  } catch (e) {
    console.warn(`Failed to fetch metadata for ${mint}:`, e);
    return null;
  }
}

async function cacheMetadata(mint, metadata) {
  try {
    await pool.query(
      `INSERT INTO token_metadata (mint, metadata)
       VALUES ($1, $2)
       ON CONFLICT (mint) DO UPDATE
       SET metadata = $2,
           updated_at = CURRENT_TIMESTAMP`,
      [mint, JSON.stringify(metadata)]
    );
  } catch (e) {
    console.error('Failed to cache metadata:', e);
  }
} 