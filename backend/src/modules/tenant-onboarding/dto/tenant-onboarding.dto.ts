import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TenantOnboardingStatus } from '@prisma/client';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { PaymentFrequencyInput } from '../../tenancies/dto/convert-to-tenancy.dto';

export class CreateTenantOnboardingDto {
  @ApiProperty({ example: 'Adekunle' })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  firstName!: string;

  @ApiProperty({ example: 'Adebayo' })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  lastName!: string;

  @ApiPropertyOptional({ example: 'tenant@example.com' })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @ApiPropertyOptional({ example: '+2348012345678' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @ApiProperty({ example: '2026-06-01' })
  @IsDateString()
  startDate!: string;

  @ApiProperty({ example: '2027-05-31' })
  @IsDateString()
  endDate!: string;

  @ApiProperty({ example: 2400000 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  rentAmount!: number;

  @ApiProperty({ enum: PaymentFrequencyInput, example: 'yearly' })
  @IsEnum(PaymentFrequencyInput)
  paymentFrequency!: PaymentFrequencyInput;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

export class RejectTenantOnboardingDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export enum TenantOnboardingStatusInput {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CONVERTED_TO_TENANCY = 'converted_to_tenancy',
}

export const onboardingStatusMap: Record<
  TenantOnboardingStatusInput,
  TenantOnboardingStatus
> = {
  [TenantOnboardingStatusInput.PENDING]: TenantOnboardingStatus.PENDING,
  [TenantOnboardingStatusInput.APPROVED]: TenantOnboardingStatus.APPROVED,
  [TenantOnboardingStatusInput.REJECTED]: TenantOnboardingStatus.REJECTED,
  [TenantOnboardingStatusInput.CONVERTED_TO_TENANCY]:
    TenantOnboardingStatus.CONVERTED_TO_TENANCY,
};
