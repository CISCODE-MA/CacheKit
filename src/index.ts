import "reflect-metadata";

// ============================================================================
// PUBLIC API EXPORTS
// ============================================================================
// This file defines what consumers of your module can import.
// ONLY export what is necessary for external use.
// Keep entities, repositories, and internal implementation details private.

// ============================================================================
// MODULE
// ============================================================================
export { ExampleKitModule } from "./example-kit.module";
export type { ExampleKitOptions, ExampleKitAsyncOptions } from "./example-kit.module";

// ============================================================================
// SERVICES (Main API)
// ============================================================================
// Export services that consumers will interact with
export { ExampleService } from "./services/example.service";

// ============================================================================
// DTOs (Public Contracts)
// ============================================================================
// DTOs are the public interface for your API
// Consumers depend on these, so they must be stable
export { CreateExampleDto } from "./dto/create-example.dto";
export { UpdateExampleDto } from "./dto/update-example.dto";

// ============================================================================
// GUARDS (For Route Protection)
// ============================================================================
// Export guards so consumers can use them in their apps
export { ExampleGuard } from "./guards/example.guard";

// ============================================================================
// DECORATORS (For Dependency Injection & Metadata)
// ============================================================================
// Export decorators for use in consumer controllers/services
export { ExampleData, ExampleParam } from "./decorators/example.decorator";

// ============================================================================
// TYPES & INTERFACES (For TypeScript Typing)
// ============================================================================
// Export types and interfaces for TypeScript consumers
// export type { YourCustomType } from './types';

// ============================================================================
// ❌ NEVER EXPORT (Internal Implementation)
// ============================================================================
// These should NEVER be exported from a module:
// - Entities (internal domain models)
// - Repositories (infrastructure details)
//
// Example of what NOT to export:
// ❌ export { Example } from './entities/example.entity';
// ❌ export { ExampleRepository } from './repositories/example.repository';
//
// Why? These are internal implementation details that can change.
// Consumers should only work with DTOs and Services.
