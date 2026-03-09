import { IsString, IsNotEmpty, MinLength, MaxLength, IsOptional } from "class-validator";

/**
 * DTO for creating a new example resource
 *
 * DTOs define the shape of data for API requests and provide validation.
 * Always use class-validator decorators for input validation.
 *
 * @example
 * ```typescript
 * const dto: CreateExampleDto = {
 *   name: 'Test Example',
 *   description: 'Optional description',
 * };
 * ```
 */
export class CreateExampleDto {
  /**
   * Name of the example resource
   * @example "My Example"
   */
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  name!: string;

  /**
   * Optional description
   * @example "This is an example description"
   */
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;
}
