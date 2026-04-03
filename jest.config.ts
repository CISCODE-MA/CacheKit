import type { Config } from "jest";

const config: Config = {
  testEnvironment: "node",
  clearMocks: true,
  // forceExit closes open ioredis handles left by ioredis-mock after tests finish
  forceExit: true,
  testMatch: ["<rootDir>/test/**/*.test.ts", "<rootDir>/src/**/*.spec.ts"],
  transform: {
    "^.+\\.ts$": ["ts-jest", { tsconfig: "tsconfig.json" }],
  },
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.d.ts",
    "!src/**/index.ts",
    "!src/**/*.spec.ts",
    "!src/**/*.test.ts",
    // Ignore all CSR example files
    "!src/example-kit.*",
    "!src/controllers/example.controller.ts",
    "!src/services/example.service.ts",
    "!src/entities/example.entity.ts",
    "!src/repositories/example.repository.ts",
    "!src/guards/example.guard.ts",
    "!src/decorators/example.decorator.ts",
    "!src/dto/create-example.dto.ts",
    "!src/dto/update-example.dto.ts",
  ],
  coverageDirectory: "coverage",
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@controllers/(.*)$": "<rootDir>/src/controllers/$1",
    "^@services/(.*)$": "<rootDir>/src/services/$1",
    "^@entities/(.*)$": "<rootDir>/src/entities/$1",
    "^@repos/(.*)$": "<rootDir>/src/repositories/$1",
    "^@dtos/(.*)$": "<rootDir>/src/dto/$1",
    "^@guards/(.*)$": "<rootDir>/src/guards/$1",
    "^@decorators/(.*)$": "<rootDir>/src/decorators/$1",
    "^@config/(.*)$": "<rootDir>/src/config/$1",
    "^@filters/(.*)$": "<rootDir>/src/filters/$1",
    "^@middleware/(.*)$": "<rootDir>/src/middleware/$1",
    "^@utils/(.*)$": "<rootDir>/src/utils/$1",
    "^@ports/(.*)$": "<rootDir>/src/ports/$1",
    "^@adapters/(.*)$": "<rootDir>/src/adapters/$1",
  },
};

export default config;
