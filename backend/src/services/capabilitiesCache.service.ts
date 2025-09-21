import { DataCapabilities } from './dataCapabilities.service';

interface CacheEntry {
  data: DataCapabilities;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class CapabilitiesCacheService {
  private cache = new Map<string, CacheEntry>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Generate cache key for account capabilities
   */
  private getCacheKey(accountId: string, userId: string): string {
    return `capabilities:${userId}:${accountId}`;
  }

  /**
   * Get capabilities from cache if available and not expired
   */
  get(accountId: string, userId: string): DataCapabilities | null {
    const key = this.getCacheKey(accountId, userId);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Store capabilities in cache
   */
  set(accountId: string, userId: string, data: DataCapabilities, ttl?: number): void {
    const key = this.getCacheKey(accountId, userId);
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.DEFAULT_TTL
    };

    this.cache.set(key, entry);
  }

  /**
   * Invalidate cache for specific account
   */
  invalidate(accountId: string, userId: string): void {
    const key = this.getCacheKey(accountId, userId);
    this.cache.delete(key);
  }

  /**
   * Invalidate all cache entries for a user
   */
  invalidateUser(userId: string): void {
    const keysToDelete: string[] = [];

    for (const [key] of this.cache) {
      if (key.includes(`:${userId}:`)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache) {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    totalEntries: number;
    expiredEntries: number;
    cacheHitRate: number;
    memoryUsage: string;
  } {
    const now = Date.now();
    let expiredCount = 0;

    for (const [, entry] of this.cache) {
      if (now - entry.timestamp > entry.ttl) {
        expiredCount++;
      }
    }

    // Simple memory usage estimation (approximate)
    const memoryBytes = JSON.stringify([...this.cache.entries()]).length;
    const memoryKB = Math.round(memoryBytes / 1024);

    return {
      totalEntries: this.cache.size,
      expiredEntries: expiredCount,
      cacheHitRate: 0, // Would need hit/miss tracking for real implementation
      memoryUsage: `${memoryKB} KB`
    };
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Start periodic cleanup (call this once during app initialization)
   */
  startPeriodicCleanup(intervalMs: number = 10 * 60 * 1000): void { // Default: 10 minutes
    setInterval(() => {
      this.cleanup();
    }, intervalMs);
  }
}

// Export singleton instance
export const capabilitiesCacheService = new CapabilitiesCacheService();