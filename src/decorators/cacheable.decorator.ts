/**
 * @file cacheable.decorator.ts
 *
 * @Cacheable method decorator — implements the cache-aside pattern automatically.
 *
 * When applied to a method, it:
 *  1. Resolves the cache key by interpolating method arguments into the template.
 *  2. Returns the cached value immediately if it exists (cache hit).
 *  3. On a cache miss, calls the original method, stores the result, and returns it.
 *
 * Works with both sync and async methods. The wrapped method always returns a Promise
 * because cache read/write operations are inherently asynchronous.
 *
 * CacheService is resolved from the singleton CacheServiceRef which is populated
 * by CacheModule.onModuleInit() — no extra injection is required in consumer classes.
 *
 * Exports:
 *  - Cacheable → method decorator factory
 */

import { CacheServiceRef } from "@utils/cache-service-ref";
import { resolveCacheKey } from "@utils/resolve-cache-key.util";

/**
 * Cache-aside method decorator.
 *
 * @param key        - Cache key template. Use `{0}`, `{1}`, … to interpolate
 *                     method arguments, e.g. `"user:{0}"`.
 * @param ttlSeconds - Optional TTL in seconds. Falls back to the module-level
 *                     default TTL configured in CacheModule.register().
 *
 * @example Static key
 * ```typescript
 * @Cacheable("all-products", 300)
 * async findAllProducts(): Promise<Product[]> { ... }
 * ```
 *
 * @example Dynamic key with argument interpolation
 * ```typescript
 * @Cacheable("user:{0}", 60)
 * async findUserById(id: string): Promise<User> { ... }
 * ```
 *
 * @example Without explicit TTL (inherits module default)
 * ```typescript
 * @Cacheable("config")
 * async getConfig(): Promise<Config> { ... }
 * ```
 */
export function Cacheable(key: string, ttlSeconds?: number): MethodDecorator {
  return (
    _target: object,
    _propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ): PropertyDescriptor => {
    // Capture the original method before replacing it
    const originalMethod = descriptor.value as (...args: unknown[]) => unknown;

    // Replace the method with a cache-aware wrapper
    descriptor.value = async function (this: unknown, ...args: unknown[]): Promise<unknown> {
      // Resolve the CacheService from the module-level singleton
      const cacheService = CacheServiceRef.get();

      // Interpolate any {n} placeholders in the key template with the actual args
      const resolvedKey = resolveCacheKey(key, args);

      // ── Cache hit ──────────────────────────────────────────────────────
      // Return the stored value immediately without calling the original method
      const cached = await cacheService.get<unknown>(resolvedKey);
      if (cached !== null) return cached;

      // ── Cache miss ─────────────────────────────────────────────────────
      // Call the original method; wrap in Promise.resolve() to handle both
      // sync methods (returns a plain value) and async methods (returns a Promise)
      const result = await Promise.resolve(originalMethod.apply(this, args));

      // Persist the result under the resolved key for future calls
      await cacheService.set(resolvedKey, result, ttlSeconds);

      return result;
    };

    return descriptor;
  };
}
