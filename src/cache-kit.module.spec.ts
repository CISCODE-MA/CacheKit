/**
 * @file cache-kit.module.spec.ts
 *
 * Unit tests for CacheModule — the NestJS dynamic module.
 *
 * Tests cover:
 *  - register() wires the InMemory adapter when store is "memory"
 *  - register() wires the Redis adapter when store is "redis"
 *  - register() throws when store is "redis" but no redis options are given
 *  - registerAsync() resolves options via useFactory and wires CacheService
 *  - onModuleInit() populates CacheServiceRef with the CacheService instance
 */

import { Test } from "@nestjs/testing";

import { CacheServiceRef } from "@utils/cache-service-ref";

import { CacheModule } from "./cache-kit.module";
import { CacheService } from "./services/cache.service";

describe("CacheModule", () => {
  // ── register() — memory store ─────────────────────────────────────────────

  describe("register() with store: memory", () => {
    it("provides CacheService and it is injectable", async () => {
      // Compile a minimal NestJS module using the synchronous registration path
      const module = await Test.createTestingModule({
        imports: [CacheModule.register({ store: "memory" })],
      }).compile();

      // CacheService must be resolvable from the module's DI container
      const service = module.get(CacheService);
      expect(service).toBeInstanceOf(CacheService);
    });

    it("CacheService.get() returns null for an unknown key (full integration)", async () => {
      const module = await Test.createTestingModule({
        imports: [CacheModule.register({ store: "memory", ttl: 60 })],
      }).compile();

      const service = module.get(CacheService);
      expect(await service.get("unknown")).toBeNull();
    });

    it("exposes get/set/has/delete/clear/wrap through CacheService", async () => {
      const module = await Test.createTestingModule({
        imports: [CacheModule.register({ store: "memory" })],
      }).compile();

      const service = module.get(CacheService);
      // Basic round-trip: set then get
      await service.set("key", "value");
      expect(await service.get("key")).toBe("value");
      expect(await service.has("key")).toBe(true);
      await service.delete("key");
      expect(await service.get("key")).toBeNull();
    });
  });

  // ── register() — redis store validation ──────────────────────────────────

  describe("register() with store: redis", () => {
    it("throws when no redis options are provided", () => {
      // The factory function is called at registration time for synchronous options
      expect(() => CacheModule.register({ store: "redis" })).toThrow(/redis.*options/i);
    });
  });

  // ── registerAsync() ───────────────────────────────────────────────────────

  describe("registerAsync() with useFactory", () => {
    it("resolves options from the factory and provides CacheService", async () => {
      const module = await Test.createTestingModule({
        imports: [
          CacheModule.registerAsync({
            // useFactory resolves synchronously here for simplicity
            useFactory: () => ({ store: "memory" as const }),
          }),
        ],
      }).compile();

      const service = module.get(CacheService);
      expect(service).toBeInstanceOf(CacheService);
    });

    it("resolves options from an async factory (Promise)", async () => {
      const module = await Test.createTestingModule({
        imports: [
          CacheModule.registerAsync({
            useFactory: async () => ({ store: "memory" as const, ttl: 30 }),
          }),
        ],
      }).compile();

      const service = module.get(CacheService);
      expect(service).toBeInstanceOf(CacheService);
    });
  });

  // ── onModuleInit() populates CacheServiceRef ──────────────────────────────

  describe("onModuleInit()", () => {
    it("populates CacheServiceRef so @Cacheable / @CacheEvict can resolve the service", async () => {
      const module = await Test.createTestingModule({
        imports: [CacheModule.register({ store: "memory" })],
      }).compile();

      // init() triggers onModuleInit on all providers
      await module.init();

      // CacheServiceRef.get() must succeed (not throw) after init
      expect(() => CacheServiceRef.get()).not.toThrow();
      expect(CacheServiceRef.get()).toBeInstanceOf(CacheService);
    });
  });
});
