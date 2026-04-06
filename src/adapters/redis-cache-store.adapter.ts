/**
 * @file redis-cache-store.adapter.ts
 *
 * Redis-backed implementation of ICacheStore, built on top of the ioredis client.
 *
 * Behaviour:
 *  - Values are JSON-serialized on write and JSON-parsed on read.
 *  - A parse failure (malformed JSON) returns null instead of throwing.
 *  - An optional key prefix namespaces every key so multiple adapters can
 *    share the same Redis database without colliding.
 *  - clear() only removes keys that belong to this adapter's prefix via
 *    cursor-based SCAN (non-blocking, safe for large key sets);
 *    without a prefix it flushes the entire Redis database (FLUSHDB).
 *
 * Exports:
 *  - RedisCacheStoreOptions  → configuration shape for the constructor
 *  - RedisCacheStore         → the concrete Redis adapter class
 */

import type { ICacheStore } from "@ports/cache-store.port";
import Redis from "ioredis";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/**
 * Constructor options for RedisCacheStore.
 */
export interface RedisCacheStoreOptions {
  /**
   * An already-constructed ioredis client, OR a Redis connection URL string.
   * Passing an existing client lets the caller manage the connection lifecycle.
   * Passing a URL string creates a new internal client automatically.
   *
   * @example "redis://localhost:6379"
   */
  client: Redis | string;

  /**
   * Optional prefix prepended to every key as "<prefix>:<key>".
   * Useful for isolating cache namespaces on a shared Redis instance.
   *
   * @example "myapp:cache"
   */
  keyPrefix?: string;
}

// ---------------------------------------------------------------------------
// Adapter
// ---------------------------------------------------------------------------

/**
 * Redis adapter for the ICacheStore port.
 *
 * Usage:
 * ```typescript
 * const store = new RedisCacheStore({ client: "redis://localhost:6379", keyPrefix: "app" });
 * await store.set("user:1", { name: "Alice" }, 300); // TTL 5 min
 * const user = await store.get<User>("user:1");
 * ```
 */
export class RedisCacheStore implements ICacheStore {
  /** Underlying ioredis client used for all Redis commands */
  private readonly redis: Redis;

  /** Key prefix applied to every cache key (may be an empty string) */
  private readonly keyPrefix: string;

  constructor(options: RedisCacheStoreOptions) {
    // Accept either an existing ioredis client or a plain connection URL string.
    // When a URL is provided we create a new dedicated client instance.
    this.redis = typeof options.client === "string" ? new Redis(options.client) : options.client;

    // Fall back to an empty string so buildKey() can skip the prefix logic.
    this.keyPrefix = options.keyPrefix ?? "";
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * Prepend the adapter's namespace prefix to a key.
   * Returns the key unchanged when no prefix was configured.
   *
   * @param key - Raw cache key
   * @returns Full Redis key with optional prefix
   */
  private buildKey(key: string): string {
    // Only add the colon separator when a prefix is set
    return this.keyPrefix ? `${this.keyPrefix}:${key}` : key;
  }

  // ---------------------------------------------------------------------------
  // ICacheStore implementation
  // ---------------------------------------------------------------------------

  /** {@inheritDoc ICacheStore.get} */
  async get<T>(key: string): Promise<T | null> {
    // Fetch the raw serialized string from Redis (returns null if key is missing)
    const raw = await this.redis.get(this.buildKey(key));

    // Key does not exist in Redis — return null immediately
    if (raw === null) return null;

    // Deserialize the JSON string back to the caller's expected type.
    // If the stored value is somehow malformed, return null instead of crashing.
    try {
      return JSON.parse(raw) as T;
    } catch {
      // Parse failure — treat as a cache miss
      return null;
    }
  }

  /** {@inheritDoc ICacheStore.set} */
  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    // Serialize the value to a JSON string before handing it to Redis
    const serialized = JSON.stringify(value);
    const fullKey = this.buildKey(key);

    if (ttlSeconds !== undefined && ttlSeconds > 0) {
      // EX flag sets the expiry in seconds alongside the value in a single command
      await this.redis.set(fullKey, serialized, "EX", ttlSeconds);
    } else {
      // No TTL requested — key persists until explicitly deleted or clear() is called
      await this.redis.set(fullKey, serialized);
    }
  }

  /** {@inheritDoc ICacheStore.delete} */
  async delete(key: string): Promise<void> {
    // DEL is a no-op in Redis when the key does not exist, so no guard is needed
    await this.redis.del(this.buildKey(key));
  }

  /** {@inheritDoc ICacheStore.clear} */
  async clear(): Promise<void> {
    if (this.keyPrefix) {
      // Use cursor-based SCAN instead of KEYS to avoid blocking Redis while
      // iterating large key sets. SCAN is O(1) per call (amortised O(N) total)
      // and yields control back to Redis between iterations.
      const pattern = `${this.keyPrefix}:*`;
      let cursor = "0";

      do {
        // Each SCAN call returns [nextCursor, matchedKeys].
        // COUNT is a hint to Redis — it may return more or fewer per call.
        const [nextCursor, keys] = await this.redis.scan(cursor, "MATCH", pattern, "COUNT", 100);
        cursor = nextCursor;

        // Delete the batch found in this iteration immediately to keep memory
        // usage flat regardless of total key count.
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      } while (cursor !== "0");
    } else {
      // No prefix — flush every key in the currently selected Redis database
      await this.redis.flushdb();
    }
  }
}
