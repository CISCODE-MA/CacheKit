// @ts-check
import eslint from "@eslint/js";
import globals from "globals";
import importPlugin from "eslint-plugin-import";
import tseslint from "typescript-eslint";

export default [
  {
    ignores: [
      "dist/**",
      "coverage/**",
      "node_modules/**",
      // Ignore all example files for CSR architecture
      "src/example-kit.*",
      "src/controllers/example.controller.ts",
      "src/services/example.service.ts",
      "src/entities/example.entity.ts",
      "src/repositories/example.repository.ts",
      "src/guards/example.guard.ts",
      "src/decorators/example.decorator.ts",
      "src/dto/create-example.dto.ts",
      "src/dto/update-example.dto.ts",
    ],
  },

  eslint.configs.recommended,

  // TypeScript ESLint (includes recommended rules)
  ...tseslint.configs.recommended,

  // Base TS rules (all TS files)
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: "./tsconfig.eslint.json",
        tsconfigRootDir: import.meta.dirname,
        ecmaVersion: "latest",
        sourceType: "module",
      },
      globals: { ...globals.node, ...globals.jest },
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin,
      import: importPlugin,
    },
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/consistent-type-imports": ["error", { prefer: "type-imports" }],

      "import/no-duplicates": "error",
      "import/order": [
        "error",
        {
          "newlines-between": "always",
          alphabetize: { order: "asc", caseInsensitive: true },
        },
      ],
    },
  },

  // Architecture boundary: core must not import Nest
  {
    files: ["src/core/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@nestjs/*"],
              message: "Do not import NestJS in core/. Keep core framework-free.",
            },
          ],
        },
      ],
    },
  },
];
