import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';
import { PaymentMethodInput } from '../../payments/dto/create-payment.dto';
import { RemittanceStatusInput } from './create-remittance.dto';

export class UpdateRemittanceDto {
  @ApiPropertyOptional({ enum: RemittanceStatusInput })
  @IsOptional()
  @IsEnum(RemittanceStatusInput)
  status?: RemittanceStatusInput;

  @ApiPropertyOptional({ enum: PaymentMethodInput })
  @IsOptional()
  @IsEnum(PaymentMethodInput)
  method?: PaymentMethodInput;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  remittedAt?: string;

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
