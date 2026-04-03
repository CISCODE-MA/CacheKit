/**
 * @file resolve-cache-key.util.spec.ts
 *
 * Unit tests for the resolveCacheKey() utility function.
 *
 * Tests cover:
 *  - Static keys (no placeholders) returned unchanged
 *  - Single-argument interpolation: {0} → args[0]
 *  - Multi-argument interpolation: {0}, {1}, {2}
 *  - "user:{0}" with argument 42 produces "user:42" (acceptance-criteria example)
 *  - Missing argument → empty string substitution
 *  - Non-string argument types (number, boolean, object) are coerced via String()
 */

import { resolveCacheKey } from "./resolve-cache-key.util";

describe("resolveCacheKey()", () => {
  // ── Static keys ───────────────────────────────────────────────────────────

  it("returns the template unchanged when no placeholders are present", () => {
    // A static key must pass through as-is
    expect(resolveCacheKey("all-products", [])).toBe("all-products");
  });

  it("returns the template unchanged when args array is empty but key is static", () => {
    expect(resolveCacheKey("config:global", [])).toBe("config:global");
  });

  // ── Single argument ───────────────────────────────────────────────────────

  it('resolves "user:{0}" with arg "42" to "user:42" (acceptance-criteria)', () => {
    // This is the exact example from the task description
    expect(resolveCacheKey("user:{0}", ["42"])).toBe("user:42");
  });

  it("substitutes a numeric argument by coercing it with String()", () => {
    expect(resolveCacheKey("user:{0}", [42])).toBe("user:42");
  });

  it("substitutes a boolean argument correctly", () => {
    expect(resolveCacheKey("flag:{0}", [true])).toBe("flag:true");
  });

  // ── Multi-argument ────────────────────────────────────────────────────────

  it("substitutes multiple placeholders in order", () => {
    expect(resolveCacheKey("post:{0}:comment:{1}", ["5", "99"])).toBe("post:5:comment:99");
  });

  it("handles three arguments", () => {
    expect(resolveCacheKey("{0}:{1}:{2}", ["a", "b", "c"])).toBe("a:b:c");
  });

  it("uses each argument only for its own index (no cross-substitution)", () => {
    // {1} must not be replaced by args[0]
    expect(resolveCacheKey("x:{1}", ["first", "second"])).toBe("x:second");
  });

  // ── Missing arguments ─────────────────────────────────────────────────────

  it("replaces a missing argument placeholder with an empty string", () => {
    // {0} present but args is empty → becomes ""
    expect(resolveCacheKey("key:{0}", [])).toBe("key:");
  });

  it("replaces a placeholder for an out-of-range index with an empty string", () => {
    // args[0] exists but {1} is out of range
    expect(resolveCacheKey("{0}:{1}", ["only-one"])).toBe("only-one:");
  });

  // ── Null / undefined arguments ────────────────────────────────────────────

  it("replaces null argument with an empty string", () => {
    expect(resolveCacheKey("key:{0}", [null])).toBe("key:");
  });

  it("replaces undefined argument with an empty string", () => {
    expect(resolveCacheKey("key:{0}", [undefined])).toBe("key:");
  });

  // ── Non-trivial key shapes ────────────────────────────────────────────────

  it("handles a repeated placeholder (same index used twice)", () => {
    // Both {0} occurrences must be substituted
    expect(resolveCacheKey("{0}-{0}", ["id"])).toBe("id-id");
  });

  it("handles a key with no colons (flat namespace)", () => {
    expect(resolveCacheKey("item{0}", ["7"])).toBe("item7");
  });
});
