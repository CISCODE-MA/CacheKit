# Copilot Instructions - NestJS API Module

> **Purpose**: Development guidelines for NestJS backend modules - reusable, well-structured API services.

---

## 🎯 Module Overview

**Package**: `@ciscode/api-module` (example)  
**Type**: NestJS Module Library  
**Framework**: NestJS 10+, Node 20+, TypeScript 5+  
**Purpose**: Reusable, production-ready NestJS modules for common backend patterns

### Typical Module Responsibilities:

- Authentication & authorization
- Data validation & transformation
- Database models & repositories
- API controllers & routes
- Business logic services
- Event handling
- Scheduled tasks
- External service integrations

---

## 🏗️ Module Structure

```
src/
  ├── modules/
  │   └── auth/
  │       ├── auth.module.ts          # Module definition
  │       ├── auth.service.ts         # Business logic
  │       ├── auth.controller.ts      # API endpoints
  │       ├── auth.service.spec.ts    # Service tests
  │       ├── auth.controller.spec.ts # Controller tests
  │       ├── dto/                    # Data Transfer Objects
  │       │   ├── login.dto.ts
  │       │   └── register.dto.ts
  │       ├── entities/               # Database entities
  │       │   └── user.entity.ts
  │       ├── guards/                 # Authentication guards
  │       │   └── jwt.guard.ts
  │       ├── strategies/             # Passport strategies
  │       │   └── jwt.strategy.ts
  │       └── interfaces/             # TypeScript interfaces
  │           └── auth.interface.ts
  ├── common/
  │   ├── decorators/                # Custom decorators
  │   ├── filters/                   # Global filters
  │   ├── interceptors/              # Global interceptors
  │   ├── pipes/                     # Validation pipes
  │   └── utils/                     # Utility functions
  ├── config/                        # Configuration
  ├── database/                      # Database setup
  └── main.ts
```

---

## 📝 Naming Conventions

**Modules**: `PascalCase`

- `UserModule`
- `AuthModule`
- `ProductModule`

**Services**: `PascalCase` + `Service` suffix

- `UserService`
- `AuthService`
- `EmailService`

**Controllers**: `PascalCase` + `Controller` suffix

- `UserController`
- `AuthController`

**DTOs**: `PascalCase` + `Dto` suffix

- `CreateUserDto`
- `LoginDto`
- `UpdateProductDto`

**Entities**: `PascalCase` + `Entity` suffix

- `User` (entity class)
- `Product` (entity class)

**Interfaces**: `PascalCase` + no suffix or `I` prefix optional

- `AuthPayload`
- `UserRepository`

**Decorators**: `camelCase` with lowercase start

- `@Public()`
- `@CurrentUser()`
- `@Roles()`

**Guards**: `PascalCase` + `Guard` suffix

- `JwtGuard`
- `RolesGuard`

**Strategies**: `PascalCase` + `Strategy` suffix

- `JwtStrategy`
- `LocalStrategy`

---

## 🧪 Testing - Backend Standards

### Coverage Target: 80%+

**Unit Tests:**

- ✅ All services (business logic)
- ✅ Guards & authentication logic
- ✅ Pipes & validation logic
- ✅ Decorators
- ✅ Utility functions

**Controller Tests:**

- ✅ Route handlers with mocked services
- ✅ Request/response validation
- ✅ Error handling (4xx, 5xx responses)

**Integration Tests (E2E):**

- ✅ Full request → response flow
- ✅ Database interactions
- ✅ External service calls (mocked)

**Skip:**

- ❌ Pure framework code (NestJS internals)
- ❌ Dependency resolution

**Test file organization:**

```
src/modules/auth/
  ├── auth.service.ts
  ├── auth.service.spec.ts       ← Same directory
  ├── auth.controller.ts
  └── auth.controller.spec.ts    ← Same directory

test/
  └── auth.e2e-spec.ts           ← Integration tests
```

---

## 📚 Documentation - Complete

### JSDoc for Services:

````typescript
/**
 * Authentication service handling login, register, and token validation
 * @example
 * ```typescript
 * const payload = await authService.validateUser(email, password);
 * const tokens = await authService.generateTokens(payload);
 * ```
 */
