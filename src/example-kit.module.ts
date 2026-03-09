import { Module, DynamicModule, Provider } from "@nestjs/common";
import { ExampleService } from "@services/example.service";

/**
 * Options for configuring the Example Kit module
 */
export interface ExampleKitOptions {
  /**
   * Enable debug mode
   * @default false
   */
  debug?: boolean;

  /**
   * Custom configuration options
   */
  // Add your configuration options here
}

/**
 * Async options for dynamic module configuration
 */
export interface ExampleKitAsyncOptions {
  useFactory: () => Promise<ExampleKitOptions> | ExampleKitOptions;
  inject?: any[];
}

/**
 * Example Kit Module
 *
 * A reusable NestJS module template demonstrating best practices
 * for building npm packages.
 *
 * @example
 * ```typescript
 * // Synchronous configuration
 * @Module({
 *   imports: [
 *     ExampleKitModule.forRoot({
 *       debug: true,
 *     }),
 *   ],
 * })
 * export class AppModule {}
 *
 * // Asynchronous configuration
 * @Module({
 *   imports: [
 *     ExampleKitModule.forRootAsync({
 *       useFactory: (config: ConfigService) => ({
 *         debug: config.get('DEBUG') === 'true',
 *       }),
 *       inject: [ConfigService],
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
@Module({})
export class ExampleKitModule {
  /**
   * Register the module with synchronous configuration
   * @param options - Configuration options
   * @returns Dynamic module
   */
  static forRoot(options: ExampleKitOptions = {}): DynamicModule {
    const providers: Provider[] = [
      {
        provide: "EXAMPLE_KIT_OPTIONS",
        useValue: options,
      },
      ExampleService,
    ];

    return {
      module: ExampleKitModule,
      providers,
      exports: [ExampleService],
      global: false,
    };
  }

  /**
   * Register the module with asynchronous configuration
   * @param options - Async configuration options
   * @returns Dynamic module
   */
  static forRootAsync(options: ExampleKitAsyncOptions): DynamicModule {
    const providers: Provider[] = [
      {
        provide: "EXAMPLE_KIT_OPTIONS",
        useFactory: options.useFactory,
        inject: options.inject || [],
      },
      ExampleService,
    ];

    return {
      module: ExampleKitModule,
      providers,
      exports: [ExampleService],
      global: false,
    };
  }
}
