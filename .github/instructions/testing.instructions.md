# Testing Instructions - NestJS API Module

> **Last Updated**: February 2026  
> **Testing Framework**: Jest or Vitest  
> **Coverage Target**: 80%+

---

## 🎯 Testing Philosophy

### Test User Behavior, Not Implementation

**✅ Test what users see and do:**

```typescript
it("should return 401 Unauthorized for invalid token", async () => {
  const response = await request(app.getHttpServer())
    .get("/users")
    .set("Authorization", "Bearer invalid-token");

  expect(response.status).toBe(401);
  expect(response.body.message).toContain("Invalid token");
});
```

**❌ Don't test implementation details:**

```typescript
it("should call userRepository.find()", () => {
  // Testing internal method calls is brittle
  expect(repository.find).toHaveBeenCalled();
});
```

---

## 📊 Coverage Targets

| Layer            | Minimum Coverage | Priority    |
| ---------------- | ---------------- | ----------- |
| **Services**     | 90%+             | 🔴 Critical |
| **Controllers**  | 80%+             | 🟡 High     |
| **Repositories** | 85%+             | 🟡 High     |
| **Guards**       | 90%+             | 🔴 Critical |
| **Pipes**        | 85%+             | 🟡 High     |
| **Utils**        | 85%+             | 🟡 High     |

**Overall Target**: 80%+

---

## 📁 Test File Organization

### File Placement

Tests live next to implementations:

```
src/modules/user/
  ├── user.service.ts
  ├── user.service.spec.ts       ← Same directory
  ├── user.controller.ts
  └── user.controller.spec.ts    ← Same directory

test/
  ├── user.e2e-spec.ts           ← Integration tests
  └── auth.e2e-spec.ts
```

### Naming Convention

| Code File            | Test File                 |
| -------------------- | ------------------------- |
| `user.service.ts`    | `user.service.spec.ts`    |
| `user.controller.ts` | `user.controller.spec.ts` |
| `jwt.guard.ts`       | `jwt.guard.spec.ts`       |

---

## 🧪 Test Structure

### Service Test Template

```typescript
import { Test, TestingModule } from "@nestjs/testing";
import { UserService } from "./user.service";
import { UserRepository } from "./repositories/user.repository";
import { CreateUserDto } from "./dto/create-user.dto";

describe("UserService", () => {
  let service: UserService;
  let repository: UserRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: UserRepository,
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findById: jest.fn(),
            findByEmail: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    repository = module.get<UserRepository>(UserRepository);
  });

  describe("create", () => {
    it("should create a new user", async () => {
      const createUserDto: CreateUserDto = {
        email: "test@example.com",
        password: "SecurePass123",
      };

      const expectedUser = {
        id: "1",
        email: "test@example.com",
        hashedPassword: expect.any(String),
      };

      jest.spyOn(repository, "create").mockReturnValue(expectedUser as any);
      jest.spyOn(repository, "save").mockResolvedValue(expectedUser as any);

      const result = await service.create(createUserDto);

      expect(result).toEqual(expectedUser);
      expect(repository.create).toHaveBeenCalledWith(createUserDto);
      expect(repository.save).toHaveBeenCalled();
    });

    it("should throw BadRequestException if email already exists", async () => {
      const createUserDto: CreateUserDto = {
        email: "existing@example.com",
        password: "SecurePass123",
      };

      jest.spyOn(repository, "findByEmail").mockResolvedValue({} as any);

      await expect(service.create(createUserDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe("findById", () => {
    it("should return user by id", async () => {
      const userId = "1";
      const expectedUser = { id: userId, email: "test@example.com" };

      jest.spyOn(repository, "findById").mockResolvedValue(expectedUser as any);

      const result = await service.findById(userId);

      expect(result).toEqual(expectedUser);
      expect(repository.findById).toHaveBeenCalledWith(userId);
    });

    it("should return null if user not found", async () => {
      jest.spyOn(repository, "findById").mockResolvedValue(null);

      const result = await service.findById("nonexistent");

      expect(result).toBeNull();
    });
  });
});
```

### Controller Test Template

```typescript
import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";

describe("UserController (unit)", () => {
  let app: INestApplication;
  let userService: UserService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            findAll: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    userService = moduleFixture.get<UserService>(UserService);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe("POST /users", () => {
    it("should create a user", async () => {
      const createUserDto = {
        email: "test@example.com",
        password: "SecurePass123",
      };

      const createdUser = {
        id: "1",
        email: "test@example.com",
      };

      jest.spyOn(userService, "create").mockResolvedValue(createdUser as any);

      return request(app.getHttpServer())
        .post("/users")
        .send(createUserDto)
        .expect(201)
        .expect(createdUser);
    });

    it("should return 400 for invalid email", async () => {
      return request(app.getHttpServer())
        .post("/users")
        .send({
          email: "not-an-email",
          password: "SecurePass123",
        })
        .expect(400);
    });
  });

  describe("GET /users/:id", () => {
    it("should return user by id", async () => {
      const user = {
        id: "1",
        email: "test@example.com",
      };

      jest.spyOn(userService, "findById").mockResolvedValue(user as any);

      return request(app.getHttpServer()).get("/users/1").expect(200).expect(user);
    });

    it("should return 404 if user not found", async () => {
      jest.spyOn(userService, "findById").mockResolvedValue(null);

      return request(app.getHttpServer()).get("/users/nonexistent").expect(404);
    });
  });
});
```

