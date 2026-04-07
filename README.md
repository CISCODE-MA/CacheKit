# @ciscode/cachekit

> Production-ready NestJS caching module with pluggable store adapters, a
> cache-aside service, and method-level `@Cacheable` / `@CacheEvict` decorators.

---

## 📦 Installation

```bash
npm install @ciscode/cachekit
```

### Peer dependencies

Install the peers that match what your app already uses:

```bash
# Always required
npm install @nestjs/common @nestjs/core

# Required when using the Redis store
npm install ioredis
```

---

## 🚀 Quick Start

### 1. Register with an in-memory store (zero config)

```typescript
import { Module } from "@nestjs/common";
import { CacheModule } from "@ciscode/cachekit";

@Module({
  imports: [
    CacheModule.register({
      store: "memory",
      ttl: 60, // default TTL in seconds (optional)
    }),
  ],
})
export class AppModule {}
```

### 2. Register with a Redis store

```typescript
import { Module } from "@nestjs/common";
import { CacheModule } from "@ciscode/cachekit";

@Module({
  imports: [
    CacheModule.register({
      store: "redis",
      ttl: 300,
      redis: {
        client: "redis://localhost:6379",
        keyPrefix: "myapp:",
      },
    }),
  ],
})
export class AppModule {}
```

### 3. Register asynchronously (with ConfigService)

```typescript
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { CacheModule } from "@ciscode/cachekit";

@Module({
  imports: [
    ConfigModule.forRoot(),
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        store: cfg.get<"redis" | "memory">("CACHE_STORE", "memory"),
        ttl: cfg.get<number>("CACHE_TTL", 60),
        redis: {
          client: cfg.get<string>("REDIS_URL", "redis://localhost:6379"),
          keyPrefix: cfg.get<string>("CACHE_PREFIX", "app:"),
        },
      }),
    }),
  ],
})
export class AppModule {}
```

---

## 🔧 CacheService API

Inject `CacheService` wherever you need direct cache access:

```typescript
import { Injectable } from "@nestjs/common";
import { CacheService } from "@ciscode/cachekit";

@Injectable()
export class ProductsService {
  constructor(private readonly cache: CacheService) {}

  async getProduct(id: string) {
    // Manual cache-aside pattern
    const cached = await this.cache.get<Product>(`product:${id}`);
    if (cached) return cached;

    const product = await this.db.findProduct(id);
    await this.cache.set(`product:${id}`, product, 120); // TTL = 120 s
    return product;
  }

  async deleteProduct(id: string) {
    await this.db.deleteProduct(id);
    await this.cache.delete(`product:${id}`);
  }

  // wrap() — cache-aside in one call
  async getAll(): Promise<Product[]> {
    return this.cache.wrap(
      "products:all",
      () => this.db.findAllProducts(),
      300, // TTL = 300 s
    );
  }
}
```

### Full method reference

| Method   | Signature                                 | Description                                               |
| -------- | ----------------------------------------- | --------------------------------------------------------- |
| `get`    | `get<T>(key): Promise<T \| null>`         | Retrieve a value; returns `null` on miss or expiry        |
| `set`    | `set<T>(key, value, ttl?): Promise<void>` | Store a value; `ttl` overrides module default             |
| `delete` | `delete(key): Promise<void>`              | Remove a single entry                                     |
| `clear`  | `clear(): Promise<void>`                  | Remove all entries (scoped to key prefix for Redis)       |
| `has`    | `has(key): Promise<boolean>`              | Return `true` if key exists and has not expired           |
| `wrap`   | `wrap<T>(key, fn, ttl?): Promise<T>`      | Return cached value or call `fn`, cache result, return it |

---

## 🎯 Method Decorators

### `@Cacheable(key, ttl?)`

Cache the return value of a method automatically (cache-aside). The decorated
method is only called on a cache miss; subsequent calls return the stored value.

**Key templates** — use `{0}`, `{1}`, … to interpolate method arguments:

