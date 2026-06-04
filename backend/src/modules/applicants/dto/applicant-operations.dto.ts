import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class SaveRentalDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  vacancyListingId!: string;
}

export class CreateInspectionBookingDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  vacancyListingId!: string;

  @ApiPropertyOptional({
    example: '2026-06-08T10:00:00.000Z',
    description: 'Requested inspection time. Defaults to the next business day if omitted.',
  })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @ApiPropertyOptional({ example: 'I prefer morning inspection slots.' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}
