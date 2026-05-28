import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RemittanceStatus } from '@prisma/client';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { PaymentMethodInput } from '../../payments/dto/create-payment.dto';

export enum RemittanceStatusInput {
  PENDING = 'pending',
  PARTIALLY_REMITTED = 'partially_remitted',
  REMITTED = 'remitted',
  DISPUTED = 'disputed',
  CANCELLED = 'cancelled',
}

export const remittanceStatusMap: Record<
  RemittanceStatusInput,
  RemittanceStatus
> = {
  [RemittanceStatusInput.PENDING]: RemittanceStatus.PENDING,
  [RemittanceStatusInput.PARTIALLY_REMITTED]:
    RemittanceStatus.PARTIALLY_REMITTED,
  [RemittanceStatusInput.REMITTED]: RemittanceStatus.REMITTED,
  [RemittanceStatusInput.DISPUTED]: RemittanceStatus.DISPUTED,
  [RemittanceStatusInput.CANCELLED]: RemittanceStatus.CANCELLED,
};

export class CreateRemittanceDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  propertyId!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  caretakerId?: string;

  @ApiProperty({ type: [String], format: 'uuid' })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsUUID('4', { each: true })
  paymentIds!: string[];

  @ApiProperty({ example: 1200000 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount!: number;

  @ApiPropertyOptional({ enum: RemittanceStatusInput, default: 'pending' })
  @IsOptional()
  @IsEnum(RemittanceStatusInput)
  status: RemittanceStatusInput = RemittanceStatusInput.PENDING;

  @ApiProperty({ enum: PaymentMethodInput })
  @IsEnum(PaymentMethodInput)
  method!: PaymentMethodInput;

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
