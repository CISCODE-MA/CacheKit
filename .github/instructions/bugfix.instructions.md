# Bugfix Instructions - NestJS API Module

> **Last Updated**: February 2026

---

## 🔍 Bug Investigation Process

### Phase 1: Reproduce

**Before writing any code:**

1. **Understand the issue** - Read bug report carefully
2. **Reproduce locally** - Create minimal test case
3. **Verify it's a bug** - Not expected behavior or misconfiguration
4. **Check environment** - Does it happen in all environments?
5. **Document steps** - Clear reproduction steps

**Create failing test FIRST:**

```typescript
describe("Bug: User creation fails with special characters in name", () => {
  it("should allow user with special characters in name", async () => {
    const createUserDto = {
      email: "test@example.com",
      password: "SecurePass123",
      name: "O'Brien",
    };

    // This SHOULD pass but currently FAILS
    const user = await service.create(createUserDto);
    expect(user.name).toBe("O'Brien");
  });
});
```

### Phase 2: Identify Root Cause

**Investigation tools:**

- **Debugger** - Breakpoints and step-through
- **Logs** - Add console.log() or logger statements
- **Tests** - Run failing test with debugger
- **Database** - Check data integrity
- **Request/Response** - Check HTTP logs

```typescript
// Debug service method
@Injectable()
export class UserService {
  async create(dto: CreateUserDto) {
    console.log("Input DTO:", dto); // ← Debug input

    const user = new User();
    user.email = dto.email;

    console.log("User entity:", user); // ← Debug intermediate state

    const saved = await this.repository.save(user);

    console.log("Saved user:", saved); // ← Debug output
    return saved;
  }
}
```

### Phase 3: Understand Impact

**Critical questions:**

- Does it affect multiple endpoints?
- Does it affect specific data types?
- Does it break existing functionality?
- Is it a security issue?
- Does it affect performance?

---

## 🐛 Common Bug Categories & Solutions

### 1. Data Validation Issues

| Bug Type               | Symptoms              | Solution                  |
| ---------------------- | --------------------- | ------------------------- |
| **Missing validation** | Invalid data accepted | Add DTO validators        |
| **Wrong validator**    | Valid data rejected   | Fix validator logic/rules |
| **SQL injection**      | Security breach       | Use parameterized queries |

**Example fix - Missing email validation:**

```typescript
// ❌ BUG - No validation
export class CreateUserDto {
  email: string;
}

// ✅ FIX - Add validators
import { IsEmail, MaxLength } from "class-validator";

export class CreateUserDto {
  @IsEmail()
  @MaxLength(255)
  email: string;
}
```

**Example fix - SQL injection:**

```typescript
// ❌ BUG - String concatenation
const user = await this.repository.find({
  where: `email = '${email}'`, // Vulnerable!
});

// ✅ FIX - Use parameters
const user = await this.repository.findOne({
  where: { email }, // Safe
});
```

### 2. Database Issues

| Bug Type              | Symptoms                  | Solution                   |
| --------------------- | ------------------------- | -------------------------- |
| **Wrong column type** | Data truncated            | Fix entity definition      |
| **Missing index**     | Slow queries              | Add database index         |
| **Cascade delete**    | Data deleted unexpectedly | Fix foreign key constraint |

**Example fix - Wrong column type:**

```typescript
// ❌ BUG - Column too small
@Entity()
export class User {
  @Column("varchar", { length: 50 })
  email: string; // Truncates long emails
}

// ✅ FIX - Use appropriate type
@Entity()
export class User {
  @Column("varchar", { length: 255 })
  email: string;
}
```

**Example fix - Add index for performance:**

```typescript
// ❌ BUG - No index, slow searches
@Entity()
export class User {
  @Column()
  email: string;
}

// ✅ FIX - Add index
@Entity()
export class User {
  @Column()
  @Index()
  email: string;
}
```

### 3. Service Logic Issues

| Bug Type                | Symptoms           | Solution            |
| ----------------------- | ------------------ | ------------------- |
| **Wrong comparison**    | Logic fails        | Fix condition       |
| **Missing null check**  | Null pointer error | Add null check      |
| **Order of operations** | Wrong result       | Fix execution order |

**Example fix - Missing null check:**

```typescript
// ❌ BUG - No null check
async updateUser(id: string, dto: UpdateUserDto) {
  const user = await this.repository.findById(id);
  user.email = dto.email; // ← Crashes if user is null
  return this.repository.save(user);
}

// ✅ FIX - Add null check
async updateUser(id: string, dto: UpdateUserDto) {
  const user = await this.repository.findById(id);
  if (!user) {
    throw new NotFoundException('User not found');
  }
  user.email = dto.email;
  return this.repository.save(user);
}
```

**Example fix - Wrong comparison:**

