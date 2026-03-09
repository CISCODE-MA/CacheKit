# Features Instructions - NestJS API Module

> **Last Updated**: February 2026

---

## 🚀 Before Starting Any Feature

### Pre-Implementation Checklist

- [ ] **Check existing services** - Avoid duplication
- [ ] **Understand scope** - Breaking change? (MAJOR version)
- [ ] **Review module API** - Changes to exports?
- [ ] **Check dependencies** - Need new npm packages?
- [ ] **Plan backwards compatibility** - Can users upgrade?
- [ ] **Consider security** - Auth required? Validation needed?

### Questions to Ask

1. **Already exists?**

   ```bash
   grep -r "ServiceName" src/
   ```

2. **Right abstraction level?**
   - Too specific to one use case?
   - Reusable across different contexts?

3. **Impact assessment?**
   - Breaking → MAJOR version
   - New service/endpoint → MINOR version
   - Bug fix/enhancement → PATCH version

---

## 📋 Implementation Workflow

```
1. Design → 2. Implement → 3. Test → 4. Document → 5. Release
```

### 1️⃣ Design Phase

- [ ] Define service responsibility
- [ ] Plan DTO schemas
- [ ] Design database entities
- [ ] Plan API routes
- [ ] Consider security requirements
- [ ] Plan error scenarios

### 2️⃣ Implementation Phase

- [ ] Create feature branch: `feature/API-MODULE-*`
- [ ] Create DTO with validation
- [ ] Create database entity
- [ ] Create service with business logic
- [ ] Create controller with routes
- [ ] Add guards/authentication if needed
- [ ] Handle edge cases and errors

### 3️⃣ Testing Phase

- [ ] Unit tests for service logic
- [ ] Controller route tests
- [ ] Validation tests
- [ ] Error handling tests
- [ ] Integration tests
- [ ] Coverage >= 80%

### 4️⃣ Documentation Phase

- [ ] JSDoc for all public methods
- [ ] Update README with API examples
- [ ] Update CHANGELOG
- [ ] Add Swagger/OpenAPI documentation
- [ ] Document environment variables
- [ ] Add migration guidance if DB changes

### 5️⃣ Release Phase

- [ ] Bump version: `npm version [minor|major]`
- [ ] Build library
- [ ] Create PR to `develop`
- [ ] Release from `master`

---

## ➕ Adding New Service/Module

### Example: Payment Processing Module

**Step 1: Design DTOs**

```typescript
// src/modules/payment/dto/create-payment.dto.ts
export class CreatePaymentDto {
  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsString()
  @IsIn(["credit_card", "paypal", "bank_transfer"])
  paymentMethod: string;

  @IsUUID()
  orderId: string;
}

export class PaymentResponseDto {
  @IsUUID()
  id: string;

  @IsNumber()
  amount: number;

  @IsString()
  status: "pending" | "completed" | "failed";

  @IsISO8601()
  createdAt: string;
}
```

**Step 2: Create Entity**

```typescript
// src/modules/payment/entities/payment.entity.ts
@Entity("payments")
export class Payment {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column("decimal", { precision: 10, scale: 2 })
  amount: number;

  @Column()
  paymentMethod: string;

  @Column()
  status: "pending" | "completed" | "failed";

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

**Step 3: Create Repository**

```typescript
// src/modules/payment/repositories/payment.repository.ts
@Injectable()
export class PaymentRepository extends Repository<Payment> {
  constructor(private dataSource: DataSource) {
    super(Payment, dataSource.createEntityManager());
  }

  async findByOrderId(orderId: string): Promise<Payment[]> {
    return this.find({ where: { orderId } });
  }

  async findPending(): Promise<Payment[]> {
    return this.find({ where: { status: "pending" } });
  }
}
```

**Step 4: Create Service**

```typescript
// src/modules/payment/payment.service.ts
@Injectable()
export class PaymentService {
  private logger = new Logger(PaymentService.name);

  constructor(
    private paymentRepository: PaymentRepository,
    private stripeService: StripeService,
  ) {}

  /**
   * Process a payment
   * @param createPaymentDto Payment details
   * @returns Created payment record
   * @throws BadRequestException if validation fails
   * @throws InternalServerErrorException on payment gateway error
   */
  async processPayment(createPaymentDto: CreatePaymentDto): Promise<PaymentResponseDto> {
    try {
      // 1. Create payment record (pending status)
      const payment = this.paymentRepository.create({
        ...createPaymentDto,
        status: "pending",
      });

      // 2. Process with payment gateway
      const gatewayResponse = await this.stripeService.charge(createPaymentDto.amount);

      // 3. Update status
      if (gatewayResponse.success) {
        payment.status = "completed";
      } else {
        payment.status = "failed";
        throw new BadRequestException("Payment declined");
      }

      // 4. Save and return
      const saved = await this.paymentRepository.save(payment);
      return this.toResponseDto(saved);
    } catch (error) {
      this.logger.error("Payment processing failed", error);
      throw new InternalServerErrorException("Payment processing failed");
    }
  }

