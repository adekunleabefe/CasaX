import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PropertyStatus } from '@prisma/client';
import { IsEnum, IsString, MaxLength, MinLength } from 'class-validator';

export enum PropertyStatusInput {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export const propertyStatusMap: Record<PropertyStatusInput, PropertyStatus> = {
  [PropertyStatusInput.ACTIVE]: PropertyStatus.ACTIVE,
  [PropertyStatusInput.INACTIVE]: PropertyStatus.INACTIVE,
};

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
}
