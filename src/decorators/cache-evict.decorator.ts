/**
 * @file cache-evict.decorator.ts
 *
 * @CacheEvict method decorator — removes a cache entry after the method executes.
 *
 * When applied to a method, it:
 *  1. Calls the original method and awaits its result.
 *  2. Resolves the cache key by interpolating method arguments into the template.
 *  3. Deletes the matching cache entry so the next read fetches fresh data.
 *
 * The eviction happens AFTER the method succeeds — if the method throws, the
 * cache entry is left intact.
 *
 * Works with both sync and async methods. The wrapped method always returns a
 * Promise because the cache delete operation is asynchronous.
 *
 * CacheService is resolved from the singleton CacheServiceRef which is populated
 * by CacheModule.onModuleInit() — no extra injection is required in consumer classes.
 *
 * Exports:
 *  - CacheEvict → method decorator factory
 */

import { CacheServiceRef } from "@utils/cache-service-ref";
import { resolveCacheKey } from "@utils/resolve-cache-key.util";

/**
 * Cache eviction method decorator.
 *
 * @param key - Cache key template to delete after the method executes.
 *              Use `{0}`, `{1}`, … to interpolate method arguments,
 *              e.g. `"user:{0}"`.
 *
 * @example Static key eviction
 * ```typescript
 * @CacheEvict("all-products")
 * async createProduct(dto: CreateProductDto): Promise<Product> { ... }
 * ```
 *
 * @example Dynamic key with argument interpolation
 * ```typescript
 * @CacheEvict("user:{0}")
 * async updateUser(id: string, dto: UpdateUserDto): Promise<User> { ... }
 * ```
 */
export function CacheEvict(key: string): MethodDecorator {
  return (
    _target: object,
    _propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ): PropertyDescriptor => {
    // Capture the original method before replacing it
    const originalMethod = descriptor.value as (...args: unknown[]) => unknown;

    // Replace the method with a cache-evicting wrapper
    descriptor.value = async function (this: unknown, ...args: unknown[]): Promise<unknown> {
      // Resolve the CacheService from the module-level singleton
      const cacheService = CacheServiceRef.get();

      // ── Execute the original method first ──────────────────────────────
      // Wrap in Promise.resolve() to support both sync and async methods.
      // If the method throws, the error propagates and eviction is skipped
      // so we don't invalidate a cache entry for a failed operation.
      const result = await Promise.resolve(originalMethod.apply(this, args));

      // ── Evict cache entry after successful execution ───────────────────
      // Interpolate {n} placeholders using the actual call arguments
      const resolvedKey = resolveCacheKey(key, args);
      await cacheService.delete(resolvedKey);

      return result;
    };

    return descriptor;
  };
}