```typescript
import { Injectable } from "@nestjs/common";
import { Cacheable } from "@ciscode/cachekit";

@Injectable()
export class UserService {
  // Static key — same result cached for all calls
  @Cacheable("users:all", 300)
  async findAll(): Promise<User[]> {
    return this.db.findAllUsers();
  }

  // Dynamic key — "user:42" for userId = 42
  @Cacheable("user:{0}", 120)
  async findById(userId: number): Promise<User> {
    return this.db.findUser(userId);
  }

  // Multi-argument key — "org:5:user:99"
  @Cacheable("org:{0}:user:{1}", 60)
  async findByOrg(orgId: number, userId: number): Promise<User> {
    return this.db.findUserInOrg(orgId, userId);
  }
}
```

### `@CacheEvict(key)`

Evict (delete) a cache entry after the decorated method completes successfully.
If the method throws, the entry is **not** evicted.

```typescript
import { Injectable } from "@nestjs/common";
import { CacheEvict } from "@ciscode/cachekit";

@Injectable()
export class UserService {
  // Evict "users:all" whenever a user is created
  @CacheEvict("users:all")
  async createUser(dto: CreateUserDto): Promise<User> {
    return this.db.createUser(dto);
  }

  // Evict the specific user entry — "user:42" for userId = 42
  @CacheEvict("user:{0}")
  async updateUser(userId: number, dto: UpdateUserDto): Promise<User> {
    return this.db.updateUser(userId, dto);
  }

  // Evict on delete
  @CacheEvict("user:{0}")
  async deleteUser(userId: number): Promise<void> {
    await this.db.deleteUser(userId);
  }
}
```

---

## ⚙️ Configuration reference

### `CacheModuleOptions` (synchronous)

| Field   | Type                     | Required              | Default     | Description                                  |
| ------- | ------------------------ | --------------------- | ----------- | -------------------------------------------- |
| `store` | `"memory" \| "redis"`    | ✅                    | —           | Backing store adapter                        |
| `ttl`   | `number`                 | ❌                    | `undefined` | Default TTL in seconds for all `set()` calls |
| `redis` | `RedisCacheStoreOptions` | When `store: "redis"` | —           | Redis connection config                      |

### `RedisCacheStoreOptions`

| Field       | Type              | Required | Description                                          |
| ----------- | ----------------- | -------- | ---------------------------------------------------- |
| `client`    | `string \| Redis` | ✅       | Redis URL (`redis://…`) or existing ioredis instance |
| `keyPrefix` | `string`          | ❌       | Prefix for all keys, e.g. `"myapp:"`                 |

---

## 🏗️ Architecture

```
src/
  ├── index.ts                                  # Public API exports
  ├── cache-kit.module.ts                       # CacheModule (dynamic NestJS module)
  ├── constants.ts                              # DI tokens: CACHE_STORE, CACHE_MODULE_OPTIONS
  │
  ├── ports/
  │   └── cache-store.port.ts                  # ICacheStore interface
  │
  ├── adapters/
  │   ├── in-memory-cache-store.adapter.ts     # Map-backed adapter (no deps)
  │   └── redis-cache-store.adapter.ts         # ioredis-backed adapter
  │
  ├── services/
  │   └── cache.service.ts                     # CacheService (public API)
  │
  ├── decorators/
  │   ├── cacheable.decorator.ts               # @Cacheable
  │   └── cache-evict.decorator.ts             # @CacheEvict
  │
  └── utils/
      ├── cache-service-ref.ts                 # Singleton holder for decorators
      └── resolve-cache-key.util.ts            # {0}, {1} key template resolver
```

---

## 🔐 Security notes

- Never pass credentials directly in source code — use environment variables or `ConfigService`
- The Redis `keyPrefix` isolates cache entries from other apps sharing the same instance
- `clear()` without a key prefix will `FLUSHDB` the entire Redis database — use prefixes in production

---

## 📄 License

