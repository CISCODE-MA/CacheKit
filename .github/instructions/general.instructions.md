# General Instructions - NestJS API Module

> **Last Updated**: February 2026

---

## 📦 Package Overview

### What is this module?

This is a production-ready NestJS module providing reusable backend services, controllers, and data models for modern applications.

**Type**: NestJS Module Library  
**Framework**: NestJS 10+, TypeScript 5+  
**Runtime**: Node 20+  
**Build**: tsup  
**Distribution**: NPM package  
**License**: MIT

### Key Characteristics

| Characteristic   | Description                                                      |
| ---------------- | ---------------------------------------------------------------- |
| **Architecture** | Modular, service-based, dependency injection pattern             |
| **Database**     | TypeORM/Prisma ready, repository pattern                         |
| **TypeScript**   | Fully typed, strict mode enabled                                 |
| **Validation**   | DTO-based input validation with class-validator                  |
| **Testing**      | Unit + integration tests, target 80%+ coverage                   |
| **API**          | REST endpoints with OpenAPI/Swagger documentation                |
| **Security**     | JWT authentication, role-based authorization, input sanitization |

---

## 🏗️ Module Architecture

```
┌─────────────────────────────────────────┐
│        CONTROLLER LAYER                 │
│  ┌──────────────────────────────────┐   │
│  │    HTTP Request Handlers         │   │
│  │    - Route Handlers              │   │
│  │    - Request Validation          │   │
│  │    - Response Transformation     │   │
│  └──────────┬───────────────────────┘   │
└─────────────┼───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│         SERVICE LAYER                   │
│  ┌──────────────────────────────────┐   │
│  │    Business Logic                │   │
│  │    - Use Cases                   │   │
│  │    - Data Processing             │   │
│  │    - Third-party Integration     │   │
│  └──────────┬───────────────────────┘   │
└─────────────┼───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│      REPOSITORY LAYER                   │
│  ┌──────────────────────────────────┐   │
│  │    Data Access                   │   │
│  │    - Database Queries            │   │
│  │    - CRUD Operations             │   │
│  └──────────┬───────────────────────┘   │
└─────────────┼───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│        DATABASE LAYER                   │
│  ┌──────────────────────────────────┐   │
│  │    ORM (TypeORM/Prisma)          │   │
│  │    - Models/Entities             │   │
│  │    - Migrations                  │   │
│  └──────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

---

## 📁 File Structure

```
src/
├── modules/
│   ├── user/                       # User module
│   │   ├── user.module.ts
│   │   ├── user.service.ts
│   │   ├── user.controller.ts
│   │   ├── user.service.spec.ts
│   │   ├── user.controller.spec.ts
│   │   ├── dto/
│   │   │   ├── create-user.dto.ts
│   │   │   └── update-user.dto.ts
│   │   ├── entities/
│   │   │   └── user.entity.ts
│   │   ├── repositories/
│   │   │   └── user.repository.ts
│   │   └── interfaces/
│   │       └── user.interface.ts
│   └── auth/                       # Auth module
│       ├── auth.module.ts
│       ├── auth.service.ts
│       ├── auth.controller.ts
│       ├── dto/
│       ├── guards/
│       ├── strategies/
│       └── auth.service.spec.ts
├── common/
│   ├── decorators/               # Custom decorators
│   ├── filters/                  # Global exception filters
│   ├── interceptors/             # Response interceptors
│   ├── pipes/                    # Validation pipes
│   ├── guards/                   # Global guards
│   └── utils/                    # Helper functions
├── config/                       # Configuration service
├── database/                     # Database setup
│   ├── migrations/
│   └── seeds/
├── app.module.ts                 # Root module
└── main.ts                       # Entry point
```

---

## 📝 Coding Standards

### Service Patterns

```typescript
// ✅ Functional services with explicit types
@Injectable()
export class UserService {
  constructor(private userRepository: UserRepository) {}

  async findById(id: string): Promise<User> {
    return this.userRepository.findById(id);
  }
}

// ❌ Services with implicit types
@Injectable()
export class UserService {
  async findById(id) {
    return this.repository.findById(id);
  }
}
```

### DTO Validation

```typescript
// ✅ Strong validation with decorators
export class CreateUserDto {
  @IsEmail()
  @MaxLength(255)
  email: string;

  @MinLength(8)
  @Matches(/[A-Z]/, { message: "Password must contain uppercase" })
  password: string;
}

