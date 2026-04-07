---
"@ciscode/cache-kit": patch
---

fix: switch build output to CommonJS and add exports field to package.json

The published package was shipping ESM-only output (`module: ESNext`) without
`"type": "module"` in package.json and without `.js` extensions on internal
imports — making the package unloadable in Node.js ESM or CJS environments.

Changes:
- `tsconfig.build.json`: switched `module` to `CommonJS` and `moduleResolution`
  to `Node10` so `dist/` emits standard CJS that Node.js loads without any
  configuration on the consumer side
- `package.json`: added `exports` field with `require` and `default` conditions
  pointing to `./dist/index.js`, ensuring both `require()` and `import` work
  correctly when consumers use the package
