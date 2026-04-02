/**
 * @file cache-service-ref.ts
 *
 * Module-scoped singleton reference to the active CacheService instance.
 *
 * Why this exists:
 *  Method decorators (@Cacheable, @CacheEvict) are applied at class-definition
 *  time, long before NestJS has assembled the DI container. They cannot receive
 *  CacheService via constructor injection. Instead, CacheModule stores a reference
 *  here during `onModuleInit()`, and the decorators read it at call time.
 *
 * Lifecycle:
 *  1. App bootstraps → NestJS initialises CacheModule.
 *  2. CacheModule.onModuleInit() calls CacheServiceRef.set(cacheService).
 *  3. First method call with @Cacheable / @CacheEvict → CacheServiceRef.get() succeeds.
 *
 * Exports:
 *  - CacheServiceRef → { set, get } singleton accessor
 */

import type { CacheService } from "@services/cache.service";

// ---------------------------------------------------------------------------
// Internal holder — private to this module
// ---------------------------------------------------------------------------

/**
 * The single shared CacheService instance.
 * null until CacheModule.onModuleInit() runs.
 */
let _instance: CacheService | null = null;

// ---------------------------------------------------------------------------
// Public accessor
// ---------------------------------------------------------------------------

/**
 * Singleton accessor for the active CacheService.
 *
 * Populated by CacheModule during application bootstrap.
 * Used internally by @Cacheable and @CacheEvict at method-call time.
 */
export const CacheServiceRef = {
  /**
   * Store the CacheService instance.
   * Called once by CacheModule.onModuleInit().
   *
   * @param service - The resolved CacheService from NestJS DI
   */
  set(service: CacheService): void {
    // Overwrite any prior value — safe for hot-reload scenarios
    _instance = service;
  },

  /**
   * Retrieve the stored CacheService.
   * Throws a descriptive error if called before the module has initialised.
   *
   * @returns The active CacheService instance
   * @throws {Error} If CacheModule was not imported in the application
   */
  get(): CacheService {
    if (_instance === null) {
      throw new Error(
        "[CacheKit] CacheService is not initialised. " +
          "Make sure CacheModule.register() or CacheModule.registerAsync() " +
          "is imported in your root AppModule before using @Cacheable or @CacheEvict.",
      );
    }
    return _instance;
  },
};
