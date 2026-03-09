# NestJS Developer Kit (Template)

A professional template for creating reusable NestJS npm packages with best practices, standardized structure, and AI-friendly development workflow.

## 🎯 What You Get

- ✅ **CSR Architecture** - Controller-Service-Repository pattern
- ✅ **TypeScript** - Strict mode with path aliases
- ✅ **Testing** - Jest with 80% coverage threshold
- ✅ **Code Quality** - ESLint + Prettier + Husky
- ✅ **Versioning** - Changesets for semantic versioning
- ✅ **CI/CD** - GitHub Actions workflows
- ✅ **Documentation** - Complete Copilot instructions
- ✅ **Examples** - Full working examples for all layers

## 📦 Installation

```bash
# Clone this template
git clone https://github.com/CISCODE-MA/NestJs-DeveloperKit.git my-module
cd my-module

# Install dependencies
npm install

# Start developing
npm run build
npm test
```

## 🏗️ Architecture

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
  │   ├── create-example.dto.ts
  │   └── update-example.dto.ts
  │
  ├── filters/                    # Exception Filters
  ├── middleware/                 # Middleware
  ├── config/                     # Configuration
  └── utils/                      # Utilities
```

## 🚀 Usage

### 1. Customize Your Module

```typescript
// src/example-kit.module.ts
import { Module, DynamicModule } from "@nestjs/common";
import { ExampleService } from "@services/example.service";

@Module({})
export class ExampleKitModule {
  static forRoot(options: ExampleKitOptions): DynamicModule {
    return {
      module: ExampleKitModule,
      providers: [ExampleService],
      exports: [ExampleService],
    };
  }
}
```

### 2. Create Services

```typescript
// src/services/example.service.ts
import { Injectable } from "@nestjs/common";

@Injectable()
export class ExampleService {
  async doSomething(data: string): Promise<string> {
    return `Processed: ${data}`;
  }
}
```

### 3. Define DTOs

```typescript
// src/dto/create-example.dto.ts
import { IsString, IsNotEmpty } from "class-validator";

export class CreateExampleDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}
```

### 4. Export Public API

```typescript
// src/index.ts
export { ExampleKitModule } from "./example-kit.module";
export { ExampleService } from "./services/example.service";
export { CreateExampleDto } from "./dto/create-example.dto";
```

## 📝 Scripts

```bash
# Development
npm run build          # Build the package
npm run build:watch    # Build in watch mode
npm run typecheck      # TypeScript type checking

# Testing
npm test               # Run tests
npm run test:watch     # Run tests in watch mode
npm run test:cov       # Run tests with coverage

# Code Quality
npm run lint           # Run ESLint
npm run format         # Check formatting
npm run format:write   # Fix formatting

# Release
npx changeset          # Create a changeset
npm run release        # Publish to npm (CI does this)
```

## 🔄 Release Workflow

This template uses [Changesets](https://github.com/changesets/changesets) for version management.

### 1. Create a Feature

```bash
git checkout develop
git checkout -b feature/my-feature
# Make your changes
```

### 2. Create a Changeset

```bash
npx changeset
```

Select the change type:

- **patch** - Bug fixes
- **minor** - New features (backwards compatible)
- **major** - Breaking changes

### 3. Commit and PR

```bash
git add .
git commit -m "feat: add new feature"
git push origin feature/my-feature
# Create PR → develop
```

### 4. Release

- Automation opens "Version Packages" PR
- Merge to `master` to publish

## 🧪 Testing

Tests are MANDATORY for all public APIs.

```typescript
// src/services/example.service.spec.ts
describe("ExampleService", () => {
  let service: ExampleService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [ExampleService],
    }).compile();

    service = module.get(ExampleService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should process data correctly", async () => {
    const result = await service.doSomething("test");
    expect(result).toBe("Processed: test");
  });
});
```

**Coverage threshold: 80%**

## 📚 Path Aliases

Configured in `tsconfig.json`:

```typescript
import { ExampleService } from "@services/example.service";
import { CreateExampleDto } from "@dtos/create-example.dto";
import { Example } from "@entities/example.entity";
import { ExampleRepository } from "@repos/example.repository";
```

Available aliases:

- `@/*` → `src/*`
- `@controllers/*` → `src/controllers/*`
- `@services/*` → `src/services/*`
- `@entities/*` → `src/entities/*`
- `@repos/*` → `src/repositories/*`
- `@dtos/*` → `src/dto/*`
- `@guards/*` → `src/guards/*`
- `@decorators/*` → `src/decorators/*`
- `@config/*` → `src/config/*`
- `@utils/*` → `src/utils/*`

## 🔒 Security Best Practices

- ✅ Input validation on all DTOs (class-validator)
- ✅ Environment variables for secrets
- ✅ No hardcoded credentials
- ✅ Proper error handling
- ✅ Rate limiting on public endpoints

## 🤖 AI-Friendly Development

This template includes comprehensive Copilot instructions in `.github/copilot-instructions.md`:

- Module architecture guidelines
- Naming conventions
- Testing requirements
- Documentation standards
- Export patterns
- Security best practices

## 📖 Documentation

- [Architecture](docs/ARCHITECTURE.md) - Detailed architecture overview
- [Release Process](docs/RELEASE.md) - How to release versions
- [Copilot Instructions](.github/copilot-instructions.md) - AI development guidelines

## 🛠️ Customization

1. **Rename the module**: Update `package.json` name
2. **Update description**: Modify `package.json` description
3. **Configure exports**: Edit `src/index.ts`
4. **Add dependencies**: Update `peerDependencies` and `dependencies`
5. **Customize structure**: Add/remove directories as needed

## ⚠️ Important Notes

### What to Export

✅ **DO export**:

- Module
- Services
- DTOs
- Guards
- Decorators
- Types/Interfaces

❌ **DON'T export**:

- Entities
- Repositories

Entities and repositories are internal implementation details.

### Versioning

- **MAJOR** (x.0.0) - Breaking changes
- **MINOR** (0.x.0) - New features (backwards compatible)
- **PATCH** (0.0.x) - Bug fixes

## 📋 Checklist Before Publishing

- [ ] All tests passing (80%+ coverage)
- [ ] No ESLint warnings
- [ ] TypeScript strict mode passing
- [ ] All public APIs documented (JSDoc)
- [ ] README updated
- [ ] Changeset created
- [ ] Breaking changes documented
- [ ] `.env.example` updated (if needed)

## 📄 License

MIT

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md)

## 🆘 Support

- [Documentation](docs/)
- [GitHub Issues](https://github.com/CISCODE-MA/NestJs-DeveloperKit/issues)
- [Discussions](https://github.com/CISCODE-MA/NestJs-DeveloperKit/discussions)

---

**Made with ❤️ by CisCode**
