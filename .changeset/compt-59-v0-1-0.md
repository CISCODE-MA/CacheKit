---
"@ciscode/cachekit": minor
---

Initial public release of @ciscode/cachekit v0.1.0.

### Added

- `CacheModule.register()` and `CacheModule.registerAsync()` — dynamic NestJS module with in-memory and Redis store support
- `CacheService` — injectable service with `get`, `set`, `delete`, `clear`, `has`, and `wrap` (cache-aside) methods
- `@Cacheable(key, ttl?)` — method decorator for transparent cache-aside with `{n}` argument interpolation
- `@CacheEvict(key)` — method decorator to evict cache entries after successful method execution
- `ICacheStore` port — interface for custom store adapter implementations
- `InMemoryCacheStore` — zero-dependency Map-backed adapter with lazy TTL expiry
- `RedisCacheStore` — ioredis-backed adapter with key prefix and full `ICacheStore` contract
- Peer dependencies: `@nestjs/common`, `@nestjs/core`, `ioredis` (optional — only required for Redis store)
