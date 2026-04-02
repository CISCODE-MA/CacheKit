/**
 * @file resolve-cache-key.util.ts
 *
 * Utility for resolving cache key templates at runtime.
 *
 * Templates support positional argument interpolation using the `{n}` syntax,
 * where `n` is the zero-based index of the method argument.
 *
 * Exports:
 *  - resolveCacheKey → replaces `{0}`, `{1}`, … in a template with actual argument values
 */

/**
 * Resolve a cache key template by substituting `{n}` placeholders with the
 * corresponding method argument values.
 *
 * Rules:
 *  - `{0}` is replaced with `String(args[0])`
 *  - `{1}` is replaced with `String(args[1])`, and so on
 *  - Placeholders that reference a missing argument are replaced with an empty string
 *
 * @param template - Key template, e.g. `"user:{0}"` or `"post:{0}:comment:{1}"`
 * @param args     - The method arguments passed at call time
 * @returns Fully resolved cache key string
 *
 * @example
 * resolveCacheKey("user:{0}", ["42"])        // → "user:42"
 * resolveCacheKey("post:{0}:comments", [7])  // → "post:7:comments"
 * resolveCacheKey("static-key", [])          // → "static-key"
 */
export function resolveCacheKey(template: string, args: unknown[]): string {
  // Replace every {n} token with the stringified value of args[n].
  // The regex matches literal braces wrapping one or more digits.
  return template.replace(/\{(\d+)\}/g, (_match, indexStr: string) => {
    const value = args[Number(indexStr)];

    // If the argument exists, coerce it to a string; otherwise leave empty
    return value !== undefined && value !== null ? String(value) : "";
  });
}
