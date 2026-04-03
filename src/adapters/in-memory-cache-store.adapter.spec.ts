/**
 * @file in-memory-cache-store.adapter.spec.ts
 *
 * Unit tests for InMemoryCacheStore — the Map-backed ICacheStore adapter.
 *
 * Tests cover:
 *  - Full ICacheStore contract: get, set, delete, clear
 *  - TTL expiry: entries expire after TTL elapses and are present before
 *  - Parse-error resilience: malformed JSON stored directly returns null
 *  - No-expiry behaviour: entries without TTL persist until explicitly cleared
 */

import { InMemoryCacheStore } from "./in-memory-cache-store.adapter";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Advance Date.now() by `ms` milliseconds inside a test block */
function advanceTimeBy(ms: number): void {
  jest.spyOn(Date, "now").mockReturnValue(Date.now() + ms);
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe("InMemoryCacheStore", () => {
  let store: InMemoryCacheStore;

  // Create a fresh, empty store before every test so state never leaks
  beforeEach(() => {
    store = new InMemoryCacheStore();
    jest.restoreAllMocks(); // reset Date.now() spy between tests
  });

  // ── get ──────────────────────────────────────────────────────────────────

  describe("get()", () => {
    it("returns null for a key that was never set", async () => {
      // Querying an empty store must return a cache miss
      const result = await store.get("missing");
      expect(result).toBeNull();
    });

    it("returns the stored value on a cache hit", async () => {
      // Store a plain object, then retrieve it
      await store.set("key", { name: "Alice" });
      const result = await store.get<{ name: string }>("key");
      expect(result).toEqual({ name: "Alice" });
    });

    it("returns null for a key that has been deleted", async () => {
      // Set then immediately delete — get() must return null
      await store.set("key", "value");
      await store.delete("key");
      expect(await store.get("key")).toBeNull();
    });

    it("returns null when stored JSON is malformed (parse error → null)", async () => {
      // Bypass public API and inject invalid JSON directly into the backing Map
      // to test the try/catch parse-error path
      const raw = (store as unknown as { store: Map<string, { value: string; expiresAt: null }> })
        .store;
      raw.set("bad", { value: "not-valid-json{{", expiresAt: null });

      const result = await store.get("bad");
      expect(result).toBeNull();
    });
  });

  // ── set ──────────────────────────────────────────────────────────────────

  describe("set()", () => {
    it("overwrites an existing value for the same key", async () => {
      // Second set() must replace the first
      await store.set("key", "first");
      await store.set("key", "second");
      expect(await store.get("key")).toBe("second");
    });

    it("stores primitive, array, and object values correctly", async () => {
      // Validates JSON round-trip for different value shapes
      await store.set("num", 42);
      await store.set("arr", [1, 2, 3]);
      await store.set("obj", { a: 1 });

      expect(await store.get("num")).toBe(42);
      expect(await store.get("arr")).toEqual([1, 2, 3]);
      expect(await store.get("obj")).toEqual({ a: 1 });
    });

    it("entry without TTL persists indefinitely", async () => {
      // No TTL means the entry should survive any time advance
      await store.set("persistent", "value");
      advanceTimeBy(999_999_000); // advance ~11.5 days
      expect(await store.get("persistent")).toBe("value");
    });

    it("entry with TTL=0 is treated as no expiry", async () => {
      // TTL of 0 is the same as omitting the TTL
      await store.set("key", "value", 0);
      advanceTimeBy(5_000); // advance 5 seconds
      expect(await store.get("key")).toBe("value");
    });
  });

  // ── TTL ──────────────────────────────────────────────────────────────────

  describe("TTL expiry", () => {
    it("entry is present before TTL elapses", async () => {
      // Entry set with 10-second TTL must be readable immediately
      await store.set("ttl-key", "alive", 10);
      expect(await store.get("ttl-key")).toBe("alive");
    });

    it("entry expires and returns null after TTL elapses", async () => {
      // Set with 5-second TTL, then advance time past the deadline
      await store.set("ttl-key", "bye", 5);
      advanceTimeBy(6_000); // 6 s > 5 s TTL
      expect(await store.get("ttl-key")).toBeNull();
    });

    it("expired entry is removed from the store on access (lazy eviction)", async () => {
      // After expiry + access, the backing Map must no longer hold the entry
      await store.set("ttl-key", "stale", 1);
      advanceTimeBy(2_000);
      await store.get("ttl-key"); // triggers lazy delete

      const raw = (store as unknown as { store: Map<string, unknown> }).store;
      expect(raw.has("ttl-key")).toBe(false);
    });
  });

  // ── delete ───────────────────────────────────────────────────────────────

  describe("delete()", () => {
    it("removes an existing entry", async () => {
      await store.set("key", "value");
      await store.delete("key");
      expect(await store.get("key")).toBeNull();
    });

    it("is a no-op when the key does not exist (does not throw)", async () => {
      // Deleting a missing key must succeed silently
      await expect(store.delete("ghost")).resolves.toBeUndefined();
    });
  });

  // ── clear ─────────────────────────────────────────────────────────────────

  describe("clear()", () => {
    it("removes all entries from the store", async () => {
      // Populate with several entries then clear
      await store.set("a", 1);
      await store.set("b", 2);
      await store.set("c", 3);

      await store.clear();

      // All three keys must be gone
      expect(await store.get("a")).toBeNull();
      expect(await store.get("b")).toBeNull();
      expect(await store.get("c")).toBeNull();
    });

    it("is safe to call on an empty store", async () => {
      // Clearing an empty store must not throw
      await expect(store.clear()).resolves.toBeUndefined();
    });
  });

  // ── has (via CacheService — tested through adapter directly) ─────────────

  describe("get() after clear()", () => {
    it("returns null for a key that existed before clear()", async () => {
      await store.set("key", "value");
      await store.clear();
      expect(await store.get("key")).toBeNull();
    });
  });
});
