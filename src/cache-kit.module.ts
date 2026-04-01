/**
 * @file cache-kit.module.ts
 *
 * CacheModule — the top-level NestJS dynamic module for CacheKit.
 *
 * Responsibilities:
 *  - Accept configuration (store type, default TTL, provider-specific options)
 *    via either a synchronous `register()` or an asynchronous `registerAsync()` call.
 *  - Instantiate the correct ICacheStore adapter (RedisCacheStore or InMemoryCacheStore)
 *    based on the `store` option and register it under the CACHE_STORE DI token.
 *  - Register CacheService and export it so consuming modules can inject it.
 *
 * Exports:
 *  - CacheModuleOptions       → synchronous configuration shape
 *  - CacheModuleAsyncOptions  → asynchronous configuration shape (useFactory / useClass / useExisting)
 *  - CacheModule              → the NestJS dynamic module class
 */

import { DynamicModule, Module, Provider, Type } from "@nestjs/common";

import { InMemoryCacheStore } from "@adapters/in-memory-cache-store.adapter";
import { RedisCacheStore } from "@adapters/redis-cache-store.adapter";
import type { RedisCacheStoreOptions } from "@adapters/redis-cache-store.adapter";
import type { ICacheStore } from "@ports/cache-store.port";

import { CACHE_MODULE_OPTIONS, CACHE_STORE } from "./constants";
import { CacheService } from "./services/cache.service";

// ---------------------------------------------------------------------------
// Configuration interfaces
// ---------------------------------------------------------------------------

/**
 * Synchronous configuration options for CacheModule.register().
 */
export interface CacheModuleOptions {
  /**
   * Which backing store to use.
   *  - "redis"  → RedisCacheStore (requires the `redis` field)
   *  - "memory" → InMemoryCacheStore (no extra config needed)
   */
  store: "redis" | "memory";

  /**
   * Default time-to-live in seconds applied to every CacheService.set() call
   * that does not supply its own TTL.
   * Omit or set to 0 for no default expiry.
   */
  ttl?: number;

  /**
   * Redis adapter configuration — required when store is "redis".
   * Ignored when store is "memory".
   */
  redis?: RedisCacheStoreOptions;
}

/**
 * Factory function type used by registerAsync's useFactory.
 * May return the options synchronously or as a Promise.
 */
export type CacheModuleOptionsFactory = () => Promise<CacheModuleOptions> | CacheModuleOptions;

/**
 * Asynchronous configuration options for CacheModule.registerAsync().
 * Supports three patterns:
 *  - useFactory  — inline factory function (most common)
 *  - useClass    — instantiate a config class per module
 *  - useExisting — reuse an already-provided config class
 */
export interface CacheModuleAsyncOptions {
  /** Providers whose tokens are passed as arguments to useFactory. */
  inject?: any[];

  /** Inline factory that resolves to CacheModuleOptions. */
  useFactory?: (...args: any[]) => Promise<CacheModuleOptions> | CacheModuleOptions;

  /**
   * Class that the module will instantiate to obtain the options.
   * The class must implement CacheModuleOptionsFactory.
   */
  useClass?: Type<{ createCacheOptions(): Promise<CacheModuleOptions> | CacheModuleOptions }>;

  /**
   * Re-use an already-provided token (class or value) as the options factory.
   * The resolved instance must implement CacheModuleOptionsFactory.
   */
  useExisting?: Type<{ createCacheOptions(): Promise<CacheModuleOptions> | CacheModuleOptions }>;

  /** Additional NestJS modules to import into the async provider scope. */
  imports?: any[];
}

// ---------------------------------------------------------------------------
// Internal factory helpers
// ---------------------------------------------------------------------------

/**
 * Build the ICacheStore provider from a resolved CacheModuleOptions object.
 * This is the single place where we decide which adapter to create.
 *
 * @param options - Fully resolved module options
 * @returns The adapter instance typed as ICacheStore
 */
function createStoreFromOptions(options: CacheModuleOptions): ICacheStore {
  if (options.store === "redis") {
    // Redis store requires connection details — throw early with a clear message
    // rather than letting ioredis surface a confusing low-level error.
    if (!options.redis) {
      throw new Error(
        '[CacheModule] store is "redis" but no redis options were provided. ' +
          "Pass a `redis` field to CacheModule.register() or CacheModule.registerAsync().",
      );
    }
    // Delegate all Redis connection and key-prefix logic to the adapter
    return new RedisCacheStore(options.redis);
  }

  // Default: in-memory store — zero dependencies, no extra options needed
  return new InMemoryCacheStore();
}

