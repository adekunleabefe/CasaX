import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  BillingCycle,
  SubscriptionPaymentStatus,
  SubscriptionPlanType,
  SubscriptionStatus,
} from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsUUID, Min } from 'class-validator';

export class SelectPlanDto {
  @ApiProperty({ enum: SubscriptionPlanType, example: SubscriptionPlanType.GROWTH })
  @IsEnum(SubscriptionPlanType)
  planType!: SubscriptionPlanType;

  @ApiProperty({ enum: BillingCycle, example: BillingCycle.MONTHLY })
  @IsEnum(BillingCycle)
  billingCycle!: BillingCycle;
}

export class InitializeSubscriptionPaymentDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  planId?: string;

  @ApiPropertyOptional({ enum: SubscriptionPlanType })
  @IsOptional()
  @IsEnum(SubscriptionPlanType)
  planType?: SubscriptionPlanType;

  @ApiPropertyOptional({ enum: BillingCycle, default: BillingCycle.MONTHLY })
  @IsOptional()
  @IsEnum(BillingCycle)
  billingCycle?: BillingCycle;
}

export class UpdateAdminSubscriptionDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  planId?: string;

  @ApiPropertyOptional({ enum: SubscriptionStatus })
  @IsOptional()
  @IsEnum(SubscriptionStatus)
  status?: SubscriptionStatus;

  @ApiPropertyOptional({ enum: BillingCycle })
  @IsOptional()
  @IsEnum(BillingCycle)
  billingCycle?: BillingCycle;
}

export class ExtendTrialDto {
  @ApiProperty({ example: 14, minimum: 1 })
  @IsInt()
  @Min(1)
  days!: number;
}

export class UpdateSubscriptionPaymentDto {
  @ApiProperty({ enum: SubscriptionPaymentStatus })
  @IsEnum(SubscriptionPaymentStatus)
  status!: SubscriptionPaymentStatus;
}
