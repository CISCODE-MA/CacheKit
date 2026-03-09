---
applyTo: "**/*"
---

These are some guidelines when using the SonarQube MCP server.

# Important Tool Guidelines

## Basic usage

- **IMPORTANT**: After you finish generating or modifying any code files at the very end of the task, you MUST call the `analyze_file_list` tool (if it exists) to analyze the files you created or modified.
- **IMPORTANT**: When starting a new task, you MUST disable automatic analysis with the `toggle_automatic_analysis` tool if it exists.
- **IMPORTANT**: When you are done generating code at the very end of the task, you MUST re-enable automatic analysis with the `toggle_automatic_analysis` tool if it exists.

## Project Keys

- When a user mentions a project key, use `search_my_sonarqube_projects` first to find the exact project key
- Don't guess project keys - always look them up

## Code Language Detection

- When analyzing code snippets, detect the programming language from the code syntax
- If unclear, ask the user or make an educated guess based on syntax
- NestJS modules are TypeScript - use TypeScript language specification

## Branch and Pull Request Context

- Many operations support branch-specific analysis
- If user mentions working on a feature branch, include the branch parameter
- For PR analysis, use the PR-specific analysis tools if available

## Code Issues and Violations

- After fixing issues, do not attempt to verify them using `search_sonar_issues_in_projects`, as the server will not yet reflect the updates
- Focus on fixing code smells, security hotspots, and bugs identified by SonarQube

---

## Backend-Specific Quality Gates

### NestJS Quality Standards

**Code Smells to Address:**

- Unused imports
- Duplicate code blocks
- Complex methods (>20 lines)
- Missing error handling
- Unvalidated user input

**Security Hotspots:**

- Hardcoded credentials
- SQL injection vulnerabilities
- Missing authentication guards
- Sensitive data in logs
- Unvalidated dependency versions

**Type Safety:**

- Use of `any` type (avoid)
- Missing null checks
- Incorrect type definitions
- Invalid TypeScript configuration

**Testing Coverage:**

- Services should have 90%+ coverage
- Controllers should have 80%+ coverage
- Lines with no tests should be minimized
- All error paths should be tested

---

## Common Issues & Fixes

### Issue: High Complexity in Service Methods

**Problem**: Method has too many branches or nested conditions

```typescript
// ❌ HIGH COMPLEXITY
async processPayment(dto) {
  if (dto.amount > 0) {
    if (user.balance > dto.amount) {
      if (user.verified) {
        if (paymentGateway.available) {
          // ... 10 more nested conditions
        }
      }
    }
  }
}

// ✅ REFACTORED - Extract methods
async processPayment(dto: PaymentDto) {
  this.validatePaymentAmount(dto.amount);
  this.validateUserBalance(dto.amount);
  this.validateUserVerification();
  this.validatePaymentGateway();
  return this.executePayment(dto);
}
```

### Issue: Duplicate Code in Repositories

**Problem**: Similar query patterns repeated across multiple repositories

```typescript
// ❌ DUPLICATE
export class UserRepository {
  async findActive() {
    return this.find({ where: { isActive: true } });
  }
}

export class ProductRepository {
  async findActive() {
    return this.find({ where: { isActive: true } });
  }
}

// ✅ EXTRACT BASE CLASS
export abstract class BaseRepository<T> {
  async findActive() {
    return this.find({ where: { isActive: true } });
  }
}

export class UserRepository extends BaseRepository<User> {}
export class ProductRepository extends BaseRepository<Product> {}
```

### Issue: Missing Input Validation

**Problem**: User input accepted without validation

```typescript
// ❌ NO VALIDATION
@Post()
async create(@Body() body: any) {
  return this.service.create(body);
}

// ✅ WITH DTO VALIDATION
@Post()
async create(@Body() dto: CreateUserDto) {
  return this.service.create(dto);
}
```

### Issue: Hardcoded Configuration

**Problem**: Database URLs, API keys, or other config hardcoded

```typescript
// ❌ HARDCODED
const dbUrl = "mongodb://localhost:27017/mydb";
const apiKey = "sk_live_123456";

// ✅ ENVIRONMENT VARIABLES
const dbUrl = process.env.DATABASE_URL;
const apiKey = process.env.API_KEY;
```

---

## Troubleshooting

### Authentication Issues

- SonarQube requires USER tokens (not project tokens)
- When the error `SonarQube answered with Not authorized` occurs, verify the token type
- Ensure the token has the correct permissions for project analysis

### Project Not Found

- Use `search_my_sonarqube_projects` to find available projects
- Verify project key spelling and format
- Ensure you have permission to access the project

### Analysis Not Running

- Check that the project is properly configured
- Verify that all required build tools are installed
- Ensure the code language is correctly specified
- Check SonarQube logs for detailed error messages

### Code Quality Gate Failing

- Review the issues found by SonarQube
- Address high-priority bugs first
- Fix security vulnerabilities immediately
- Improve code coverage for critical paths
- Resolve code smells and refactor complex methods

---

## Best Practices for NestJS Modules

### 1. Clean Code

- Keep methods focused (single responsibility)
- Use meaningful variable names
- Extract complex logic into separate methods
- Add comments for non-obvious code

### 2. Type Safety

- Always use explicit types
- Avoid `any` type
- Use strict TypeScript configuration
- Validate all inputs with DTOs

### 3. Error Handling

- Use NestJS built-in exceptions
- Always catch and log errors
- Provide meaningful error messages
- Return appropriate HTTP status codes

### 4. Testing

- Write tests for all business logic
- Test error scenarios
- Maintain 80%+ code coverage
- Use meaningful test names

### 5. Security

- Validate all user input
- Use authentication guards
- Never log sensitive data
- Keep dependencies updated