### Guard Test Template

```typescript
import { Test, TestingModule } from "@nestjs/testing";
import { ExecutionContext } from "@nestjs/common";
import { JwtGuard } from "./jwt.guard";
import { JwtService } from "@nestjs/jwt";

describe("JwtGuard", () => {
  let guard: JwtGuard;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtGuard,
        {
          provide: JwtService,
          useValue: {
            verify: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<JwtGuard>(JwtGuard);
    jwtService = module.get<JwtService>(JwtService);
  });

  it("should allow request with valid token", () => {
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: { authorization: "Bearer valid-token" },
        }),
      }),
    } as ExecutionContext;

    jest.spyOn(jwtService, "verify").mockReturnValue({ sub: "user-id" });

    const result = guard.canActivate(context);

    expect(result).toBe(true);
  });

  it("should reject request without token", () => {
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {},
        }),
      }),
    } as ExecutionContext;

    expect(() => guard.canActivate(context)).toThrow();
  });
});
```

---

## 🎭 E2E Testing

### Full Integration Test

```typescript
import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../src/app.module";

describe("Auth E2E Tests", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe("User Registration & Login Flow", () => {
    const testUser = {
      email: "e2e@example.com",
      password: "SecurePass123",
    };

    it("should register a new user", async () => {
      const response = await request(app.getHttpServer())
        .post("/auth/register")
        .send(testUser)
        .expect(201);

      expect(response.body).toHaveProperty("id");
      expect(response.body.email).toBe(testUser.email);
    });

    it("should login with correct credentials", async () => {
      const response = await request(app.getHttpServer())
        .post("/auth/login")
        .send(testUser)
        .expect(200);

      expect(response.body).toHaveProperty("accessToken");
      expect(response.body).toHaveProperty("refreshToken");
    });

    it("should reject login with incorrect password", async () => {
      await request(app.getHttpServer())
        .post("/auth/login")
        .send({
          email: testUser.email,
          password: "WrongPassword",
        })
        .expect(401);
    });

    it("should access protected route with valid token", async () => {
      const loginResponse = await request(app.getHttpServer()).post("/auth/login").send(testUser);

      const token = loginResponse.body.accessToken;

      await request(app.getHttpServer())
        .get("/users/profile")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);
    });

    it("should reject protected route without token", async () => {
      await request(app.getHttpServer()).get("/users/profile").expect(401);
    });
  });
});
```

---

## 🎭 Testing Patterns

### Mocking Database

```typescript
// ✅ GOOD: Mock repository
const mockUserRepository = {
  find: jest.fn().mockResolvedValue([]),
  findById: jest.fn().mockResolvedValue(null),
  save: jest.fn(),
};

// Use in test
beforeEach(async () => {
  const module = await Test.createTestingModule({
    providers: [
      UserService,
      {
        provide: UserRepository,
        useValue: mockUserRepository,
      },
    ],
  }).compile();
});
```

### Testing Error Cases

```typescript
describe("Error Handling", () => {
  it("should throw UnauthorizedException on invalid credentials", async () => {
    jest.spyOn(repository, "findByEmail").mockResolvedValue(null);

    await expect(service.validateUser("test@example.com", "password")).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it("should catch database errors", async () => {
    jest.spyOn(repository, "save").mockRejectedValue(new Error("Database connection failed"));

    await expect(service.create(dto)).rejects.toThrow(InternalServerErrorException);
  });
});
```

### Testing Async Operations

```typescript
describe("Async Operations", () => {
  it("should handle concurrent requests", async () => {
    const promises = Array(10)
      .fill(null)
      .map(() => service.create(createUserDto));

    const results = await Promise.all(promises);

    expect(results).toHaveLength(10);
    expect(results.every((r) => r.id)).toBe(true);
  });
});
```

---

## ✅ Testing Checklist

Before submitting code:

- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] Coverage >= 80%
- [ ] Error cases tested
- [ ] Edge cases tested
- [ ] Async operations tested
- [ ] Database mocking working
- [ ] No hardcoded test data
- [ ] Tests are deterministic (not flaky)
- [ ] No console.log() statements left
