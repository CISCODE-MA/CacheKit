/**
 * @file redis-cache-store.adapter.spec.ts
 *
 * Unit tests for RedisCacheStore — the ioredis-backed ICacheStore adapter.
 *
 * Uses ioredis-mock so no real Redis server is required. The mock exposes the
 * same API surface as real ioredis, meaning all RedisCacheStore code paths
 * (get, set+EX, del, keys+del, flushdb) are exercised against in-memory state.
 *
 * Tests cover:
 *  - Full ICacheStore contract: get, set (with and without TTL), delete, clear
 *  - Key prefix namespacing: keys are stored and retrieved with the prefix
 *  - clear() with prefix: only prefixed keys are removed
 *  - clear() without prefix: full flushdb is called
 *  - Parse-error resilience: malformed JSON stored in Redis returns null
 *  - Constructor accepts both a URL string and an existing Redis instance
 */

// ioredis-mock is a drop-in in-memory replacement for ioredis used during tests
import RedisMock from "ioredis-mock";

import { RedisCacheStore } from "./redis-cache-store.adapter";

// Derive the instance type from the constructor to avoid the namespace-as-type error
type RedisMockInstance = InstanceType<typeof RedisMock>;

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe("RedisCacheStore", () => {
  // ── Without key prefix ───────────────────────────────────────────────────

  describe("without keyPrefix", () => {
    let redis: RedisMockInstance;
    let store: RedisCacheStore;

    beforeEach(() => {
      // Create a fresh mock client before every test to avoid state leaking
      redis = new RedisMock();
      // Pass the mock client directly (exercises the "existing client" code path)
      store = new RedisCacheStore({ client: redis as never });
    });

    // ── get ─────────────────────────────────────────────────────────────

    describe("get()", () => {
      it("returns null for a key that does not exist", async () => {
        expect(await store.get("missing")).toBeNull();
      });

      it("returns the deserialized value on a cache hit", async () => {
        // Pre-populate the mock Redis directly with a serialized value
        await redis.set("key", JSON.stringify({ id: 1 }));
        const result = await store.get<{ id: number }>("key");
        expect(result).toEqual({ id: 1 });
      });

      it("returns null when the stored value is malformed JSON", async () => {
        // Store invalid JSON directly in the mock — RedisCacheStore must return null
        await redis.set("bad", "not-json{{");
        expect(await store.get("bad")).toBeNull();
      });
    });

    // ── set ─────────────────────────────────────────────────────────────

    describe("set()", () => {
      it("stores a value without TTL and it persists", async () => {
        await store.set("key", { name: "Bob" });
        // Verify the raw string is present in the mock
        const raw = await redis.get("key");
        expect(JSON.parse(raw!)).toEqual({ name: "Bob" });
      });

      it("stores a value with TTL using the EX flag", async () => {
        // Spy on the mock redis.set to confirm EX is passed
        const setSpy = jest.spyOn(redis, "set");
        await store.set("key", "value", 30);
        // EX and the TTL value must appear as arguments
        expect(setSpy).toHaveBeenCalledWith("key", '"value"', "EX", 30);
      });

      it("stores a value without TTL when ttlSeconds is 0", async () => {
        const setSpy = jest.spyOn(redis, "set");
        await store.set("key", "value", 0);
        // Should call the two-argument overload (no EX)
        expect(setSpy).toHaveBeenCalledWith("key", '"value"');
      });
    });

    // ── delete ───────────────────────────────────────────────────────────

    describe("delete()", () => {
      it("removes an existing key", async () => {
        await redis.set("key", JSON.stringify("hello"));
        await store.delete("key");
        expect(await redis.get("key")).toBeNull();
      });

      it("is a no-op when the key does not exist", async () => {
        // Must not throw even when the key is absent
        await expect(store.delete("ghost")).resolves.toBeUndefined();
      });
    });

    // ── clear (no prefix → flushdb) ──────────────────────────────────────

    describe("clear() without prefix", () => {
      it("calls flushdb and empties the entire Redis database", async () => {
        const flushSpy = jest.spyOn(redis, "flushdb");
        await redis.set("a", "1");
        await redis.set("b", "2");

        await store.clear();

        // flushdb must have been called once
        expect(flushSpy).toHaveBeenCalledTimes(1);
        // Both keys must be gone from the mock
        expect(await redis.get("a")).toBeNull();
        expect(await redis.get("b")).toBeNull();
      });
    });
  });

  // ── With key prefix ──────────────────────────────────────────────────────

  describe("with keyPrefix", () => {
    let redis: RedisMockInstance;
    let store: RedisCacheStore;
    const PREFIX = "app";

    beforeEach(() => {
      redis = new RedisMock();
      store = new RedisCacheStore({ client: redis as never, keyPrefix: PREFIX });
    });

    it("prefixes every key on set and get", async () => {
      // After set("user"), the raw Redis key must be "app:user"
      await store.set("user", { id: 42 });
      const raw = await redis.get(`${PREFIX}:user`);
      expect(JSON.parse(raw!)).toEqual({ id: 42 });
    });

    it("get() resolves using the prefixed key", async () => {
      // Pre-populate under the prefixed key, then get() without the prefix
      await redis.set(`${PREFIX}:item`, JSON.stringify("cached"));
      expect(await store.get("item")).toBe("cached");
    });

    it("delete() removes the prefixed key", async () => {
      await redis.set(`${PREFIX}:key`, JSON.stringify("v"));
      await store.delete("key");
      expect(await redis.get(`${PREFIX}:key`)).toBeNull();
    });

    // ── clear (with prefix → keys + del) ────────────────────────────────

    describe("clear() with prefix", () => {
      it("removes only keys matching the prefix pattern", async () => {
        // Populate both prefixed and non-prefixed keys
        await redis.set(`${PREFIX}:x`, "1");
        await redis.set(`${PREFIX}:y`, "2");
        await redis.set("other:z", "3"); // must NOT be deleted

        await store.clear();

        // Prefixed keys are gone
        expect(await redis.get(`${PREFIX}:x`)).toBeNull();
        expect(await redis.get(`${PREFIX}:y`)).toBeNull();
        // Non-prefixed key is untouched
        expect(await redis.get("other:z")).toBe("3");
      });

      it("does not call DEL when no prefixed keys exist", async () => {
        const delSpy = jest.spyOn(redis, "del");
        await store.clear(); // nothing under "app:*"
        expect(delSpy).not.toHaveBeenCalled();
      });
    });
  });

  // ── URL string constructor ────────────────────────────────────────────────

  describe("constructor with URL string", () => {
    it("accepts a connection URL string (exercises the string branch)", () => {
      // Passing a URL string must not throw — the constructor creates an internal client
      expect(() => new RedisCacheStore({ client: "redis://localhost:6379" })).not.toThrow();
    });
  });
});
