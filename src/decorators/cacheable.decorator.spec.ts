/**
 * @file cacheable.decorator.spec.ts
 *
 * Unit tests for the @Cacheable method decorator.
 *
 * The decorator resolves CacheService via CacheServiceRef at runtime.
 * Tests use a real InMemoryCacheStore wired into a real CacheService so
 * the full stack is exercised without spinning up a NestJS app.
 *
 * Tests cover:
 *  - Cache hit: original method NOT called on second invocation
 *  - Cache miss: original method called and result persisted on first call
 *  - Key template interpolation: "user:{0}" with arg "42" → "user:42"
 *  - Optional TTL forwarded to the store
 *  - Works on async methods
 *  - Works on sync methods
 */

import { InMemoryCacheStore } from "@adapters/in-memory-cache-store.adapter";
import { CacheServiceRef } from "@utils/cache-service-ref";

import type { CacheModuleOptions } from "../cache-kit.module";
import { CacheService } from "../services/cache.service";

import { Cacheable } from "./cacheable.decorator";

// ---------------------------------------------------------------------------
// Setup helpers
// ---------------------------------------------------------------------------

/** Wire a real CacheService into CacheServiceRef so decorators work */
function setupCacheServiceRef(ttl?: number): CacheService {
  const store = new InMemoryCacheStore();
  const options: CacheModuleOptions =
    ttl !== undefined ? { store: "memory", ttl } : { store: "memory" };
  const service = new (CacheService as new (
    store: InMemoryCacheStore,
    options: CacheModuleOptions,
  ) => CacheService)(store, options);
  CacheServiceRef.set(service);
  return service;
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe("@Cacheable decorator", () => {
  let cacheService: CacheService;

  beforeEach(() => {
    // Fresh CacheService (and backing store) before every test
    cacheService = setupCacheServiceRef();
  });

  // ── Cache miss then hit ───────────────────────────────────────────────────

  it("calls the underlying method on the first call (cache miss)", async () => {
    const impl = jest.fn().mockResolvedValue({ id: 1 });

    class UserService {
      @Cacheable("user:1")
      async findUser() {
        return impl();
      }
    }

    const svc = new UserService();
    const result = await svc.findUser();

    // impl must have been called exactly once
    expect(impl).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ id: 1 });
  });

  it("returns the cached value and does NOT call the method on subsequent calls", async () => {
    const impl = jest.fn().mockResolvedValue({ id: 1 });

    class UserService {
      @Cacheable("user:static")
      async findUser() {
        return impl();
      }
    }

    const svc = new UserService();
    await svc.findUser(); // miss — populates cache
    const result = await svc.findUser(); // hit — must NOT call impl again

    expect(impl).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ id: 1 });
  });

  // ── Key template interpolation ────────────────────────────────────────────

  it('resolves "user:{0}" with argument "42" to cache key "user:42"', async () => {
    const impl = jest.fn().mockResolvedValue({ name: "Alice" });

    class UserService {
      @Cacheable("user:{0}")
      async findById(id: string) {
        return impl(id);
      }
    }

    const svc = new UserService();
    await svc.findById("42");
    // Second call with the same argument hits the cached entry
    const result = await svc.findById("42");

    expect(impl).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ name: "Alice" });

    // Different argument → different cache key → another miss
    await svc.findById("99");
    expect(impl).toHaveBeenCalledTimes(2);
  });

  it("stores different results for different argument values", async () => {
    const impl = jest.fn().mockImplementation(async (id: string) => ({ id }));

    class UserService {
      @Cacheable("user:{0}")
      async findById(id: string) {
        return impl(id);
      }
    }

    const svc = new UserService();
    const r1 = await svc.findById("1");
    const r2 = await svc.findById("2");

    expect(r1).toEqual({ id: "1" });
    expect(r2).toEqual({ id: "2" });
    expect(impl).toHaveBeenCalledTimes(2);
  });

  // ── TTL forwarding ────────────────────────────────────────────────────────

  it("forwards the TTL to CacheService.set()", async () => {
    const setSpy = jest.spyOn(cacheService, "set");
    const impl = jest.fn().mockResolvedValue("data");

    class DataService {
      @Cacheable("data-key", 60)
      async fetch() {
        return impl();
      }
    }

    await new DataService().fetch();
    // The explicit 60-second TTL must have been passed to set()
    expect(setSpy).toHaveBeenCalledWith("data-key", "data", 60);
  });

  // ── Sync method support ───────────────────────────────────────────────────

  it("works on synchronous methods", async () => {
    const impl = jest.fn().mockReturnValue(42);

    class CalcService {
      @Cacheable("sync-key")
      compute() {
        return impl();
      }
    }

    const svc = new CalcService();
    const r1 = await svc.compute();
    const r2 = await svc.compute();

    expect(impl).toHaveBeenCalledTimes(1);
    expect(r1).toBe(42);
    expect(r2).toBe(42);
  });
});
