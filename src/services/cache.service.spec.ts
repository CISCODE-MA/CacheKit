/**
 * @file cache.service.spec.ts
 *
 * Unit tests for CacheService — the primary public API for caching.
 *
 * Uses an InMemoryCacheStore as the backing adapter instead of mocking the
 * ICacheStore interface so that full integration through the real store is
 * exercised without requiring a Redis server.
 *
 * Tests cover:
 *  - get / set / delete / clear delegating correctly to the store
 *  - TTL resolution: per-call TTL overrides module default; no TTL falls back to default
 *  - has(): returns true when a live entry exists, false otherwise
 *  - wrap(): calls fn once on miss, returns cached value on subsequent calls
 */

import { InMemoryCacheStore } from "@adapters/in-memory-cache-store.adapter";
import type { ICacheStore } from "@ports/cache-store.port";

import type { CacheModuleOptions } from "../cache-kit.module";
import { CACHE_MODULE_OPTIONS, CACHE_STORE } from "../constants";
import { CacheService } from "./cache.service";

// ---------------------------------------------------------------------------
// Factory helpers
// ---------------------------------------------------------------------------

/** Build a CacheService wired with the provided store and options */
function buildService(store: ICacheStore, options: Partial<CacheModuleOptions> = {}): CacheService {
  // Manually construct with the two required inject tokens
  // (avoids spinning up a full NestJS testing module for pure unit tests)
  return new (CacheService as new (
    store: ICacheStore,
    options: CacheModuleOptions,
  ) => CacheService)(
    store,
    // Merge supplied options with a safe default (memory store, no default TTL)
    { store: "memory", ...options },
  );
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe("CacheService", () => {
  let store: InMemoryCacheStore;
  let service: CacheService;

  beforeEach(() => {
    // Use a fresh InMemoryCacheStore so tests are isolated from one another
    store = new InMemoryCacheStore();
    service = buildService(store);
  });

  // ── get ──────────────────────────────────────────────────────────────────

  describe("get()", () => {
    it("returns null when the key does not exist", async () => {
      expect(await service.get("absent")).toBeNull();
    });

    it("returns the stored value when the key exists", async () => {
      await store.set("key", { x: 1 });
      expect(await service.get("key")).toEqual({ x: 1 });
    });
  });

  // ── set ──────────────────────────────────────────────────────────────────

  describe("set()", () => {
    it("stores the value and it is retrievable via get()", async () => {
      await service.set("key", "hello");
      expect(await service.get("key")).toBe("hello");
    });

    it("uses per-call TTL when provided", async () => {
      // Spy on the store to verify the exact TTL argument forwarded
      const spy = jest.spyOn(store, "set");
      await service.set("key", "v", 60);
      expect(spy).toHaveBeenCalledWith("key", "v", 60);
    });

    it("falls back to module default TTL when no per-call TTL is given", async () => {
      // Build a service with a default TTL of 30 s
      const svcWithDefault = buildService(store, { ttl: 30 });
      const spy = jest.spyOn(store, "set");
      await svcWithDefault.set("key", "v");
      expect(spy).toHaveBeenCalledWith("key", "v", 30);
    });

    it("passes undefined TTL when neither per-call nor module default is set", async () => {
      const spy = jest.spyOn(store, "set");
      await service.set("key", "v"); // service has no default TTL
      expect(spy).toHaveBeenCalledWith("key", "v", undefined);
    });
  });

  // ── delete ───────────────────────────────────────────────────────────────

  describe("delete()", () => {
    it("removes an existing entry", async () => {
      await service.set("key", "value");
      await service.delete("key");
      expect(await service.get("key")).toBeNull();
    });

    it("does not throw when deleting a non-existent key", async () => {
      await expect(service.delete("ghost")).resolves.toBeUndefined();
    });
  });

  // ── clear ─────────────────────────────────────────────────────────────────

  describe("clear()", () => {
    it("removes all entries from the store", async () => {
      await service.set("a", 1);
      await service.set("b", 2);
      await service.clear();
      expect(await service.get("a")).toBeNull();
      expect(await service.get("b")).toBeNull();
    });
  });

  // ── has ──────────────────────────────────────────────────────────────────

  describe("has()", () => {
    it("returns true when a live entry exists", async () => {
      await service.set("key", "value");
      expect(await service.has("key")).toBe(true);
    });

    it("returns false when the key does not exist", async () => {
      expect(await service.has("missing")).toBe(false);
    });

    it("returns false after the entry has been deleted", async () => {
      await service.set("key", "value");
      await service.delete("key");
      expect(await service.has("key")).toBe(false);
    });
  });

  // ── wrap ─────────────────────────────────────────────────────────────────

  describe("wrap()", () => {
    it("calls fn and caches the result on the first call (cache miss)", async () => {
      const fn = jest.fn().mockResolvedValue({ id: 1 });

      const result = await service.wrap("key", fn);

      // fn must have been invoked exactly once
      expect(fn).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ id: 1 });
    });

    it("returns the cached value without calling fn on subsequent calls", async () => {
      const fn = jest.fn().mockResolvedValue({ id: 1 });

      // First call populates the cache
      await service.wrap("key", fn);
      // Second call must be a cache hit — fn should NOT be called again
      const result = await service.wrap("key", fn);

      expect(fn).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ id: 1 });
    });

    it("uses the per-call TTL when provided", async () => {
      const spy = jest.spyOn(store, "set");
      await service.wrap("key", async () => "val", 45);
      expect(spy).toHaveBeenCalledWith("key", "val", 45);
    });

    it("falls back to the module default TTL when no TTL is passed to wrap()", async () => {
      const svcWithDefault = buildService(store, { ttl: 120 });
      const spy = jest.spyOn(store, "set");
      await svcWithDefault.wrap("key", async () => "val");
      expect(spy).toHaveBeenCalledWith("key", "val", 120);
    });

    it("propagates errors thrown by fn without caching anything", async () => {
      const fn = jest.fn().mockRejectedValue(new Error("db failure"));

      await expect(service.wrap("key", fn)).rejects.toThrow("db failure");
      // The key must not have been cached
      expect(await service.get("key")).toBeNull();
    });
  });

  // ── DI token constants (smoke) ────────────────────────────────────────────

  describe("DI token constants", () => {
    it("CACHE_STORE token equals the expected string", () => {
      // Guards against accidental token renames
      expect(CACHE_STORE).toBe("CACHE_STORE");
    });

    it("CACHE_MODULE_OPTIONS token equals the expected string", () => {
      expect(CACHE_MODULE_OPTIONS).toBe("CACHE_MODULE_OPTIONS");
    });
  });
});
