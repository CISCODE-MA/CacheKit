// import { ExampleService } from '@services/example.service';
import { CreateExampleDto } from "@dtos/create-example.dto";
import { Controller, Get, Post, Body, Param } from "@nestjs/common";

/**
 * Example Controller
 *
 * HTTP endpoints for the Example Kit module.
 * Controllers are optional - only include if your module provides HTTP endpoints.
 *
 * @example
 * ```typescript
 * // In your app's module
 * @Module({
 *   imports: [ExampleKitModule.forRoot()],
 *   controllers: [], // Controllers are auto-registered by the module
 * })
 * export class AppModule {}
 * ```
 */
@Controller("example")
export class ExampleController {
  // constructor(private readonly exampleService: ExampleService) {}

  /**
   * Create a new example resource
   * @param dto - Data transfer object
   * @returns Created resource
   */
  @Post()
  async create(@Body() dto: CreateExampleDto) {
    // return this.exampleService.doSomething(dto.name);
    return { message: "Example created", data: dto };
  }

  /**
   * Get resource by ID
   * @param id - Resource identifier
   * @returns Resource data
   */
  @Get(":id")
  async findOne(@Param("id") id: string) {
    // return this.exampleService.findById(id);
    return { id, data: "example" };
  }
}
