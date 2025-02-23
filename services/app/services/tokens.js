import { DuneClient } from '@duneanalytics/client-sdk';
import pool from '../lib/db';
import { logger } from '../lib/logger';

// Token category lists
const MAJOR_TOKENS = [
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT
  '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs', // Wrapped ETH (Wormhole)
  '3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh', // Wrapped BTC (Wormhole)
  'cbbtcf3aa214zXHbiAZQwf4122FBYbraNdFqgw4iMij',  // Coinbase Wrapped BTC
  'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn', // Jito Staked SOL
];

const VC_BACKED_TOKENS = [
  // DEX & Trading
  '27G8MtK7VtTcCHkpASjSDdkWWYfoqT6ggEuKidVJidD4', // Jupiter Perps LP
  '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R', // Raydium
  'LAYER4xPpTCb3QL8S9u41EAhAX7mhBn8Q6xMTwY2Yzc',  // Solayer
  'sSo14endRuUbvQaJS3dq36Q829a3A6BEfoeeRGJywEh',  // Solayer SOL
  'KMNo3nJsBXfcpJTVhZcXLW7RmTwTt4GVFE7suUBo9sS',  // Kamino
  'jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL',  // JITO
  'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So',  // Marinade staked SOL
  'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn', // Jito Staked SOL
  
  // Stablecoins with institutional backing
  '9znqrsgljnkwcuu5gq5lr8beucpzqmvmqkai3sszh54u', // First Digital USD
  
  // NFT/Gaming Projects
  'AMvHHqak2JevcnsBBbKb28hYcwytKMAs2DefjmRkekgv', // Jupiter Community Test
  '9PSRPhTMfY31LxZGEdmAmUS9rAFo68CBohMkAtsZY9BW', // Flip.gg
  
  // Layer Solutions
  'Cd55P9pMnVLssU3L63UgQTFmBUnCm9E9BGmSYn3H5y8x', // Solayer variant
  '4uwg72sLLhJnUdRjKGKDJHhz6NJrgxiFesGfxF1FUyGN', // Solayer variant
  'FwKcZs3Fd6bKHktrzEBSRFUnufN7xzm45zqc34Q3tMJN', // Solayer variant
  'HN9g8jb3ra2wHLTJfPaUzgfafU2uoCQSi5hjHmrfYHNB', // Solayer variant
  '8U4HrXm1NKvSyig6AFV3nmqv9PettLTsiNfyG3QWWjVk', // Solayer variant
  'CxJE9jd3ARkvewRXSuAJeaKhsUpvecgyPPBPpt722LrF'  // Solayer variant
].map(addr => addr); // Note: Not using toLowerCase() to preserve case sensitivity

class TokensService {
  constructor() {
    this.isUpdating = false;
    this.client = new DuneClient(process.env.DUNE_API_KEY);
    this.updateCache().catch(err => logger.error('Initial cache update failed', err));
  }

