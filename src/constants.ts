/**
 * @file constants.ts
 *
 * NestJS dependency-injection tokens used throughout the CacheKit module.
 *
 * Exporting tokens from this file lets both the module wiring and any
 * consumer code reference the same string without risk of typos.
 *
 * Exports:
 *  - CACHE_STORE          → token for the ICacheStore adapter provider
 *  - CACHE_MODULE_OPTIONS → token for the CacheModuleOptions configuration provider
 */

/**
 * DI token for the active ICacheStore adapter.
 *
 * The module registers whichever adapter was selected (Redis or InMemory)
 * under this token so CacheService can inject it without knowing the concrete type.
 *
 * @example
 * ```typescript
 * @Inject(CACHE_STORE) private readonly store: ICacheStore
 * ```
 */
export const CACHE_STORE = "CACHE_STORE" as const;

/**
 * DI token for the CacheModuleOptions configuration object.
 *
 * CacheService uses this to read the default TTL when the caller does not
 * supply a per-call TTL.
 *
 * @example
 * ```typescript
 * @Inject(CACHE_MODULE_OPTIONS) private readonly options: CacheModuleOptions
 * ```
 */
export const CACHE_MODULE_OPTIONS = "CACHE_MODULE_OPTIONS" as const;
