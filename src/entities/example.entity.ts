/**
 * Example Entity
 *
 * Represents the domain model for the Example resource.
 *
 * For Mongoose:
 * ```typescript
 * import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
 * import { Document } from 'mongoose';
 *
 * @Schema({ timestamps: true })
 * export class Example extends Document {
 *   @Prop({ required: true })
 *   name: string;
 *
 *   @Prop()
 *   description?: string;
 * }
 *
 * export const ExampleSchema = SchemaFactory.createForClass(Example);
 * ```
 *
 * For TypeORM:
 * ```typescript
 * import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
 *
 * @Entity('examples')
 * export class Example {
 *   @PrimaryGeneratedColumn('uuid')
 *   id: string;
 *
 *   @Column()
 *   name: string;
 *
 *   @Column({ nullable: true })
 *   description?: string;
 *
 *   @CreateDateColumn()
 *   createdAt: Date;
 *
 *   @UpdateDateColumn()
 *   updatedAt: Date;
 * }
 * ```
 *
 * NOTE: Entities are NEVER exported from the module's public API.
 * They are internal implementation details.
 */

export class Example {
  id!: string;
  name!: string;
  description?: string;
  createdAt!: Date;
  updatedAt!: Date;
}
