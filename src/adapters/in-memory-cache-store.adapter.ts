/**
 * @file in-memory-cache-store.adapter.ts
 *
 * In-memory implementation of ICacheStore backed by a plain JavaScript Map.
 *
 * Behaviour:
 *  - Values are JSON-serialized on write and JSON-parsed on read, matching
 *    the Redis adapter exactly so both can be swapped transparently.
 *  - TTL is enforced lazily: an expired entry is evicted the first time it
 *    is read, rather than via a background sweep timer.
 *  - A parse failure (malformed JSON) returns null instead of throwing.
 *  - No external dependencies — suitable for unit tests, local development,
 *    or lightweight production usage that does not require persistence.
 *
 * Exports:
 *  - CacheEntry          → internal shape of stored entries (exported for tests)
 *  - InMemoryCacheStore  → the concrete in-memory adapter class
 */

import type { ICacheStore } from "@ports/cache-store.port";

// ---------------------------------------------------------------------------
// Internal data shape
// ---------------------------------------------------------------------------

/**
 * Shape of each entry held inside the backing Map.
 * Exported so that unit tests can inspect the internal store if needed.
 */
export interface CacheEntry {
  /** JSON-serialized representation of the cached value */
  value: string;

  /**
   * Absolute Unix timestamp (ms) at which this entry expires.
   * null means the entry never expires.
   */
  expiresAt: number | null;
}

// ---------------------------------------------------------------------------
// Adapter
// ---------------------------------------------------------------------------

/**
 * In-memory adapter for the ICacheStore port.
 *
 * Usage:
 * ```typescript
 * const store = new InMemoryCacheStore();
 * await store.set("session:abc", { userId: 1 }, 60); // expires in 60 s
 * const session = await store.get<Session>("session:abc");
 * ```
 */
export class InMemoryCacheStore implements ICacheStore {
  /**
   * The backing store.
   * Maps every cache key to its serialized value and optional expiry timestamp.
   */
  private readonly store = new Map<string, CacheEntry>();

  // ---------------------------------------------------------------------------
  // ICacheStore implementation
  // ---------------------------------------------------------------------------

  /** {@inheritDoc ICacheStore.get} */
  async get<T>(key: string): Promise<T | null> {
    // Look up the entry — undefined means the key was never set or was deleted
    const entry = this.store.get(key);

    // Key does not exist in the store
    if (entry === undefined) return null;

    // Lazy TTL expiry: check whether the entry has passed its deadline.
    // Date.now() returns the current time in milliseconds.
    if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
      // Remove the stale entry and treat the lookup as a cache miss
      this.store.delete(key);
      return null;
    }

    // Deserialize the stored JSON string back to the caller's expected type.
    // Return null on malformed JSON instead of propagating a SyntaxError.
    try {
      return JSON.parse(entry.value) as T;
    } catch {
      // Parse failure — treat as a cache miss
      return null;
    }
  }

  /** {@inheritDoc ICacheStore.set} */
  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    // Compute the absolute expiry timestamp from the relative TTL.
    // Multiply seconds by 1 000 to convert to milliseconds for Date.now() comparison.
    // null signals "no expiry" so the entry lives until deleted or clear() is called.
    const expiresAt =
      ttlSeconds !== undefined && ttlSeconds > 0
        ? Date.now() + ttlSeconds * 1_000
        : null;

    // Serialize the value to a JSON string before storing to match Redis adapter behaviour
    this.store.set(key, {
      value: JSON.stringify(value),
      expiresAt,
    });
  }

  /** {@inheritDoc ICacheStore.delete} */
  async delete(key: string): Promise<void> {
    // Map.delete is a no-op when the key does not exist — no guard required
    this.store.delete(key);
  }

  /** {@inheritDoc ICacheStore.clear} */
  async clear(): Promise<void> {
    // Remove every entry from the backing Map in O(1)
    this.store.clear();
  }
}