@Injectable()
export class AuthService {
  /**
   * Validates user credentials
   * @param email User email
   * @param password User password
   * @returns User payload if valid
   * @throws UnauthorizedException if invalid
   */
  async validateUser(email: string, password: string): Promise<UserPayload> {
    // implementation
  }
}
````

### Controller Documentation:

```typescript
/**
 * Authentication endpoints
 * @example
 * POST /auth/login
 * POST /auth/register
 * POST /auth/refresh
 */
@Controller("auth")
export class AuthController {
  /**
   * User login endpoint
   * @param loginDto Email and password
   * @returns Access and refresh tokens
   */
  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto): Promise<TokensResponse> {
    // implementation
  }
}
```

---

## 🚀 Module Development Principles

### 1. Single Responsibility

**Each service handles ONE responsibility:**

```typescript
// ✅ GOOD: Separate concerns
- AuthService (login, tokens)
- UserService (CRUD operations)
- EmailService (notifications)

// ❌ BAD: Multiple responsibilities
- UserAuthEmailService (does everything)
```

### 2. Dependency Injection

**Always inject dependencies:**

```typescript
// ✅ GOOD: Constructor injection
@Injectable()
export class AuthService {
  constructor(private userService: UserService) {}
}

// ❌ BAD: Hard-coded dependencies
export class AuthService {
  private userService = new UserService();
}
```

### 3. DTO Validation

**Always validate input with DTOs:**

```typescript
// ✅ GOOD: Validated DTO
@Post('login')
async login(@Body() loginDto: LoginDto) {
  // loginDto is validated before reaching here
}

// ❌ BAD: Unvalidated request body
@Post('login')
async login(@Body() req: any) {
  // No validation, dangerous
}
```

### 4. Error Handling

**Use NestJS exceptions:**

```typescript
// ✅ GOOD: Proper exception
if (!user) {
  throw new UnauthorizedException("Invalid credentials");
}

// ❌ BAD: Generic error
if (!user) {
  throw new Error("Failed");
}
```

### 5. Module Exports

**Export ONLY public API:**

```typescript
// src/auth/auth.module.ts
@Module({
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService], // Only export service for other modules
})
export class AuthModule {}

// ✅ GOOD: Other modules use exported service
@Module({
  imports: [AuthModule],
  providers: [SomeService], // Can inject AuthService
})
export class SomeModule {}

// ❌ BAD: Don't export internal utilities
// exports: [JwtStrategy] // FORBIDDEN
```

---

## 🔄 Workflow & Task Management

### Task-Driven Development

**1. Branch Creation:**

```bash
feature/API-MODULE-123-add-oauth
bugfix/API-MODULE-456-fix-token-validation
refactor/API-MODULE-789-extract-validation-pipe
```

**2. Task Documentation:**

Create task file:

```
docs/tasks/active/API-MODULE-123-add-oauth.md
```

**Task structure:**

```markdown
# API-MODULE-123: Add OAuth 2.0 Support

## Description

OAuth 2.0 authentication strategy for third-party login

## Implementation Details

- Strategy: GoogleStrategy.ts
- Module: Add to AuthModule
- DTO: OAuthCallbackDto

## Files Modified

- src/modules/auth/auth.module.ts
- src/modules/auth/strategies/google.strategy.ts (new)
- src/modules/auth/auth.dto.ts

## Breaking Changes

- None (backward compatible)

## Security

- Secrets managed via environment variables
- Token expiry enforced
```

**3. On Release:**

Move to:

```
docs/tasks/archive/by-release/v1.2.0/API-MODULE-123-add-oauth.md
```

### Git Flow

**Branch Structure:**

- `master` - Production releases only
- `develop` - Active development
- `feature/API-MODULE-*` - New features/modules
- `bugfix/API-MODULE-*` - Bug fixes

**Workflow:**