  private toResponseDto(payment: Payment): PaymentResponseDto {
    return {
      id: payment.id,
      amount: payment.amount,
      status: payment.status,
      createdAt: payment.createdAt.toISOString(),
    };
  }
}
```

**Step 5: Create Controller**

```typescript
// src/modules/payment/payment.controller.ts
@Controller("payments")
@UseGuards(JwtGuard)
export class PaymentController {
  /**
   * Create and process a payment
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async processPayment(@Body() createPaymentDto: CreatePaymentDto): Promise<PaymentResponseDto> {
    return this.paymentService.processPayment(createPaymentDto);
  }

  /**
   * Get payment by ID
   */
  @Get(":id")
  async getPayment(@Param("id", new ParseUUIDPipe()) id: string): Promise<PaymentResponseDto> {
    const payment = await this.paymentService.findById(id);
    if (!payment) {
      throw new NotFoundException("Payment not found");
    }
    return this.toResponseDto(payment);
  }
}
```

**Step 6: Create Module**

```typescript
// src/modules/payment/payment.module.ts
@Module({
  imports: [TypeOrmModule.forFeature([Payment])],
  controllers: [PaymentController],
  providers: [PaymentService, PaymentRepository],
  exports: [PaymentService],
})
export class PaymentModule {}
```

**Step 7: Register Module**

```typescript
// src/app.module.ts
@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot(ormConfig),
    AuthModule,
    UserModule,
    PaymentModule, // ← Add here
  ],
})
export class AppModule {}
```

---

## ➕ Adding New Endpoint to Existing Service

### Example: Add Refund Endpoint

**Step 1: Create DTO**

```typescript
export class RefundPaymentDto {
  @IsNumber()
  @Min(0.01)
  refundAmount?: number; // Optional - full refund if not specified
}
```

**Step 2: Add Service Method**

```typescript
@Injectable()
export class PaymentService {
  /**
   * Refund a payment (full or partial)
   * @param paymentId Payment ID
   * @param refundDto Refund details
   * @returns Updated payment
   * @throws NotFoundException if payment not found
   * @throws BadRequestException if payment cannot be refunded
   */
  async refundPayment(paymentId: string, refundDto: RefundPaymentDto): Promise<PaymentResponseDto> {
    const payment = await this.paymentRepository.findById(paymentId);
    if (!payment) {
      throw new NotFoundException("Payment not found");
    }

    if (payment.status !== "completed") {
      throw new BadRequestException("Only completed payments can be refunded");
    }

    const refundAmount = refundDto.refundAmount || payment.amount;

    // Process refund
    await this.stripeService.refund(payment.stripeId, refundAmount);

    // Update status
    payment.status = "refunded";
    const saved = await this.paymentRepository.save(payment);

    return this.toResponseDto(saved);
  }
}
```

**Step 3: Add Controller Method**

```typescript
@Controller("payments")
export class PaymentController {
  @Post(":id/refund")
  @UseGuards(JwtGuard, RolesGuard)
  @Roles("admin")
  async refundPayment(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() refundDto: RefundPaymentDto,
  ): Promise<PaymentResponseDto> {
    return this.paymentService.refundPayment(id, refundDto);
  }
}
```

**Step 4: Add Tests**

```typescript
describe("PaymentService - Refund", () => {
  it("should refund a completed payment", async () => {
    const payment = new Payment();
    payment.id = "test-id";
    payment.status = "completed";
    payment.amount = 100;

    jest.spyOn(repository, "findById").mockResolvedValue(payment);
    jest.spyOn(stripeService, "refund").mockResolvedValue({ success: true });

    const result = await service.refundPayment("test-id", {});

    expect(result.status).toBe("refunded");
  });

  it("should reject refund for pending payment", async () => {
    const payment = new Payment();
    payment.status = "pending";

    jest.spyOn(repository, "findById").mockResolvedValue(payment);

    await expect(service.refundPayment("test-id", {})).rejects.toThrow(BadRequestException);
  });
});
```

---

## 🔄 Handling Breaking Changes

### Example: Rename Service Method

**Before**: `processPayment()`
**After**: `createPayment()`

**Steps:**

1. Add new method with new name
2. Keep old method (deprecated), call new method internally
3. Add deprecation notice in JSDoc
4. Bump MAJOR version
5. In next major release, remove old method

```typescript
@Injectable()
export class PaymentService {
  // ✅ New method
  async createPayment(dto: CreatePaymentDto): Promise<PaymentResponseDto> {
    // implementation
  }

  // ⚠️ Deprecated method (for backward compatibility)
  /**
   * @deprecated Use createPayment() instead. Will be removed in v3.0.0
   */
  async processPayment(dto: CreatePaymentDto): Promise<PaymentResponseDto> {
    return this.createPayment(dto);
  }
}
```

---

## ✅ Feature Checklist

Before submitting PR:

- [ ] Code follows module structure
- [ ] Unit tests written (80%+ coverage)
- [ ] Integration tests pass
- [ ] DTOs properly validated
- [ ] Error handling complete
- [ ] Security review done
- [ ] Backward compatible
- [ ] Documentation complete
- [ ] CHANGELOG updated
- [ ] ESLint + TypeScript clean
