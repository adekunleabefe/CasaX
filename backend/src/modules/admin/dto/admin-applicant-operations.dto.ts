import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export enum AdminInspectionStatusInput {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum AdminApplicationStatusInput {
  UNDER_REVIEW = 'under_review',
  INSPECTION_REQUIRED = 'inspection_required',
  INSPECTION_SCHEDULED = 'inspection_scheduled',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export class AdminUpdateInspectionDto {
  @ApiProperty({ enum: AdminInspectionStatusInput })
  @IsEnum(AdminInspectionStatusInput)
  status!: AdminInspectionStatusInput;

  @ApiPropertyOptional({ example: '2026-06-08T10:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @ApiPropertyOptional({ example: 'Confirmed by CasaX operations.' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}

export class AdminUpdateApplicationDto {
  @ApiProperty({ enum: AdminApplicationStatusInput })
  @IsEnum(AdminApplicationStatusInput)
  status!: AdminApplicationStatusInput;

  @ApiPropertyOptional({ example: 'Application review is complete.' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;
}