  async getToken(mint) {
    try {
      const result = await pool.query(
        `SELECT * FROM token_info WHERE mint = $1`,
        [mint]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error fetching token:', error);
      return null;
    }
  }

  async updateTokenInfo(tokenData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      await client.query(
        `INSERT INTO token_info (
          mint,
          name,
          symbol,
          volume_24h,
          trades_24h,
          total_accounts,
          created_at,
          decimals,
          price_change_24h
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (mint) DO UPDATE SET
          name = EXCLUDED.name,
          symbol = EXCLUDED.symbol,
          volume_24h = EXCLUDED.volume_24h,
          trades_24h = EXCLUDED.trades_24h,
          total_accounts = EXCLUDED.total_accounts,
          decimals = EXCLUDED.decimals,
          price_change_24h = EXCLUDED.price_change_24h,
          last_updated = CURRENT_TIMESTAMP`,
        [
          tokenData.token_address,
          tokenData.name,
          tokenData.symbol,
          tokenData.volume_24h,
          tokenData.trades_24h,
          tokenData.total_accounts,
          tokenData.created_at,
          tokenData.decimals,
          tokenData.price_change_24h || 0
        ]
      );

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error updating token info:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async updateCache() {
    if (this.isUpdating) return;

    try {
      this.isUpdating = true;
      const response = await fetch(
        `https://api.dune.com/api/v1/query/${process.env.DUNE_QUERY_ID}/results`,
        {
          headers: {
            'x-dune-api-key': process.env.DUNE_API_KEY
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Dune API error: ${await response.text()}`);
      }

      const data = await response.json();

      if (data.result?.rows?.length > 0) {
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          
          for (const row of data.result.rows) {
            if (row.token_mint_address) {
              await this.updateTokenInfo({
                token_address: row.token_mint_address,
                name: row.name || 'Unknown Token',
                symbol: row.symbol || '',
                volume_24h: row.twentyfour_hour_volume || '0',
                trades_24h: row.twentyfour_hour_trades || 0,
                total_accounts: row.total_accounts || 0,
                created_at: row.created_at || new Date().toISOString(),
                decimals: row.decimals || 9
              });
            }
          }

          await client.query('COMMIT');
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        } finally {
          client.release();
        }
      }
    } catch (error) {
      console.error('Error updating token cache:', error);
    } finally {
      this.isUpdating = false;
    }
  }

  async waitForData() {
    if (this.cache.size > 0) return;

    // If cache is empty and not updating, trigger an update
    if (!this.isUpdating) {
      await this.updateCache();
    }

    // If still updating, wait for it to complete
    if (this.isUpdating) {
      await new Promise((resolve) => {
        const checkCache = () => {
          if (this.cache.size > 0) {
            resolve();
          } else if (!this.isUpdating) {
            // If update finished but cache is still empty, try one more time
            this.updateCache()
              .then(() => resolve())
              .catch(() => resolve()); // Resolve anyway to prevent hanging
          } else {
            setTimeout(checkCache, 100);
          }
        };
        checkCache();
      });
    }
  }

  async getAllTokens() {
    await this.waitForData();
    return Array.from(this.cache.values());
  }

  async getMajorTokens() {
    await this.waitForData();
    return (await this.getAllTokens())
      .filter(token => MAJOR_TOKENS.includes(token.token_address))
      .sort((a, b) => {
        const volumeA = parseFloat(a.volume_24h || 0);
        const volumeB = parseFloat(b.volume_24h || 0);
        return volumeB - volumeA;
      });
  }

  calculateMemeScore(token) {
    const holders = parseFloat(token.total_accounts || 0);
    const trades = parseFloat(token.trades_24h || 0);
    const volume = parseFloat(token.volume_24h || 0);
    const createdAt = new Date(token.created_at);
    const now = new Date();
    const ageInDays = (now - createdAt) / (1000 * 60 * 60 * 24);

    // Time decay factor - higher for newer tokens
    const timeDecay = Math.exp(-ageInDays / 30); // Decay over ~30 days

    // Base the score primarily on holders and trades
    const holderScore = Math.log(holders + 1) * 2;     // Highest weight
    const tradeScore = Math.log(trades + 1);           // Medium weight
    const volumeScore = Math.log(volume + 1) / 50;     // Very low weight

    // Combine scores with time decay
    return (holderScore + tradeScore + volumeScore) * (1 + timeDecay);
  }

  async getMemeTokens() {
    await this.waitForData();
    const allTokens = await this.getAllTokens();
    
    const tokens = allTokens.filter(token => {
      const address = token.token_address;
      const isMajor = MAJOR_TOKENS.includes(address);
      const isVC = VC_BACKED_TOKENS.includes(address);
      return !isMajor && !isVC;
    });
    
    // Sort by 24h volume
    return tokens.sort((a, b) => {
      const volumeA = parseFloat(a.volume_24h || 0);
      const volumeB = parseFloat(b.volume_24h || 0);
      return volumeB - volumeA;
    });
  }

  async getVCBackedTokens() {
    await this.waitForData();
    return (await this.getAllTokens())
      .filter(token => VC_BACKED_TOKENS.includes(token.token_address))
      .sort((a, b) => {
        const volumeA = parseFloat(a.volume_24h || 0);
        const volumeB = parseFloat(b.volume_24h || 0);
        return volumeB - volumeA;
      });
  }

  getLastUpdated() {
    return this.lastUpdated;
  }
}

export default new TokensService(); 