// ❌ Weak validation or no validation
export class CreateUserDto {
  email: string;
  password: string;
}
```

### TypeScript Strictness

```typescript
// ✅ Explicit types and return values
async createUser(dto: CreateUserDto): Promise<User> {
  const user = new User();
  user.email = dto.email;
  return this.repository.save(user);
}

// ❌ Implicit types
async createUser(dto) {
  return this.repository.save(dto);
}
```

---

## 🔐 Module Exports & Imports

### Proper Module Setup

```typescript
// ✅ GOOD: Export only public services
@Module({
  controllers: [UserController],
  providers: [UserService, UserRepository],
  exports: [UserService], // Only service exported
})
export class UserModule {}

// In another module
@Module({
  imports: [UserModule],
  providers: [SomeService], // Can inject UserService
})
export class SomeModule {}

// ❌ BAD: Exporting internal implementations
@Module({
  exports: [UserRepository, UserService, InternalHelper],
})
export class UserModule {}
```

---

## 🎨 Styling Philosophy

### No Frontend Styling Needed

NestJS modules are backend APIs - styling only applies to documentation and code formatting.

---

## 🔐 Security Standards

### Authentication & Authorization

```typescript
// ✅ GOOD: Guards for protected routes
@Controller('users')
export class UserController {
  @Get(':id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('admin', 'user')
  getUser(@Param('id') id: string) {
    return this.userService.findById(id);
  }
}

// ❌ BAD: No authentication
@Get(':id')
getUser(@Param('id') id: string) {
  return this.userService.findById(id);
}
```

### Input Validation

```typescript
// ✅ GOOD: Validate all inputs
@Post()
@UseGuards(JwtGuard)
create(@Body() createUserDto: CreateUserDto) {
  return this.userService.create(createUserDto);
}

// ❌ BAD: No validation
@Post()
create(@Body() body: any) {
  return this.userService.create(body);
}
```

### Secret Management

```typescript
// ✅ GOOD: Environment variables
const jwtSecret = process.env.JWT_SECRET;

// ❌ BAD: Hardcoded secrets
const jwtSecret = "my-super-secret-key";
```

---

## 📖 Environment Configuration

### .env.example Template

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
DATABASE_SSL=false

# API
API_PORT=3000
API_PREFIX=/api

# Authentication
JWT_SECRET=your-secret-key-here
JWT_EXPIRATION=7d
REFRESH_TOKEN_EXPIRATION=30d

# External Services
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_FROM=noreply@example.com

# Environment
NODE_ENV=development
LOG_LEVEL=debug
```

---

## 📖 Development Workflow

### Initialization

1. Create `.env` from `.env.example`
2. Install dependencies: `npm install`
3. Run database migrations: `npm run db:migrate`
4. Start development server: `npm run start:dev`

### Typical Development Loop

```bash
# 1. Create feature branch
git checkout develop
git pull origin develop
git checkout -b feature/API-MODULE-123

# 2. Develop
# - Create DTOs
# - Implement service
# - Write tests
# - Update documentation

# 3. Build & test
npm run build
npm run test:cov

# 4. Commit & push
git add .
git commit -m "feat: add new API endpoint"
git push origin feature/API-MODULE-123

# 5. Create PR
gh pr create --base develop
```

---

## 🧪 Testing Requirements

### Coverage Targets

- **Services**: 90% coverage
- **Controllers**: 80% coverage
- **Utilities**: 85% coverage
- **Overall**: 80%+ minimum

### Test Types

- **Unit Tests**: Service logic in isolation
- **Integration Tests**: Service + Repository interactions
- **E2E Tests**: Full API request-response cycle

---

## 📚 Documentation Requirements

All exported services must include:

- JSDoc comments with `@example`
- Type definitions for all parameters
- Exception descriptions
- Usage examples

````typescript
/**
 * Creates a new user in the system
 * @param createUserDto User data
 * @returns Created user
 * @throws BadRequestException if email already exists
 * @throws InternalServerErrorException on database error
 * @example
 * ```typescript
 * const user = await userService.create({
 *   email: 'user@example.com',
 *   password: 'SecurePass123'
 * });
 * ```
 */
async create(createUserDto: CreateUserDto): Promise<User> {
  // implementation
}
````

---

## ✅ Quality Checklist

Before committing code:

- [ ] TypeScript strict mode passes
- [ ] All tests pass
- [ ] Coverage >= 80%
- [ ] ESLint clean
- [ ] No hardcoded secrets
- [ ] DTOs properly validated
- [ ] Services documented
- [ ] Error handling complete
- [ ] Security review done
