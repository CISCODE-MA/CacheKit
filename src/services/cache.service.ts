/**
 * @file cache.service.ts
 *
 * CacheService — the primary API that consumers inject into their NestJS services.
 *
 * Wraps the active ICacheStore adapter and adds:
 *  - Default TTL fall-through from module options
 *  - `has()` — existence check without deserialization overhead
 *  - `wrap()` — cache-aside pattern: return cached value or compute, store, and return it
 *
 * Exports:
 *  - CacheService → injectable NestJS service
 */

import { Inject, Injectable } from "@nestjs/common";
import type { ICacheStore } from "@ports/cache-store.port";

import type { CacheModuleOptions } from "../cache-kit.module";
import { CACHE_MODULE_OPTIONS, CACHE_STORE } from "../constants";

/**
 * Injectable caching service.
 *
 * Inject this in your own services:
 * ```typescript
 * constructor(private readonly cache: CacheService) {}
 * ```
 */
@Injectable()
export class CacheService {
  constructor(
    /** The active store adapter (Redis or InMemory) registered under CACHE_STORE */
    @Inject(CACHE_STORE)
    private readonly store: ICacheStore,

    /** Module-level options — used to read the default TTL */
    @Inject(CACHE_MODULE_OPTIONS)
    private readonly options: CacheModuleOptions,
  ) {}

  // ---------------------------------------------------------------------------
  // Core operations
  // ---------------------------------------------------------------------------

  /**
   * Retrieve a value from the cache.
   *
   * Returns null when the key is missing, the entry is expired,
   * or the stored value cannot be parsed.
   *
   * @param key - Cache key
   * @returns The cached value, or null
   *
   * @example
   * ```typescript
   * const user = await this.cache.get<User>('user:1');
   * ```
   */
  async get<T>(key: string): Promise<T | null> {
    // Delegate entirely to the adapter — no extra logic here
    return this.store.get<T>(key);
  }

  /**
   * Store a value in the cache.
   *
   * The TTL resolution order is:
   *  1. `ttlSeconds` argument (explicit per-call TTL)
   *  2. `options.ttl` supplied to CacheModule.register() (module default)
   *  3. No expiry (value lives until explicitly deleted or clear() is called)
   *
   * @param key        - Cache key
   * @param value      - Any JSON-serializable value
   * @param ttlSeconds - Optional per-call TTL; overrides the module default
   *
   * @example
   * ```typescript
   * await this.cache.set('user:1', user, 300); // 5-minute TTL
   * ```
   */
  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    // Use the per-call TTL when provided; fall back to the module-level default
    const effectiveTtl = ttlSeconds ?? this.options.ttl;
    return this.store.set<T>(key, value, effectiveTtl);
  }

  /**
   * Remove a single entry from the cache.
   * Silently succeeds if the key does not exist.
   *
   * @param key - Cache key to remove
   *
   * @example
   * ```typescript
   * await this.cache.delete('user:1');
   * ```
   */
  async delete(key: string): Promise<void> {
    return this.store.delete(key);
  }

  /**
   * Evict every entry from the cache.
   *
   * @example
   * ```typescript
   * await this.cache.clear();
   * ```
   */
  async clear(): Promise<void> {
    return this.store.clear();
  }

  // ---------------------------------------------------------------------------
  // Convenience helpers
  // ---------------------------------------------------------------------------

  /**
   * Check whether a non-expired entry exists for the given key.
   *
   * Internally performs a full get() — the value is fetched and parsed but
   * then discarded. For frequent hot-path checks consider caching the boolean
   * result if the underlying store does not have a native EXISTS command.
   *
   * @param key - Cache key to check
   * @returns true if the key exists and has not expired, false otherwise
   *
   * @example
   * ```typescript
   * if (await this.cache.has('rate-limit:user:1')) { ... }
   * ```
   */
  async has(key: string): Promise<boolean> {
    // A null result from get() means "does not exist or is expired"
    const value = await this.store.get(key);
    return value !== null;
  }

  /**
   * Cache-aside helper: return the cached value if it exists,
   * otherwise call `fn`, persist its result, and return it.
   *
   * This is the recommended way to lazily populate the cache:
   * ```
   *   cached? ──yes──▶ return cached value
   *      │
   *      no
   *      │
   *   call fn() ──▶ store result ──▶ return result
   * ```
   *
   * TTL resolution is the same as set():
   *  1. `ttlSeconds` argument
   *  2. Module-level default (`options.ttl`)
   *  3. No expiry
   *
   * @param key        - Cache key
   * @param fn         - Async factory that produces the value on a cache miss
   * @param ttlSeconds - Optional per-call TTL; overrides the module default
   * @returns The cached or freshly computed value
   *
   * @example
   * ```typescript
   * const user = await this.cache.wrap(
   *   `user:${id}`,
   *   () => this.userRepository.findById(id),
   *   60,
   * );
   * ```
   */
  async wrap<T>(key: string, fn: () => Promise<T>, ttlSeconds?: number): Promise<T> {
    // Step 1: Try the cache first
    const cached = await this.store.get<T>(key);

    // Cache hit — return the stored value without calling fn()
    if (cached !== null) return cached;

    // Cache miss — compute the fresh value by executing the factory function
    const fresh = await fn();

    // Persist the result so the next caller hits the cache
    // Use the per-call TTL when provided; fall back to the module-level default
    const effectiveTtl = ttlSeconds ?? this.options.ttl;
    await this.store.set<T>(key, fresh, effectiveTtl);

    return fresh;
  }
}