```bash
# 1. Branch from develop
git checkout develop
git pull origin develop
git checkout -b feature/API-MODULE-123-add-oauth

# 2. Development
# ... implement services, test, document ...

# 3. Bump version and push
npm version minor
git push origin feature/API-MODULE-123-add-oauth --tags

# 4. PR to develop
gh pr create --base develop

# 5. After merge to develop, for release:
git checkout master
git merge develop
git push origin master --tags
npm publish
```

**⚠️ IMPORTANT:**

- ✅ Feature branch from `develop`
- ✅ PR to `develop`
- ✅ `master` for releases only
- ❌ NEVER direct PRs to `master`

---

## 🎨 Service Patterns

### Composition Over Configuration:

```typescript
// ✅ GOOD: Composable modules
@Module({
  imports: [DatabaseModule, CacheModule],
  providers: [UserService, UserRepository],
  exports: [UserService],
})
export class UserModule {}

// Use in another module
@Module({
  imports: [UserModule],
})
export class AuthModule {}
```

### Repository Pattern:

```typescript
// ✅ GOOD: Use repository for data access
@Injectable()
export class UserService {
  constructor(private userRepository: UserRepository) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ email });
  }
}

// ❌ BAD: Direct database calls
@Injectable()
export class UserService {
  constructor(private db: Database) {}
}
```

---

## 📦 Versioning & Breaking Changes

### Semantic Versioning

**MAJOR** - Breaking:

- Removed endpoints
- Changed response schemas
- Removed exports

**MINOR** - New features:

- New endpoints
- New services
- New optional fields

**PATCH** - Fixes:

- Bug fixes
- Performance improvements

### Version Bump Command

**ALWAYS run before pushing:**

```bash
npm version patch  # Bug fixes (0.0.x)
npm version minor  # New features (0.x.0)
npm version major  # Breaking changes (x.0.0)

# Then push:
git push && git push --tags
```

---

## 🚫 Restrictions

**NEVER without approval:**

- Breaking changes to API routes
- Removing exported services
- Major dependency upgrades
- Database schema changes

**CAN do autonomously:**

- New services (non-breaking)
- Bug fixes
- Performance improvements
- Documentation

---

## ✅ Release Checklist

- [ ] All tests passing (unit + integration)
- [ ] Coverage >= 80%
- [ ] No ESLint/TypeScript errors
- [ ] All services documented
- [ ] API documentation updated (Swagger/OpenAPI)
- [ ] README with examples
- [ ] CHANGELOG updated
- [ ] Version bumped
- [ ] Security review done
- [ ] No hardcoded secrets
- [ ] Error handling complete

### Pre-Publish Hook

Add to `package.json`:

```json
"scripts": {
  "prepublishOnly": "npm run verify && npm run test:cov"
}
```

---

## 🎨 Code Style

**NestJS Best Practices:**

- Dependency injection always
- DTOs for all input validation
- Custom decorators for cross-cutting concerns
- Guards for authentication/authorization
- Interceptors for response transformation
- Pipes for validation

**TypeScript:**

- Strict mode enabled
- All types explicitly defined
- No `any` type

---

## 🐛 Error Handling

**Always throw NestJS HTTP exceptions:**

```typescript
// ✅ GOOD
throw new BadRequestException("Email already exists");
throw new UnauthorizedException("Invalid token");
throw new ForbiddenException("Access denied");
throw new NotFoundException("User not found");

// ❌ BAD
throw new Error("Something went wrong");
```

**Consistent error responses:**

```typescript
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

---

## 🌍 Environment Configuration

**Always use environment variables:**

```typescript
// ✅ GOOD
@Injectable()
export class ConfigService {
  dbUrl = process.env.DATABASE_URL;
  jwtSecret = process.env.JWT_SECRET;
}

// ❌ BAD
const config = {
  dbUrl: "mongodb://...",
  jwtSecret: "secret123",
};
```

**Never commit secrets:**

- Use `.env.example` for template
- Add `.env` to `.gitignore`
- Document all required variables

---

## 📖 Development Workflow

**Simple changes:**

- Implement → Test → Update docs → Update CHANGELOG

**Complex changes:**

- Discuss approach → Implement → Test → Security review → Update docs → CHANGELOG → Version bump

**When blocked:**

- **DO**: Ask immediately
- **DON'T**: Work around the problem alone
