/**
 * @file cache-service-ref.spec.ts
 *
 * Unit tests for the CacheServiceRef singleton accessor.
 *
 * Tests cover:
 *  - get() throws with a descriptive message when called before set()
 *  - set() stores the instance and get() returns it
 *  - set() can overwrite an existing instance (hot-reload safety)
 */

import { InMemoryCacheStore } from "@adapters/in-memory-cache-store.adapter";

import type { CacheModuleOptions } from "../cache-kit.module";
import { CacheService } from "../services/cache.service";

import { CacheServiceRef } from "./cache-service-ref";

// ---------------------------------------------------------------------------
// Helper to build a minimal CacheService instance
// ---------------------------------------------------------------------------

function makeCacheService(): CacheService {
  const store = new InMemoryCacheStore();
  const options: CacheModuleOptions = { store: "memory" };
  return new (CacheService as new (
    store: InMemoryCacheStore,
    options: CacheModuleOptions,
  ) => CacheService)(store, options);
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe("CacheServiceRef", () => {
  // Reset the singleton before each test by setting it back to null via set()
  // We cannot set it to null directly from outside, so we reset after each test
  // by storing and restoring the internal _instance via a fresh CacheService.

  it("throws a descriptive error when get() is called before set()", () => {
    // Forcibly clear the internal instance by overwriting the module state
    // We rely on Jest module isolation — each test file gets its own module instance
    // The simplest approach: import the raw module and reset the private variable
    // via the accessor itself using an indirect reset.
    // Since we cannot set null directly, we rely on a fresh jest module reset.
    jest.resetModules();
    const { CacheServiceRef: fresh } = jest.requireActual<{
      CacheServiceRef: typeof CacheServiceRef;
    }>("./cache-service-ref");

    // get() on an uninitialised ref must throw with a helpful message
    expect(() => fresh.get()).toThrow(/CacheService is not initialised/);
  });

  it("returns the stored instance after set() is called", () => {
    const service = makeCacheService();
    CacheServiceRef.set(service);
    expect(CacheServiceRef.get()).toBe(service);
  });

  it("allows overwriting the instance (safe for hot-reload)", () => {
    const first = makeCacheService();
    const second = makeCacheService();

    CacheServiceRef.set(first);
    CacheServiceRef.set(second);

    // get() must return the most recently set instance
    expect(CacheServiceRef.get()).toBe(second);
  });
});
