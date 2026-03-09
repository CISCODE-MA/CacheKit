# Copilot Instructions - NestJS Developer Kit (Template)

> **Purpose**: Template for creating reusable NestJS module packages with best practices, standardized structure, and AI-friendly development workflow.

---

## 🎯 Template Overview

**Package**: Template for `@ciscode/*` NestJS modules  
**Type**: Backend NestJS Module Template  
**Purpose**: Starting point for creating authentication, database, logging, and other NestJS modules

### This Template Provides:

- CSR (Controller-Service-Repository) architecture
- Complete TypeScript configuration with path aliases
- Jest testing setup with 80% coverage threshold
- Changesets for version management
- Husky + lint-staged for code quality
- CI/CD workflows
- Copilot-friendly development guidelines

---

## 🏗️ Module Architecture

**Modules use Controller-Service-Repository (CSR) pattern for simplicity and reusability.**

> **WHY CSR for modules?** Reusable libraries need to be simple, well-documented, and easy to integrate. The 4-layer Clean Architecture is better suited for complex applications, not libraries.

```
src/
  ├── index.ts                    # PUBLIC API exports
  ├── {module-name}.module.ts     # NestJS module definition
  │
  ├── controllers/                # HTTP Layer
  │   └── example.controller.ts
  │
  ├── services/                   # Business Logic
  │   └── example.service.ts
  │
  ├── entities/                   # Domain Models
  │   └── example.entity.ts
  │
  ├── repositories/               # Data Access
  │   └── example.repository.ts
  │
  ├── guards/                     # Auth Guards
  │   └── example.guard.ts
  │
  ├── decorators/                 # Custom Decorators
  │   └── example.decorator.ts
  │
  ├── dto/                        # Data Transfer Objects
  │   └── example.dto.ts
  │
  ├── filters/                    # Exception Filters
  ├── middleware/                 # Middleware
  ├── config/                     # Configuration
  └── utils/                      # Utilities
```

**Responsibility Layers:**

| Layer            | Responsibility                           | Examples                |
| ---------------- | ---------------------------------------- | ----------------------- |
| **Controllers**  | HTTP handling, route definition          | `example.controller.ts` |
| **Services**     | Business logic, orchestration            | `example.service.ts`    |
| **Entities**     | Domain models (Mongoose/TypeORM schemas) | `example.entity.ts`     |
| **Repositories** | Data access, database queries            | `example.repository.ts` |
| **Guards**       | Authentication/Authorization             | `jwt-auth.guard.ts`     |
| **Decorators**   | Parameter extraction, metadata           | `@CurrentUser()`        |
| **DTOs**         | Input validation, API contracts          | `create-example.dto.ts` |

**Module Exports (Public API):**

```typescript
// src/index.ts - Only export what apps need to consume
export { ExampleModule } from "./example.module";

// Services (main API)
export { ExampleService } from "./services/example.service";

// DTOs (public contracts)
export { CreateExampleDto, UpdateExampleDto } from "./dto";

// Guards (for protecting routes)
export { ExampleGuard } from "./guards/example.guard";

// Decorators (for DI and metadata)
export { ExampleDecorator } from "./decorators/example.decorator";

// Types & Interfaces (for TypeScript typing)
export type { ExampleOptions, ExampleResult } from "./types";

// ❌ NEVER export entities or repositories
// export { Example } from './entities/example.entity'; // FORBIDDEN
// export { ExampleRepository } from './repositories/example.repository'; // FORBIDDEN
```

**Rationale:**