```typescript
// ❌ BUG - Wrong operator
if ((age = 18)) {
  // Assignment, not comparison!
  // This is always true
}

// ✅ FIX - Use correct operator
if (age >= 18) {
  // This is correct
}
```

### 4. Async/Await Issues

| Bug Type                | Symptoms             | Solution                 |
| ----------------------- | -------------------- | ------------------------ |
| **Missing await**       | Race condition       | Add await keyword        |
| **Unhandled rejection** | Crash or silent fail | Add error handling       |
| **Parallel execution**  | Deadlock             | Ensure proper sequencing |

**Example fix - Missing await:**

```typescript
// ❌ BUG - Missing await
async createUser(dto: CreateUserDto) {
  const hashedPassword = this.hashPassword(dto.password); // Missing await!
  const user = new User();
  user.password = hashedPassword; // ← Gets promise, not string
  return this.repository.save(user);
}

// ✅ FIX - Add await
async createUser(dto: CreateUserDto) {
  const hashedPassword = await this.hashPassword(dto.password);
  const user = new User();
  user.password = hashedPassword;
  return this.repository.save(user);
}
```

**Example fix - Unhandled rejection:**

```typescript
// ❌ BUG - No error handling
async processPayments() {
  this.paymentService.process(); // Fire and forget - no error handling
}

// ✅ FIX - Wait and handle errors
async processPayments() {
  try {
    await this.paymentService.process();
  } catch (error) {
    this.logger.error('Payment processing failed', error);
    // Handle or re-throw appropriately
  }
}
```

### 5. Authentication/Authorization Issues

| Bug Type             | Symptoms              | Solution               |
| -------------------- | --------------------- | ---------------------- |
| **Missing guard**    | Endpoint unprotected  | Add @UseGuards()       |
| **Wrong role check** | Access control broken | Fix role validation    |
| **Token invalid**    | Users can't login     | Check token generation |

**Example fix - Missing guard:**

```typescript
// ❌ BUG - No authentication
@Controller("users")
export class UserController {
  @Delete(":id")
  async deleteUser(@Param("id") id: string) {
    return this.userService.delete(id); // Anyone can delete!
  }
}

// ✅ FIX - Add guard
@Controller("users")
export class UserController {
  @Delete(":id")
  @UseGuards(JwtGuard, RolesGuard)
  @Roles("admin")
  async deleteUser(@Param("id") id: string) {
    return this.userService.delete(id); // Only admins can delete
  }
}
```

### 6. Error Handling Issues

| Bug Type               | Symptoms         | Solution                 |
| ---------------------- | ---------------- | ------------------------ |
| **Wrong status code**  | Client confusion | Use correct HTTP status  |
| **Missing error info** | Hard to debug    | Include error details    |
| **500 for user error** | Poor UX          | Use 400/401/403 for user |

**Example fix - Wrong status code:**

```typescript
// ❌ BUG - Returns 500 for user error
@Post()
async create(@Body() dto: CreateUserDto) {
  if (await this.userService.emailExists(dto.email)) {
    throw new InternalServerErrorException('Email exists');
  }
  return this.userService.create(dto);
}

// ✅ FIX - Return 400 for user error
@Post()
async create(@Body() dto: CreateUserDto) {
  if (await this.userService.emailExists(dto.email)) {
    throw new BadRequestException('Email already registered');
  }
  return this.userService.create(dto);
}
```

---

## 🔧 Debugging Workflow

### Step 1: Enable Debug Logging

```typescript
// main.ts
const app = await NestFactory.create(AppModule);

if (process.env.DEBUG) {
  app.use(express.json({ type: "application/*+json" }));
  // Enable query logging
  const logger = new Logger("Database");
  logger.debug("Debug mode enabled");
}

await app.listen(3000);
```

### Step 2: Check Request/Response

```typescript
// Check what data is coming in
@Post('users')
async create(@Body() dto: CreateUserDto) {
  console.log('Received DTO:', dto);
  console.log('DTO type:', typeof dto);
  console.log('DTO keys:', Object.keys(dto));
  // ... rest of method
}
```

### Step 3: Run Failing Test with Breakpoint

```bash
# Run test with debugger
node --inspect-brk ./node_modules/jest/bin/jest.js --runInBand

# Then attach debugger to chrome://inspect
```

### Step 4: Check Database State

```bash
# Connect to database manually
psql -U user -d dbname -c "SELECT * FROM users WHERE email = 'test@example.com';"
```

---

## ✅ Bugfix Checklist

Before submitting fix:

- [ ] Bug reproduced with test
- [ ] Root cause identified
- [ ] Fix only targets root cause (no workarounds)
- [ ] Existing tests still pass
- [ ] New test for the bug added
- [ ] No new test failures
- [ ] Edge cases considered
- [ ] Similar issues checked for
- [ ] Backward compatibility maintained
- [ ] CHANGELOG updated with bugfix entry
