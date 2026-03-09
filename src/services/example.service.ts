import { Injectable, Inject } from "@nestjs/common";

import { ExampleKitOptions } from "../example-kit.module";

/**
 * Example Service
 *
 * Main service providing the core functionality of the module.
 * This is what consumers of your module will primarily interact with.
 *
 * @example
 * ```typescript
 * constructor(private readonly exampleService: ExampleService) {}
 *
 * async someMethod() {
 *   const result = await this.exampleService.doSomething('data');
 *   return result;
 * }
 * ```
 */
@Injectable()
export class ExampleService {
  constructor(
    @Inject("EXAMPLE_KIT_OPTIONS")
    private readonly _options: ExampleKitOptions,
  ) {}

  /**
   * Example method demonstrating service functionality
   * @param data - Input data to process
   * @returns Processed result
   * @example
   * ```typescript
   * const result = await service.doSomething('test');
   * // Returns: "Processed: test"
   * ```
   */
  async doSomething(data: string): Promise<string> {
    if (this._options.debug) {
      console.log("[ExampleService] Processing:", data);
    }
    return `Processed: ${data}`;
  }

  /**
   * Example method for retrieving data
   * @param id - Unique identifier
   * @returns Retrieved data or null
   */
  async findById(id: string): Promise<any | null> {
    // Implement your logic here
    return { id, data: "example" };
  }
}
