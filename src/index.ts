import "reflect-metadata";

// ============================================================================
// PUBLIC API EXPORTS
// ============================================================================
// This file defines what consumers of your module can import.
// ONLY export what is necessary for external use.
// Keep entities, repositories, and internal implementation details private.

// ============================================================================
// MODULE
// ============================================================================
// CacheModule — the main dynamic module consumers import into their AppModule.
// Supports both synchronous (register) and asynchronous (registerAsync) setup.
export { CacheModule } from "./cache-kit.module";
export type { CacheModuleOptions, CacheModuleAsyncOptions } from "./cache-kit.module";

// ============================================================================
// DI TOKENS
// ============================================================================
// Exported so consumers can inject the raw ICacheStore directly if needed,
// or reference CACHE_STORE in their own provider definitions.
export { CACHE_STORE, CACHE_MODULE_OPTIONS } from "./constants";

// ============================================================================
// SERVICES (Main API)
// ============================================================================
// CacheService is the primary interface consumers interact with.
// Inject it anywhere via constructor injection.
export { CacheService } from "./services/cache.service";

// ============================================================================
// DECORATORS
// ============================================================================
// Method decorators for automatic caching and cache invalidation.
// Apply these to service methods — no manual CacheService injection needed.

// Cache-aside decorator: returns cached value or calls the method and stores the result
export { Cacheable } from "./decorators/cacheable.decorator";
// Cache eviction decorator: deletes the cache entry after the method executes
export { CacheEvict } from "./decorators/cache-evict.decorator";

// ============================================================================
// TYPES & INTERFACES (For TypeScript Typing)
// ============================================================================
// Export types and interfaces for TypeScript consumers
// export type { YourCustomType } from './types';

// ============================================================================
// PORTS (Abstractions / Interfaces)
// ============================================================================
// Export the ICacheStore interface so consumers can type their own adapters
// or declare injection tokens without depending on a concrete implementation.
export type { ICacheStore } from "./ports/cache-store.port";

// ============================================================================
// ADAPTERS (Concrete Cache Store Implementations)
// ============================================================================
// Both adapters implement ICacheStore — consumers choose the one that fits their stack.

// Redis-backed adapter — requires the "ioredis" peer dependency.
export { RedisCacheStore } from "./adapters/redis-cache-store.adapter";
export type { RedisCacheStoreOptions } from "./adapters/redis-cache-store.adapter";

// In-memory adapter — zero external dependencies; ideal for tests and local dev.
export { InMemoryCacheStore } from "./adapters/in-memory-cache-store.adapter";
export type { CacheEntry } from "./adapters/in-memory-cache-store.adapter";

// ============================================================================
// ❌ NEVER EXPORT (Internal Implementation)
// ============================================================================
// These should NEVER be exported from a module:
// - Entities (internal domain models)
// - Repositories (infrastructure details)
//
// Example of what NOT to export:
// ❌ export { Example } from './entities/example.entity';
// ❌ export { ExampleRepository } from './repositories/example.repository';
//
// Why? These are internal implementation details that can change.
// Consumers should only work with DTOs and Services.
