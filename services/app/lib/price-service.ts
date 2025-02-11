import { getRedisClient } from './redis';
import { CACHE_KEYS, CACHE_TIMES, API_ENDPOINTS } from './constants';
import { env } from '@/lib/env.mjs';

interface TokenPrice {
  price: number;
  price_change_24h: number;
  volume_24h: number;
  market_cap: number;
  last_updated: string;
}

class PriceService {
  private cache: Map<string, TokenPrice> = new Map();
  private lastUpdate: number = 0;
  private updateInterval: number = 60 * 1000; // 1 minute

  async getTokenPrices(addresses: string[]): Promise<Map<string, TokenPrice>> {
    const now = Date.now();
    const shouldUpdate = now - this.lastUpdate > this.updateInterval;

    if (shouldUpdate) {
      await this.updatePrices(addresses);
      this.lastUpdate = now;
    }

    return new Map(
      addresses.map(addr => [
        addr,
        this.cache.get(addr) || {
          price: 0,
          price_change_24h: 0,
          volume_24h: 0,
          market_cap: 0,
          last_updated: new Date().toISOString()
        }
      ])
    );
  }

  private async updatePrices(addresses: string[]): Promise<void> {
    try {
      const redis = await getRedisClient();
      const cacheKey = CACHE_KEYS.PRICES(addresses);
      
      if (redis) {
        const cached = await redis.get(cacheKey);
        if (cached) {
          const prices = JSON.parse(cached);
          Object.entries(prices).forEach(([addr, price]) => {
            this.cache.set(addr, price as TokenPrice);
          });
          return;
        }
      }

      // Fetch prices in parallel for all tokens
      const promises = addresses.map(address =>
        fetch(API_ENDPOINTS.GECKOTERMINAL_TOKEN(address))
          .then(res => res.ok ? res.json() : null)
          .catch(() => null)
      );

      const results = await Promise.all(promises);
      const prices: Record<string, TokenPrice> = {};

      addresses.forEach((address, i) => {
        const data = results[i]?.data;
        if (data) {
          const price: TokenPrice = {
            price: parseFloat(data.attributes.price_usd || '0'),
            price_change_24h: parseFloat(data.attributes.price_change_percentage_24h || '0'),
            volume_24h: parseFloat(data.attributes.volume_usd_24h || '0'),
            market_cap: parseFloat(data.attributes.market_cap_usd || '0'),
            last_updated: new Date().toISOString()
          };
          this.cache.set(address, price);
          prices[address] = price;
        }
      });

      if (redis && Object.keys(prices).length > 0) {
        await redis.set(cacheKey, JSON.stringify(prices), { ex: CACHE_TIMES.WITH_PRICE });
      }
    } catch (error) {
      console.error('Failed to update prices:', error);
    }
  }
}

export const priceService = new PriceService(); 