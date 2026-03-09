import { Example } from "@entities/example.entity";
import { Injectable } from "@nestjs/common";

/**
 * Example Repository
 *
 * Handles data access for Example entities.
 * Repositories encapsulate database operations and provide a clean interface
 * for services to interact with the database.
 *
 * For Mongoose:
 * ```typescript
 * import { Injectable } from '@nestjs/common';
 * import { InjectModel } from '@nestjs/mongoose';
 * import { Model } from 'mongoose';
 * import { Example } from '@entities/example.entity';
 *
 * @Injectable()
 * export class ExampleRepository {
 *   constructor(
 *     @InjectModel(Example.name)
 *     private readonly model: Model<Example>,
 *   ) {}
 *
 *   async create(data: Partial<Example>): Promise<Example> {
 *     const created = new this.model(data);
 *     return created.save();
 *   }
 *
 *   async findById(id: string): Promise<Example | null> {
 *     return this.model.findById(id).lean().exec();
 *   }
 * }
 * ```
 *
 * For TypeORM:
 * ```typescript
 * import { Injectable } from '@nestjs/common';
 * import { InjectRepository } from '@nestjs/typeorm';
 * import { Repository } from 'typeorm';
 * import { Example } from '@entities/example.entity';
 *
 * @Injectable()
 * export class ExampleRepository {
 *   constructor(
 *     @InjectRepository(Example)
 *     private readonly repo: Repository<Example>,
 *   ) {}
 *
 *   async create(data: Partial<Example>): Promise<Example> {
 *     const entity = this.repo.create(data);
 *     return this.repo.save(entity);
 *   }
 *
 *   async findById(id: string): Promise<Example | null> {
 *     return this.repo.findOne({ where: { id } });
 *   }
 * }
 * ```
 *
 * NOTE: Repositories are NEVER exported from the module's public API.
 * Services use repositories internally, but consumers only interact with services.
 */

@Injectable()
export class ExampleRepository {
  /**
   * Create a new example
   * @param data - Partial example data
   * @returns Created example
   */
  async create(data: Partial<Example>): Promise<Example> {
    // Implement your database logic here
    return {
      id: "generated-id",
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Example;
  }

  /**
   * Find example by ID
   * @param id - Example identifier
   * @returns Example or null if not found
   */
  async findById(id: string): Promise<Example | null> {
    // Implement your database logic here
    console.log("Finding example by id:", id);
    return null;
  }

  /**
   * Find all examples
   * @returns Array of examples
   */
  async findAll(): Promise<Example[]> {
    // Implement your database logic here
    return [];
  }

  /**
   * Update example
   * @param id - Example identifier
   * @param data - Partial data to update
   * @returns Updated example or null if not found
   */
  async update(id: string, data: Partial<Example>): Promise<Example | null> {
    // Implement your database logic here
    console.log("Updating example:", id, data);
    return null;
  }

  /**
   * Delete example
   * @param id - Example identifier
   * @returns True if deleted, false if not found
   */
  async delete(id: string): Promise<boolean> {
    // Implement your database logic here
    console.log("Deleting example:", id);
    return false;
  }
}
