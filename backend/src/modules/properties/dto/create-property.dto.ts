import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PropertyStatus } from '@prisma/client';
import {
  ArrayMinSize,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum PropertyStatusInput {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export const propertyStatusMap: Record<PropertyStatusInput, PropertyStatus> = {
  [PropertyStatusInput.ACTIVE]: PropertyStatus.ACTIVE,
  [PropertyStatusInput.INACTIVE]: PropertyStatus.INACTIVE,
};

export class UnitMixDto {
  @ApiProperty({ example: 'Self-contained' })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  unitType!: string;

  @ApiProperty({ example: 4 })
  @IsInt()
  @Min(1)
  @Max(10000)
  quantity!: number;

  @ApiProperty({ example: 500000 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  annualRent!: number;

  @ApiPropertyOptional({ example: 'Self-contained' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  unitNamingPrefix?: string;
}

export class CreatePropertyDto {
  @ApiProperty({ example: 'Lekki Heights' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @ApiProperty({ example: '14 Admiralty Way' })
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  address!: string;

  @ApiProperty({ example: 'Lekki' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  city!: string;

  @ApiProperty({ example: 'Lagos' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  state!: string;

  @ApiProperty({ example: 'Serviced apartment building' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  type!: string;

  @ApiPropertyOptional({
    enum: PropertyStatusInput,
    default: PropertyStatusInput.ACTIVE,
  })
  @IsEnum(PropertyStatusInput)
  status: PropertyStatusInput = PropertyStatusInput.ACTIVE;

  @ApiProperty({
    type: [UnitMixDto],
    example: [
      {
        unitType: 'Self-contained',
        quantity: 4,
        annualRent: 500000,
        unitNamingPrefix: 'Self-contained',
      },
      {
        unitType: 'Mini-flat',
        quantity: 6,
        annualRent: 800000,
        unitNamingPrefix: 'Mini-flat',
      },
    ],
  })
  @ValidateNested({ each: true })
  @Type(() => UnitMixDto)
  @ArrayMinSize(1)
  unitMix!: UnitMixDto[];
}
