# Backend Package Creation Instructions

## Overview

This template creates production-ready NestJS npm packages with complete CI/CD, testing, and code quality enforcement.

---

## When Using This Template - CHANGES REQUIRED

### 1. **package.json** - Update These Fields

```json
{
  "name": "@ciscode/YOUR_PACKAGE_NAME",
  "version": "0.0.0",
  "description": "YOUR_PACKAGE_DESCRIPTION",
  "repository": {
    "url": "git+https://github.com/CISCODE-MA/YOUR_REPO_NAME.git"
  },
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts"
}
```

### 2. **.github/workflows/release-check.yml** - Update SonarCloud Project Key

```yaml
env:
  SONAR_PROJECT_KEY: "CISCODE-MA_YOUR_REPO_NAME"
```

### 3. **Replace Example Files** in `src/`

- `src/example-kit.*` → `src/your-package-name.*`
- `src/controllers/example.controller.ts` → Your controller
- `src/services/example.service.ts` → Your service
- `src/entities/example.entity.ts` → Your entity
- `src/repositories/example.repository.ts` → Your repository
- `src/guards/example.guard.ts` → Your guard
- `src/decorators/example.decorator.ts` → Your decorator
- `src/dto/create-example.dto.ts` → Your DTOs

### 4. **Update Documentation**

- `README.md` - Add your package description, features, and usage
- `CONTRIBUTING.md` - Already complete (template-ready)
- `CODE_OF_CONDUCT` - Already complete
- `SECURITY` - Already complete

### 5. **Set Up Environment**

- Copy `.env.example` to `.env`
- Update default values for your needs

---

## Architecture Pattern (CSR)

```
src/
├── index.ts                          # Public API exports
├── your-package-name.module.ts       # NestJS module
├── controllers/                      # HTTP request handling
├── services/                         # Business logic
├── entities/                         # Domain models
├── repositories/                     # Data access layer
├── guards/                           # Authentication/Authorization
├── decorators/                       # Custom decorators
├── dto/                              # Data Transfer Objects
├── filters/                          # Exception filters
├── middleware/                       # HTTP middleware
└── config/                           # Configuration
```

**Separation of Concerns:**

- Controllers → HTTP layer only (routing, validation)
- Services → Business logic (pure, testable)
- Repositories → Database operations (abstracted)
- Entities → Domain models (no logic)
- DTOs → Data validation (with class-validator)

---

## npm Scripts (Pre-configured)

### Development

```bash
npm run build           # Compile TypeScript
npm run build:watch    # Watch mode
```

### Quality Gates

```bash
npm run lint           # Check code with ESLint
npm run lint:fix       # Autofix lint issues
npm run format         # Check formatting
npm run format:write   # Format all files
npm run typecheck      # TypeScript type checking
```

### Testing

```bash
npm run test           # Run unit tests
npm run test:watch     # Watch mode
npm run test:cov       # With coverage report
npm run test:debug     # Debug mode
```

### Automation

```bash
npm run verify         # Full validation: lint + typecheck + test:cov
npm run prepublishOnly # Auto-runs on npm publish
```

---

## CI/CD Workflows (Automatic)

### 1. **PR Validation** (on every PR to develop)

- Runs: `npm run lint` + `npm run typecheck` + `npm run test` + `npm run build`
- Blocks merge if any check fails

### 2. **Release Check** (on PR to master)

- Full validation + coverage + SonarCloud analysis (optional)
- Verifies production readiness

### 3. **Publish** (on master branch with version tag)

- Auto-runs on `git tag v*.*.* && git push origin master --tags`
- Publishes to NPM with provenance

---

## Release & Publishing

### Versioning (Semantic)

Uses `changesets` for semantic versioning:

```bash
npm run changeset        # Create changeset
npm run version-packages # Update versions
npm run release          # Publish (CI will handle this)
```

### To Publish

1. Merge features to `develop` with changesets
2. When ready, create PR to `master`
3. Tag: `git tag v1.0.0 && git push origin master --tags`
4. CI automatically publishes to NPM

---

## Key Dependencies

### Production

- `class-transformer` - DTO serialization
- `class-validator` - Validation decorators

### Peer Dependencies (in projects using this kit)

- `@nestjs/common` - NestJS core
- `@nestjs/core` - NestJS runtime
- `@nestjs/platform-express` - HTTP server
- `reflect-metadata` - Decorator support
- `rxjs` - Reactive streams

### Dev Dependencies

- **Testing**: Jest + ts-jest + @nestjs/testing
- **Linting**: ESLint + @typescript-eslint
- **Formatting**: Prettier
- **TypeScript**: Strict mode with path aliases
- **Git Hooks**: Husky + lint-staged
- **Publishing**: semantic-release + changesets

---

## Git Hooks (Automated)

### Pre-commit

- Runs lint-staged: `prettier --write` + `eslint --fix`
- Prevents commits with formatting/lint issues

### Pre-push

- Runs `npm run typecheck` + `npm run test`
- Prevents pushing broken code

---

## Configuration Files Reference

| File                    | Purpose                                        |
| ----------------------- | ---------------------------------------------- |
| `tsconfig.json`         | TypeScript compilation (includes path aliases) |
| `tsconfig.build.json`   | Build-specific settings                        |
| `tsconfig.eslint.json`  | ESLint-specific settings                       |
| `jest.config.ts`        | Jest test runner config                        |
| `eslint.config.js`      | ESLint rules (flat config format)              |
| `.prettierrc`           | Prettier formatting rules                      |
| `.editorconfig`         | Editor settings (cross-IDE)                    |
| `.npmrc`                | NPM behavior (strict engines)                  |
| `.npmignore`            | Exclude from published package                 |
| `.env.example`          | Environment template                           |
| `.husky/`               | Git hooks setup                                |
| `lint-staged.config.js` | Pre-commit tasks                               |

---

## Common Commands for Development

```bash
# Initial setup
git clone <repo> && cd <repo> && npm install

# Development
npm run build           # Build once
npm run build:watch    # Build on file change

# Quality assurance
npm run verify          # Full validation

# Testing
npm run test:cov       # Coverage report

# Preparing release
npm run changeset      # Document changes
npm run version-packages  # Update package.json
```

---

## SonarCloud Setup (Optional)

If using SonarCloud for code quality:

1. **Repository secret** - Add `SONAR_TOKEN` to GitHub
2. **Trigger** - Manually in Actions tab or via workflow_dispatch
3. **Project Key** - Already configured in `.github/workflows/release-check.yml`

---

## Support

- **Documentation** → README.md, CONTRIBUTING.md
- **Issues** → GitHub Issues
- **Security** → See SECURITY file