MIT © [CisCode](https://github.com/CISCODE-MA)

### 3. Define DTOs

```typescript
// src/dto/create-example.dto.ts
import { IsString, IsNotEmpty } from "class-validator";

export class CreateExampleDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}
```

### 4. Export Public API

```typescript
// src/index.ts
export { ExampleKitModule } from "./example-kit.module";
export { ExampleService } from "./services/example.service";
export { CreateExampleDto } from "./dto/create-example.dto";
```

## 📝 Scripts

```bash
# Development
npm run build          # Build the package
npm run build:watch    # Build in watch mode
npm run typecheck      # TypeScript type checking

# Testing
npm test               # Run tests
npm run test:watch     # Run tests in watch mode
npm run test:cov       # Run tests with coverage

# Code Quality
npm run lint           # Run ESLint
npm run format         # Check formatting
npm run format:write   # Fix formatting

# Release
npx changeset          # Create a changeset
npm run release        # Publish to npm (CI does this)
```

## 🔄 Release Workflow

This template uses [Changesets](https://github.com/changesets/changesets) for version management.

### 1. Create a Feature

```bash
git checkout develop
git checkout -b feature/my-feature
# Make your changes
```

### 2. Create a Changeset

```bash
npx changeset
```

Select the change type:

- **patch** - Bug fixes
- **minor** - New features (backwards compatible)
- **major** - Breaking changes

### 3. Commit and PR

```bash
git add .
git commit -m "feat: add new feature"
git push origin feature/my-feature
# Create PR → develop
```

### 4. Release

- Automation opens "Version Packages" PR
- Merge to `master` to publish

## 🧪 Testing

Tests are MANDATORY for all public APIs.

```typescript
// src/services/example.service.spec.ts
describe("ExampleService", () => {
  let service: ExampleService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [ExampleService],
    }).compile();

    service = module.get(ExampleService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should process data correctly", async () => {
    const result = await service.doSomething("test");
    expect(result).toBe("Processed: test");
  });
});
```

**Coverage threshold: 80%**

## 📚 Path Aliases

Configured in `tsconfig.json`:

```typescript
import { ExampleService } from "@services/example.service";
import { CreateExampleDto } from "@dtos/create-example.dto";
import { Example } from "@entities/example.entity";
import { ExampleRepository } from "@repos/example.repository";
```

Available aliases:

- `@/*` → `src/*`
- `@controllers/*` → `src/controllers/*`
- `@services/*` → `src/services/*`
- `@entities/*` → `src/entities/*`
- `@repos/*` → `src/repositories/*`
- `@dtos/*` → `src/dto/*`
- `@guards/*` → `src/guards/*`
- `@decorators/*` → `src/decorators/*`
- `@config/*` → `src/config/*`
- `@utils/*` → `src/utils/*`

## 🔒 Security Best Practices

- ✅ Input validation on all DTOs (class-validator)
- ✅ Environment variables for secrets
- ✅ No hardcoded credentials
- ✅ Proper error handling
- ✅ Rate limiting on public endpoints

## 🤖 AI-Friendly Development

This template includes comprehensive Copilot instructions in `.github/copilot-instructions.md`:

- Module architecture guidelines
- Naming conventions
- Testing requirements
- Documentation standards
- Export patterns
- Security best practices

## 📖 Documentation

- [Architecture](docs/ARCHITECTURE.md) - Detailed architecture overview
- [Release Process](docs/RELEASE.md) - How to release versions
- [Copilot Instructions](.github/copilot-instructions.md) - AI development guidelines

## 🛠️ Customization

1. **Rename the module**: Update `package.json` name
2. **Update description**: Modify `package.json` description
3. **Configure exports**: Edit `src/index.ts`
4. **Add dependencies**: Update `peerDependencies` and `dependencies`
5. **Customize structure**: Add/remove directories as needed

## ⚠️ Important Notes

### What to Export

✅ **DO export**:

- Module
- Services
- DTOs
- Guards
- Decorators
- Types/Interfaces

❌ **DON'T export**:

- Entities
- Repositories

Entities and repositories are internal implementation details.

### Versioning

- **MAJOR** (x.0.0) - Breaking changes
- **MINOR** (0.x.0) - New features (backwards compatible)
- **PATCH** (0.0.x) - Bug fixes

## 📋 Checklist Before Publishing

- [ ] All tests passing (80%+ coverage)
- [ ] No ESLint warnings
- [ ] TypeScript strict mode passing
- [ ] All public APIs documented (JSDoc)
- [ ] README updated
- [ ] Changeset created
- [ ] Breaking changes documented
- [ ] `.env.example` updated (if needed)

## 📄 License

MIT

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md)

## 🆘 Support

- [Documentation](docs/)
- [GitHub Issues](https://github.com/CISCODE-MA/NestJs-DeveloperKit/issues)
- [Discussions](https://github.com/CISCODE-MA/NestJs-DeveloperKit/discussions)

---

**Made with ❤️ by CisCode**
