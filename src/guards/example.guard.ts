import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { Observable } from "rxjs";

/**
 * Example Guard
 *
 * Guards determine whether a request should be handled by the route handler.
 * Use guards for authentication, authorization, and request validation.
 *
 * @example
 * ```typescript
 * // Apply to controller
 * @Controller('example')
 * @UseGuards(ExampleGuard)
 * export class ExampleController {}
 *
 * // Apply to specific route
 * @Get()
 * @UseGuards(ExampleGuard)
 * async findAll() {}
 *
 * // Apply globally
 * app.useGlobalGuards(new ExampleGuard());
 * ```
 */
@Injectable()
export class ExampleGuard implements CanActivate {
  /**
   * Determines if the request should be allowed
   * @param context - Execution context
   * @returns True if request is allowed, false otherwise
   */
  canActivate(_context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    // const request = _context.switchToHttp().getRequest();

    // Implement your guard logic here
    // Example: Check if user is authenticated
    // return !!request.user;

    return true;
  }
}