/**
 * Build the CACHE_MODULE_OPTIONS and CACHE_STORE providers for the
 * registerAsync path, handling all three async patterns.
 *
 * @param options - Async configuration options
 * @returns Array of NestJS providers ready to be registered
 */
function createAsyncProviders(options: CacheModuleAsyncOptions): Provider[] {
  // ── useFactory ─────────────────────────────────────────────────────────
  if (options.useFactory) {
    return [
      {
        // Resolve the options object asynchronously via the factory
        provide: CACHE_MODULE_OPTIONS,
        useFactory: options.useFactory,
        inject: options.inject ?? [],
      },
      {
        // Once options are resolved, build the correct store adapter
        provide: CACHE_STORE,
        useFactory: (resolvedOptions: CacheModuleOptions): ICacheStore =>
          createStoreFromOptions(resolvedOptions),
        inject: [CACHE_MODULE_OPTIONS],
      },
    ];
  }

  // ── useClass / useExisting ──────────────────────────────────────────────
  const factoryClass = (options.useClass ?? options.useExisting)!;

  const factoryProvider: Provider = options.useClass
    ? // useClass: let NestJS instantiate a new instance of this class
      { provide: factoryClass, useClass: factoryClass }
    : // useExisting: reuse a token already registered elsewhere in the module tree
      { provide: factoryClass, useExisting: options.useExisting };

  return [
    factoryProvider,
    {
      // Call createCacheOptions() on the factory instance to get the options
      provide: CACHE_MODULE_OPTIONS,
      useFactory: (factory: {
        createCacheOptions(): Promise<CacheModuleOptions> | CacheModuleOptions;
      }) => factory.createCacheOptions(),
      inject: [factoryClass],
    },
    {
      // Build the store adapter from the resolved options
      provide: CACHE_STORE,
      useFactory: (resolvedOptions: CacheModuleOptions): ICacheStore =>
        createStoreFromOptions(resolvedOptions),
      inject: [CACHE_MODULE_OPTIONS],
    },
  ];
}

// ---------------------------------------------------------------------------
// Module
// ---------------------------------------------------------------------------

/**
 * CacheModule — dynamic NestJS module providing CacheService to the host app.
 *
 * @example Synchronous registration
 * ```typescript
 * CacheModule.register({ store: 'memory', ttl: 60 })
 * CacheModule.register({ store: 'redis', ttl: 300, redis: { client: 'redis://localhost:6379' } })
 * ```
 *
 * @example Async registration with ConfigService
 * ```typescript
 * CacheModule.registerAsync({
 *   imports: [ConfigModule],
 *   inject: [ConfigService],
 *   useFactory: (cfg: ConfigService) => ({
 *     store: cfg.get('CACHE_STORE'),
 *     ttl: cfg.get<number>('CACHE_TTL'),
 *     redis: { client: cfg.get('REDIS_URL') },
 *   }),
 * })
 * ```
 */
@Module({})
export class CacheModule {
  /**
   * Register the module with synchronous, inline configuration.
   *
   * @param options - Cache configuration (store type, default TTL, redis options)
   * @returns Configured DynamicModule
   */
  static register(options: CacheModuleOptions): DynamicModule {
    const providers: Provider[] = [
      // Expose the raw options object for injection (e.g. CacheService reads ttl from here)
      {
        provide: CACHE_MODULE_OPTIONS,
        useValue: options,
      },
      // Build and register the correct adapter under the CACHE_STORE token
      {
        provide: CACHE_STORE,
        useValue: createStoreFromOptions(options),
      },
      // The main service consumers will inject
      CacheService,
    ];

    return {
      module: CacheModule,
      providers,
      // Export CacheService so the importing module's children can use it
      exports: [CacheService, CACHE_STORE],
    };
  }

  /**
   * Register the module with asynchronous configuration — useful when options
   * must come from ConfigService, environment variables resolved at runtime, etc.
   *
   * Supports useFactory, useClass, and useExisting patterns.
   *
   * @param options - Async configuration options
   * @returns Configured DynamicModule
   */
  static registerAsync(options: CacheModuleAsyncOptions): DynamicModule {
    // Build CACHE_MODULE_OPTIONS + CACHE_STORE providers depending on async pattern used
    const asyncProviders = createAsyncProviders(options);

    return {
      module: CacheModule,
      // Import any modules required by the factory (e.g. ConfigModule)
      imports: options.imports ?? [],
      providers: [...asyncProviders, CacheService],
      exports: [CacheService, CACHE_STORE],
    };
  }
}
