class TokenCache {
  constructor() {
    this.cache = new Map();
    this.lastUpdated = null;
    this.updating = false;
    this.CACHE_DURATION = 30 * 1000; // 30 seconds
  }

  get(address) {
    return this.cache.get(address);
  }

  set(address, data) {
    this.cache.set(address, {
      ...data,
      cachedAt: Date.now()
    });
  }

  isStale(address) {
    const data = this.get(address);
    if (!data) return true;
    return Date.now() - data.cachedAt > this.CACHE_DURATION;
  }

  clear() {
    this.cache.clear();
    this.lastUpdated = null;
  }
}

// Export a singleton instance
export const tokenCache = new TokenCache(); 