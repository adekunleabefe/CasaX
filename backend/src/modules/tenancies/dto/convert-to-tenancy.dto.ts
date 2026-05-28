import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentFrequency } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export enum PaymentFrequencyInput {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  BIANNUAL = 'biannual',
  YEARLY = 'yearly',
}

export const paymentFrequencyMap: Record<
  PaymentFrequencyInput,
  PaymentFrequency
> = {
  [PaymentFrequencyInput.MONTHLY]: PaymentFrequency.MONTHLY,
  [PaymentFrequencyInput.QUARTERLY]: PaymentFrequency.QUARTERLY,
  [PaymentFrequencyInput.BIANNUAL]: PaymentFrequency.BIANNUAL,
  [PaymentFrequencyInput.YEARLY]: PaymentFrequency.YEARLY,
};

export class ConvertToTenancyDto {
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

  @ApiPropertyOptional({ example: 'Security deposit confirmed.' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
