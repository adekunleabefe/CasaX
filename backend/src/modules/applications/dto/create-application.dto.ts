import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class ManualApplicantDto {
  @ApiProperty({ example: 'adaobi@example.com' })
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @ApiProperty({ example: 'Adaobi' })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  firstName!: string;

  @ApiProperty({ example: 'Eze' })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  lastName!: string;

  @ApiPropertyOptional({ example: '+2348012345678' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;
}

export class CreateApplicationDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  propertyId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  unitId!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  vacancyListingId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  assignedCaretakerId?: string;

  @ApiPropertyOptional({
    type: ManualApplicantDto,
    description: 'Required when a landlord or caretaker submits an applicant.',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ManualApplicantDto)
  applicant?: ManualApplicantDto;

  @ApiPropertyOptional({ example: 'Inspected property on 22 May.' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
