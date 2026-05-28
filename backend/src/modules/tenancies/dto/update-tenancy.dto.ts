import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { PaymentFrequencyInput } from './convert-to-tenancy.dto';

export class UpdateTenancyDto {
  @ApiPropertyOptional({ example: '2027-05-31' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ example: 2400000 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  rentAmount?: number;

  @ApiPropertyOptional({ enum: PaymentFrequencyInput })
  @IsOptional()
  @IsEnum(PaymentFrequencyInput)
  paymentFrequency?: PaymentFrequencyInput;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

export class TerminateTenancyDto {
  @ApiPropertyOptional({ example: 'Lease ended by mutual agreement.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
