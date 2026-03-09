import { createParamDecorator } from "@nestjs/common";
import type { ExecutionContext } from "@nestjs/common";

/**
 * Example Decorator
 *
 * Custom parameter decorator to extract data from the request.
 * Useful for extracting user info, custom headers, or other request data.
 *
 * @example
 * ```typescript
 * @Controller('example')
 * export class ExampleController {
 *   @Get()
 *   async findAll(@ExampleData() data: any) {
 *     // data is extracted from request
 *     return data;
 *   }
 * }
 * ```
 */
export const ExampleData = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();

  // Extract and return data from request
  // Example: return request.user;
  // Example: return request.headers['x-custom-header'];

  return request.user || null;
});

/**
 * Example Decorator with parameter
 *
 * @example
 * ```typescript
 * @Get()
 * async findOne(@ExampleParam('id') id: string) {
 *   // id is extracted from request params
 *   return id;
 * }
 * ```
 */
export const ExampleParam = createParamDecorator((param: string, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return request.params?.[param];
});
