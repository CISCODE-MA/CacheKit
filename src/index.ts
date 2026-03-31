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
export { ExampleKitModule } from "./example-kit.module";
export type { ExampleKitOptions, ExampleKitAsyncOptions } from "./example-kit.module";

// ============================================================================
// SERVICES (Main API)
// ============================================================================
// Export services that consumers will interact with
export { ExampleService } from "./services/example.service";

// ============================================================================
// DTOs (Public Contracts)
// ============================================================================
// DTOs are the public interface for your API
// Consumers depend on these, so they must be stable
export { CreateExampleDto } from "./dto/create-example.dto";
export { UpdateExampleDto } from "./dto/update-example.dto";

// ============================================================================
// GUARDS (For Route Protection)
// ============================================================================
// Export guards so consumers can use them in their apps
export { ExampleGuard } from "./guards/example.guard";

// ============================================================================
// DECORATORS (For Dependency Injection & Metadata)
// ============================================================================
// Export decorators for use in consumer controllers/services
export { ExampleData, ExampleParam } from "./decorators/example.decorator";

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
