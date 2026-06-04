import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod, PaymentStatus } from '@prisma/client';
import {
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

export enum PaymentStatusInput {
  PENDING = 'pending',
  PROCESSING = 'processing',
  PAID = 'paid',
  OVERDUE = 'overdue',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum PaymentMethodInput {
  BANK_TRANSFER = 'bank_transfer',
  CASH = 'cash',
  POS = 'pos',
  CARD = 'card',
  ONLINE_GATEWAY = 'online_gateway',
}

export const paymentStatusMap: Record<PaymentStatusInput, PaymentStatus> = {
  [PaymentStatusInput.PENDING]: PaymentStatus.PENDING,
  [PaymentStatusInput.PROCESSING]: PaymentStatus.PROCESSING,
  [PaymentStatusInput.PAID]: PaymentStatus.PAID,
  [PaymentStatusInput.OVERDUE]: PaymentStatus.OVERDUE,
  [PaymentStatusInput.FAILED]: PaymentStatus.FAILED,
  [PaymentStatusInput.CANCELLED]: PaymentStatus.CANCELLED,
};

export const paymentMethodMap: Record<PaymentMethodInput, PaymentMethod> = {
  [PaymentMethodInput.BANK_TRANSFER]: PaymentMethod.BANK_TRANSFER,
  [PaymentMethodInput.CASH]: PaymentMethod.CASH,
  [PaymentMethodInput.POS]: PaymentMethod.POS,
  [PaymentMethodInput.CARD]: PaymentMethod.CARD,
  [PaymentMethodInput.ONLINE_GATEWAY]: PaymentMethod.ONLINE_GATEWAY,
};

export class CreatePaymentDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenancyId!: string;

  @ApiProperty({ example: 2400000 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount!: number;

  @ApiProperty({ example: '2026-06-01' })
  @IsDateString()
  dueDate!: string;

  @ApiPropertyOptional({ example: '2026-05-31T10:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  paidAt?: string;

  @ApiPropertyOptional({ enum: PaymentStatusInput, default: 'pending' })
  @IsOptional()
  @IsEnum(PaymentStatusInput)
  status: PaymentStatusInput = PaymentStatusInput.PENDING;

  @ApiProperty({ enum: PaymentMethodInput })
  @IsEnum(PaymentMethodInput)
  method!: PaymentMethodInput;

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

  @ApiPropertyOptional({
    example: 'https://storage.casax.ng/proofs/receipt.pdf',
  })
  @IsOptional()
  @IsUrl()
  proofUrl?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  collectedByCaretakerId?: string;
}
