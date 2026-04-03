/**
 * @file cache-evict.decorator.spec.ts
 *
 * Unit tests for the @CacheEvict method decorator.
 *
 * Uses a real InMemoryCacheStore and CacheService (via CacheServiceRef) so the
 * complete eviction path is exercised end-to-end without mocking internals.
 *
 * Tests cover:
 *  - Cache entry is deleted after the method executes successfully
 *  - The method return value is preserved and returned to the caller
 *  - Cache entry is NOT deleted when the method throws (eviction is skipped)
 *  - Key template interpolation: "user:{0}" with arg "42" → entry "user:42" is evicted
 *  - Works on async methods
 *  - Works on sync methods
 */

import { InMemoryCacheStore } from "@adapters/in-memory-cache-store.adapter";
import { CacheServiceRef } from "@utils/cache-service-ref";

import type { CacheModuleOptions } from "../cache-kit.module";
import { CacheService } from "../services/cache.service";
import { CacheEvict } from "./cache-evict.decorator";

// ---------------------------------------------------------------------------
// Setup helpers
// ---------------------------------------------------------------------------

/** Wire a real CacheService backed by a fresh InMemoryCacheStore into CacheServiceRef */
function setupCacheServiceRef(): { service: CacheService; store: InMemoryCacheStore } {
  const store = new InMemoryCacheStore();
  const options: CacheModuleOptions = { store: "memory" };
  const service = new (CacheService as new (
    store: InMemoryCacheStore,
    options: CacheModuleOptions,
  ) => CacheService)(store, options);
  CacheServiceRef.set(service);
  return { service, store };
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe("@CacheEvict decorator", () => {
  let service: CacheService;

  beforeEach(() => {
    ({ service } = setupCacheServiceRef());
  });

  // ── Basic eviction ────────────────────────────────────────────────────────

  it("deletes the specified cache entry after the method executes", async () => {
    // Pre-populate the cache so we can verify it disappears
    await service.set("product:1", { price: 99 });

    class ProductService {
      @CacheEvict("product:1")
      async updateProduct() {
        return { updated: true };
      }
    }

    await new ProductService().updateProduct();

    // The entry must be gone after the decorated method ran
    expect(await service.get("product:1")).toBeNull();
  });

  it("returns the original method's return value unchanged", async () => {
    class OrderService {
      @CacheEvict("order:1")
      async createOrder() {
        return { orderId: "abc" };
      }
    }

    const result = await new OrderService().createOrder();
    // The decorator must not modify the return value
    expect(result).toEqual({ orderId: "abc" });
  });

  // ── Error path ────────────────────────────────────────────────────────────

  it("does NOT evict the cache entry when the method throws", async () => {
    // Pre-populate an entry that must survive the throw
    await service.set("safe-key", "keep-me");

    class FailingService {
      @CacheEvict("safe-key")
      async doWork(): Promise<void> {
        throw new Error("operation failed");
      }
    }

    await expect(new FailingService().doWork()).rejects.toThrow("operation failed");

    // The cache entry must be intact because eviction is skipped on failure
    expect(await service.get("safe-key")).toBe("keep-me");
  });

  // ── Key template interpolation ────────────────────────────────────────────

  it('resolves "user:{0}" with arg "42" and evicts exactly "user:42"', async () => {
    // Populate two keys to confirm only the matching one is removed
    await service.set("user:42", { name: "Alice" });
    await service.set("user:99", { name: "Bob" });

    class UserService {
      @CacheEvict("user:{0}")
      async deleteUser(id: string) {
        return { deleted: id };
      }
    }

    await new UserService().deleteUser("42");

    // "user:42" evicted, "user:99" untouched
    expect(await service.get("user:42")).toBeNull();
    expect(await service.get("user:99")).toEqual({ name: "Bob" });
  });

  // ── Sync method support ───────────────────────────────────────────────────

  it("works on synchronous methods", async () => {
    await service.set("sync-key", "cached");

    class SyncService {
      @CacheEvict("sync-key")
      doSync() {
        return "done";
      }
    }

    const result = await new SyncService().doSync();

    expect(result).toBe("done");
    expect(await service.get("sync-key")).toBeNull();
  });

  // ── After eviction, re-population works ──────────────────────────────────

  it("allows re-population of the evicted key on the next set()", async () => {
    await service.set("item:1", "old-value");

    class ItemService {
      @CacheEvict("item:1")
      async update() {
        return "updated";
      }
    }

    await new ItemService().update();
    // Evicted — now re-populate
    await service.set("item:1", "new-value");

    expect(await service.get("item:1")).toBe("new-value");
  });
});
