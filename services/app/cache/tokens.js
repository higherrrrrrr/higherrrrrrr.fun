import { DuneClient } from '@duneanalytics/client-sdk';
import config from '../app/api/config/config';

// Token category lists
const MAJOR_TOKENS = [
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT
  '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs', // Wrapped ETH (Wormhole)
  '3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh', // Wrapped BTC (Wormhole)
  'cbbtcf3aa214zXHbiAZQwf4122FBYbraNdFqgw4iMij',  // Coinbase Wrapped BTC
  'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn', // Jito Staked SOL
].map(addr => addr.toLowerCase());

const VC_BACKED_TOKENS = [
  '27G8MtK7VtTcCHkpASjSDdkWWYfoqT6ggEuKidVJidD4', // Jupiter Perps LP
  '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R', // Raydium
  'LAYER4xPpTCb3QL8S9u41EAhAX7mhBn8Q6xMTwY2Yzc',  // Solayer
  'sSo14endRuUbvQaJS3dq36Q829a3A6BEfoeeRGJywEh',  // Solayer SOL
].map(addr => addr.toLowerCase());

class TokenCache {
  constructor() {
    this.cache = new Map();
    this.lastUpdated = null;
    this.isUpdating = false;
    this.client = new DuneClient(process.env.DUNE_API_KEY);
    // Do initial load
    this.updateCache().catch(console.error);
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

  async getToken(address) {
    await this.waitForData();
    return this.cache.get(address?.toLowerCase());
  }

  async getAllTokens() {
    await this.waitForData();
    return Array.from(this.cache.values());
  }

  async getMajorTokens() {
    await this.waitForData();
    return (await this.getAllTokens())
      .filter(token => MAJOR_TOKENS.includes(token.token_address?.toLowerCase()))
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
    
    // Get all non-major, non-VC tokens
    const tokens = allTokens.filter(token => {
      const address = token.token_address?.toLowerCase();
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
      .filter(token => VC_BACKED_TOKENS.includes(token.token_address?.toLowerCase()))
      .sort((a, b) => {
        const volumeA = parseFloat(a.volume_24h || 0);
        const volumeB = parseFloat(b.volume_24h || 0);
        return volumeB - volumeA;
      });
  }

  getLastUpdated() {
    return this.lastUpdated;
  }

  async updateCache() {
    if (this.isUpdating) return;

    try {
      this.isUpdating = true;
      const response = await fetch(
        `https://api.dune.com/api/v1/query/${config.DUNE_QUERY_ID}/results`,
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
        this.cache.clear();
        
        data.result.rows.forEach(row => {
          const address = row.token_mint_address?.toLowerCase();
          if (address) {
            // Normalize the data structure
            this.cache.set(address, {
              token_address: address,
              name: row.name || 'Unknown Token',
              symbol: row.symbol || '',
              token_uri: row.token_uri || null,
              volume_24h: row.twentyfour_hour_volume || '0',
              trades_24h: row.twentyfour_hour_trades || 0,
              total_accounts: row.total_accounts || 0,
              created_at: row.created_at || new Date().toISOString(),
              decimals: row.decimals || 9
            });
          }
        });

        this.lastUpdated = new Date();
      } else {
        throw new Error('No rows in query result');
      }
    } catch (error) {
      console.error('Error updating token cache:', error);
    } finally {
      this.isUpdating = false;
    }
  }
}

const tokenCache = new TokenCache();

export default tokenCache; 