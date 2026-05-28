import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
} from 'class-validator';
import { PaymentMethodInput, PaymentStatusInput } from './create-payment.dto';

export class UpdatePaymentDto {
  @ApiPropertyOptional({ example: 2400000 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount?: number;

  @ApiPropertyOptional({ example: '2026-06-01' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  paidAt?: string;

  @ApiPropertyOptional({ enum: PaymentStatusInput })
  @IsOptional()
  @IsEnum(PaymentStatusInput)
  status?: PaymentStatusInput;

  @ApiPropertyOptional({ enum: PaymentMethodInput })
  @IsOptional()
  @IsEnum(PaymentMethodInput)
  method?: PaymentMethodInput;

  @ApiPropertyOptional({ maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  reference?: string;

  @ApiPropertyOptional({ maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  proofUrl?: string;
}
