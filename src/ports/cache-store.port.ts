/**
 * @file cache-store.port.ts
 *
 * Defines the ICacheStore port — the single contract every cache adapter must implement.
 * By depending only on this interface (not on Redis, Map, or any concrete client),
 * the rest of the codebase stays decoupled from storage details.
 *
 * Exports:
 *  - ICacheStore  → generic cache interface (get / set / delete / clear)
 */

/**
 * Generic, Promise-based cache store interface.
 *
 * All four operations are async so that both in-memory and network-backed
 * (e.g. Redis) adapters can satisfy the same contract without blocking.
 *
 * Concrete implementations live in src/adapters/:
 *  - RedisCacheStore    — backed by ioredis
 *  - InMemoryCacheStore — backed by a plain Map + Date.now() TTL
 */
export interface ICacheStore {
  /**
   * Retrieve and deserialize a cached value.
   *
   * Returns null when:
   *  - the key does not exist
   *  - the entry has expired (TTL elapsed)
   *  - the stored value cannot be parsed (malformed JSON)
   *
   * @param key - Unique cache key
   * @returns The deserialized value, or null
   */
  get<T>(key: string): Promise<T | null>;

  /**
   * Serialize and store a value under the given key.
   *
   * @param key        - Unique cache key
   * @param value      - Any JSON-serializable value
   * @param ttlSeconds - Optional time-to-live in seconds; omit or pass 0 for no expiry
   */
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;

  /**
   * Remove a single entry from the cache.
   * Silently succeeds if the key does not exist.
   *
   * @param key - Cache key to remove
   */
  delete(key: string): Promise<void>;

  /**
   * Evict every entry from the cache.
   * After this call the store is empty (equivalent to a full flush).
   */
  clear(): Promise<void>;
}
