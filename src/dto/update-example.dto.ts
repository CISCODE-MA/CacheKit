import { PartialType } from "@nestjs/mapped-types";

import { CreateExampleDto } from "./create-example.dto";

/**
 * DTO for updating an existing example resource
 *
 * Uses PartialType to make all fields from CreateExampleDto optional.
 * This follows NestJS best practices for update DTOs.
 *
 * @example
 * ```typescript
 * const dto: UpdateExampleDto = {
 *   name: 'Updated Name', // Only update name
 * };
 * ```
 */
export class UpdateExampleDto extends PartialType(CreateExampleDto) {}
