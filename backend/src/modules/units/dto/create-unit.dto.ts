import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UnitStatus } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export enum UnitStatusInput {
  VACANT = 'vacant',
  OCCUPIED = 'occupied',
  PENDING_APPROVAL = 'pending_approval',
  MAINTENANCE = 'maintenance',
  INACTIVE = 'inactive',
}

export const unitStatusMap: Record<UnitStatusInput, UnitStatus> = {
  [UnitStatusInput.VACANT]: UnitStatus.VACANT,
  [UnitStatusInput.OCCUPIED]: UnitStatus.OCCUPIED,
  [UnitStatusInput.PENDING_APPROVAL]: UnitStatus.PENDING_APPROVAL,
  [UnitStatusInput.MAINTENANCE]: UnitStatus.MAINTENANCE,
  [UnitStatusInput.INACTIVE]: UnitStatus.INACTIVE,
};

export class CreateUnitDto {
  @ApiProperty({ example: 'Unit A3' })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name!: string;

  @ApiProperty({ example: 2400000 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  rentAmount!: number;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(0)
  @Max(50)
  bedroomCount!: number;

  @ApiProperty({ example: 'Apartment' })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  unitType!: string;

  @ApiPropertyOptional({
    enum: UnitStatusInput,
    default: UnitStatusInput.VACANT,
  })
  @IsEnum(UnitStatusInput)
  status: UnitStatusInput = UnitStatusInput.VACANT;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  isPubliclyVisible = false;
}