- **Entities** = internal implementation details (can change)
- **Repositories** = internal data access (apps shouldn't depend on it)
- **DTOs** = stable public contracts (apps depend on these)
- **Services** = public API (apps use methods, not internals)

---

## 📝 Naming Conventions

### Files

**Pattern**: `kebab-case` + suffix

| Type       | Example                     | Directory       |
| ---------- | --------------------------- | --------------- |
| Controller | `example.controller.ts`     | `controllers/`  |
| Service    | `example.service.ts`        | `services/`     |
| Entity     | `example.entity.ts`         | `entities/`     |
| Repository | `example.repository.ts`     | `repositories/` |
| DTO        | `create-example.dto.ts`     | `dto/`          |
| Guard      | `jwt-auth.guard.ts`         | `guards/`       |
| Decorator  | `current-user.decorator.ts` | `decorators/`   |
| Filter     | `http-exception.filter.ts`  | `filters/`      |
| Middleware | `logger.middleware.ts`      | `middleware/`   |
| Utility    | `validation.utils.ts`       | `utils/`        |
| Config     | `jwt.config.ts`             | `config/`       |

### Code Naming

- **Classes & Interfaces**: `PascalCase` → `ExampleController`, `CreateExampleDto`
- **Variables & Functions**: `camelCase` → `getUserById`, `exampleList`
- **Constants**: `UPPER_SNAKE_CASE` → `DEFAULT_TIMEOUT`, `MAX_RETRIES`
- **Enums**: Name `PascalCase`, values `UPPER_SNAKE_CASE`

```typescript
enum ExampleStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
}
```

### Path Aliases

Configured in `tsconfig.json`:

```typescript
"@/*"              → "src/*"
"@controllers/*"   → "src/controllers/*"
"@services/*"      → "src/services/*"
"@entities/*"      → "src/entities/*"
"@repos/*"         → "src/repositories/*"
"@dtos/*"          → "src/dto/*"
"@guards/*"        → "src/guards/*"
"@decorators/*"    → "src/decorators/*"
"@config/*"        → "src/config/*"
"@utils/*"         → "src/utils/*"
```

Use aliases for cleaner imports:

```typescript
import { CreateExampleDto } from "@dtos/create-example.dto";
import { ExampleService } from "@services/example.service";
import { Example } from "@entities/example.entity";
```

---

## 🧪 Testing - RIGOROUS for Modules

### Coverage Target: 80%+

**Unit Tests - MANDATORY:**

- ✅ All services (business logic)
- ✅ All utilities and helpers
- ✅ Guards and decorators
- ✅ Repository methods

**Integration Tests:**

- ✅ Controllers (full request/response)
- ✅ Module initialization
- ✅ Database operations (with test DB or mocks)

**E2E Tests:**

- ✅ Complete flows (critical user paths)

**Test file location:**

```
src/
  └── services/
      ├── example.service.ts
      └── example.service.spec.ts  ← Same directory
```

**Jest Configuration:**

```javascript
coverageThreshold: {
  global: {
    branches: 80,
    functions: 80,
    lines: 80,
    statements: 80,
  },
}
```

---

## 📚 Documentation - Complete

### JSDoc/TSDoc - ALWAYS for:

````typescript
/**
 * Creates a new example record
 * @param data - The example data to create
 * @returns The created example with generated ID
 * @throws {BadRequestException} If data is invalid
 * @example
 * ```typescript
 * const example = await service.create({ name: 'Test' });
 * ```
 */
async create(data: CreateExampleDto): Promise<Example>
````

**Required for:**

- All public functions/methods
- All exported classes
- All DTOs (with property descriptions)

### Swagger/OpenAPI - Always on controllers:

```typescript
@ApiOperation({ summary: 'Create new example' })
@ApiResponse({ status: 201, description: 'Created successfully', type: ExampleDto })
@ApiResponse({ status: 400, description: 'Invalid input' })
@Post()
async create(@Body() dto: CreateExampleDto) { }
```

---

## 🚀 Module Development Principles

### 1. Exportability

**Export ONLY public API (Services + DTOs + Guards + Decorators):**

```typescript
// src/index.ts - Public API
export { ExampleModule } from "./example.module";
export { ExampleService } from "./services/example.service";
export { CreateExampleDto, UpdateExampleDto } from "./dto";
export { ExampleGuard } from "./guards/example.guard";
export { ExampleDecorator } from "./decorators/example.decorator";
export type { ExampleOptions } from "./types";
```

**❌ NEVER export:**

- Entities (internal domain models)
- Repositories (infrastructure details)

### 2. Configuration

**Flexible module registration:**

```typescript
@Module({})
export class ExampleModule {
  static forRoot(options: ExampleModuleOptions): DynamicModule {
    return {
      module: ExampleModule,
      providers: [{ provide: "EXAMPLE_OPTIONS", useValue: options }, ExampleService],
      exports: [ExampleService],
    };
  }

  static forRootAsync(options: ExampleModuleAsyncOptions): DynamicModule {
    // Async configuration
  }
}
```

### 3. Zero Business Logic Coupling

- No hardcoded business rules
- Configurable behavior via options
- Database-agnostic (if applicable)
- Apps provide their own connections

---

## 🔄 Workflow & Task Management

### Task-Driven Development

**1. Branch Creation:**

```bash
feature/MODULE-123-add-feature
bugfix/MODULE-456-fix-issue
refactor/MODULE-789-improve-code
```

**2. Task Documentation:**
Create task file at branch start:

```
docs/tasks/active/MODULE-123-add-feature.md
```

**3. On Release:**
Move to archive:

```
docs/tasks/archive/by-release/v2.0.0/MODULE-123-add-feature.md
```

### Development Workflow

**Simple changes**:

- Read context → Implement → Update docs → **Create changeset**

**Complex changes**:

- Read context → Discuss approach → Implement → Update docs → **Create changeset**

**When blocked**:

- **DO**: Ask immediately
- **DON'T**: Generate incorrect output

---

## 📦 Versioning & Breaking Changes

### Semantic Versioning (Strict)

**MAJOR** (x.0.0) - Breaking changes:

- Changed function signatures
- Removed public methods
- Changed DTOs structure
- Changed module configuration

**MINOR** (0.x.0) - New features:

- New endpoints/methods
- New optional parameters
- New decorators/guards

**PATCH** (0.0.x) - Bug fixes:

- Internal fixes
- Performance improvements
- Documentation updates

### Changesets Workflow

**ALWAYS create a changeset for user-facing changes:**

```bash
npx changeset
```

**When to create a changeset:**

- ✅ New features
- ✅ Bug fixes
- ✅ Breaking changes
- ✅ Performance improvements
- ❌ Internal refactoring (no user impact)
- ❌ Documentation updates only
- ❌ Test improvements only

**Before completing any task:**

- [ ] Code implemented
- [ ] Tests passing
- [ ] Documentation updated
- [ ] **Changeset created** ← CRITICAL
- [ ] PR ready

**Changeset format:**

```markdown
---
"@ciscode/example-kit": minor
---

Added support for custom validators in ExampleService
```

### CHANGELOG Required

Changesets automatically generates CHANGELOG. For manual additions:

```markdown
# Changelog

## [2.0.0] - 2026-02-03

### BREAKING CHANGES

- `create()` now requires `userId` parameter
- Removed deprecated `validateExample()` method

### Added

- New `ExampleGuard` for route protection
- Support for async configuration

### Fixed

- Fixed validation edge case
```

---

## 🔐 Security Best Practices

**ALWAYS:**

- ✅ Input validation on all DTOs (class-validator)
- ✅ JWT secret from env (never hardcoded)
- ✅ Rate limiting on public endpoints
- ✅ No secrets in code
- ✅ Sanitize error messages (no stack traces in production)

**Example:**

```typescript
export class CreateExampleDto {
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  name: string;

  @IsEmail()
  email: string;
}
```

---

## 🚫 Restrictions - Require Approval

**NEVER without approval:**

- Breaking changes to public API
- Changing exported DTOs/interfaces
- Removing exported functions
- Major dependency upgrades
- Security-related changes

**CAN do autonomously:**

- Bug fixes (no breaking changes)
- Internal refactoring
- Adding new features (non-breaking)
- Test improvements
- Documentation updates

---

## ✅ Release Checklist

Before publishing:

- [ ] All tests passing (100% of test suite)
- [ ] Coverage >= 80%
- [ ] No ESLint warnings (`--max-warnings=0`)
- [ ] TypeScript strict mode passing
- [ ] All public APIs documented (JSDoc)
- [ ] README updated with examples
- [ ] Changeset created
- [ ] Breaking changes highlighted
- [ ] Integration tested with sample app

---

## 🔄 Development Workflow

### Working on Module:

1. Clone module repo
2. Create branch: `feature/TASK-123-description` from `develop`
3. Implement with tests
4. **Create changeset**: `npx changeset`
5. Verify checklist
6. Create PR → `develop`

### Testing in App:

```bash
# In module
npm link

# In app
cd ~/comptaleyes/backend
npm link @ciscode/example-kit

# Develop and test
# Unlink when done
npm unlink @ciscode/example-kit
```

---

## 🎨 Code Style

- ESLint `--max-warnings=0`
- Prettier formatting
- TypeScript strict mode
- FP for logic, OOP for structure
- Dependency injection via constructor

**Example:**

```typescript
@Injectable()
export class ExampleService {
  constructor(
    private readonly repo: ExampleRepository,
    private readonly logger: LoggerService,
  ) {}
}
```

---

## 🐛 Error Handling

**Custom domain errors:**

```typescript
export class ExampleNotFoundError extends Error {
  constructor(id: string) {
    super(`Example ${id} not found`);
    this.name = "ExampleNotFoundError";
  }
}
```

**Structured logging:**

```typescript
this.logger.error("Operation failed", {
  exampleId: id,
  reason: "validation_error",
  timestamp: new Date().toISOString(),
});
```

**NEVER silent failures:**

```typescript
// ❌ WRONG
try {
  await operation();
} catch (error) {
  // Silent failure
}

// ✅ CORRECT
try {
  await operation();
} catch (error) {
  this.logger.error("Operation failed", { error });
  throw error;
}
```

---

## 💬 Communication Style

- Brief and direct
- Focus on results
- Module-specific context
- Highlight breaking changes immediately

---

## 📋 Summary

**Module Principles:**

1. Reusability over specificity
2. Comprehensive testing (80%+)
3. Complete documentation
4. Strict versioning
5. Breaking changes = MAJOR bump + changeset
6. Zero app coupling
7. Configurable behavior

**When in doubt:** Ask, don't assume. Modules impact multiple projects.

---

_Last Updated: February 3, 2026_  
_Version: 2.0.0_
