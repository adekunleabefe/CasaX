import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PropertyStatus, UnitReadinessStatus, VacancyStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import {
  PropertyStatusInput,
  propertyStatusMap,
} from '../../properties/dto/create-property.dto';
import { UnitStatusInput } from '../../units/dto/create-unit.dto';
import { PaymentFrequencyInput } from '../../tenancies/dto/convert-to-tenancy.dto';

export class ReviewNoteDto {
  @ApiPropertyOptional({ example: 'Property documents reviewed by CasaX.' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}

export class AdminUpdateUnitDto {
  @ApiPropertyOptional({ example: 'Self-contained 1' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  unitNumber?: string;

  @ApiPropertyOptional({ example: 'Self-contained 1' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name?: string;

  @ApiPropertyOptional({ example: 500000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  rentAmount?: number;

  @ApiPropertyOptional({ example: 500000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  annualRent?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(50)
  bedroomCount?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(50)
  bedrooms?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(50)
  bathroomCount?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(50)
  bathrooms?: number;

  @ApiPropertyOptional({ example: 'Self-contained' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  unitType?: string;

  @ApiPropertyOptional({ example: 'Bright self-contained apartment in Lekki' })
  @IsOptional()
  @IsString()
  @MaxLength(140)
  listingTitle?: string;

  @ApiPropertyOptional({ example: 'CasaX-reviewed apartment ready for inspection.' })
  @IsOptional()
  @IsString()
  @MaxLength(1200)
  publicDescription?: string;

  @ApiPropertyOptional({ example: 'CasaX-reviewed apartment ready for inspection.' })
  @IsOptional()
  @IsString()
  @MaxLength(1200)
  listingDescription?: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['Photo placeholder: living area', 'Photo placeholder: exterior'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(500, { each: true })
  photos?: string[];

  @ApiPropertyOptional({ type: [String], example: ['Water supply', 'Gated compound'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(80, { each: true })
  amenities?: string[];

  @ApiPropertyOptional({ example: 50000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  serviceCharge?: number;

  @ApiPropertyOptional({ example: 500000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  depositAmount?: number;

  @ApiPropertyOptional({ example: '2026-07-01' })
  @IsOptional()
  @IsDateString()
  availabilityDate?: string;

  @ApiPropertyOptional({ example: 'Inspection available weekdays after 11am.' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  inspectionNotes?: string;

  @ApiPropertyOptional({ enum: UnitReadinessStatus })
  @IsOptional()
  @IsEnum(UnitReadinessStatus)
  readinessStatus?: UnitReadinessStatus;

  @ApiPropertyOptional({ enum: UnitStatusInput })
  @IsOptional()
  @IsEnum(UnitStatusInput)
  status?: UnitStatusInput;
}

export class AdminUnitMixDto {
  @ApiProperty({ example: 'Self-contained' })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  unitType!: string;

  @ApiProperty({ example: 4 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10000)
  quantity!: number;

  @ApiProperty({ example: 500000 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  annualRent!: number;

  @ApiPropertyOptional({ example: 'SC' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  prefix?: string;
}

export class AdminCreatePropertyDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  landlordId!: string;

  @ApiProperty({ example: 'Lekki Heights' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @ApiProperty({ example: 'Serviced apartment building' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  type!: string;

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

  @ApiPropertyOptional({ example: 'CasaX-managed serviced rental building.' })
  @IsOptional()
  @IsString()
  @MaxLength(1200)
  description?: string;

  @ApiPropertyOptional({ example: 'Direct owner' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  ownershipType?: string;

  @ApiPropertyOptional({ example: 12 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10000)
  numberOfUnits?: number;

  @ApiPropertyOptional({
    type: [AdminUnitMixDto],
    example: [
      {
        unitType: 'Self-contained',
        quantity: 4,
        annualRent: 500000,
        prefix: 'SC',
      },
      {
        unitType: 'Mini flat',
        quantity: 6,
        annualRent: 800000,
        prefix: 'MF',
      },
    ],
  })
  @IsOptional()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AdminUnitMixDto)
  unitMix?: AdminUnitMixDto[];

  @ApiPropertyOptional({
    enum: PropertyStatusInput,
    default: PropertyStatusInput.ACTIVE,
  })
  @IsOptional()
  @IsEnum(PropertyStatusInput)
  status?: PropertyStatusInput;
}

export class AdminUpdatePropertyDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  landlordId?: string;

  @ApiPropertyOptional({ example: 'Lekki Heights' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ example: 'Serviced apartment building' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  type?: string;

  @ApiPropertyOptional({ example: '14 Admiralty Way' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  address?: string;

  @ApiPropertyOptional({ example: 'Lekki' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({ example: 'Lagos' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  state?: string;

  @ApiPropertyOptional({ example: 'CasaX-managed serviced rental building.' })
  @IsOptional()
  @IsString()
  @MaxLength(1200)
  description?: string;

  @ApiPropertyOptional({ example: 'Direct owner' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  ownershipType?: string;

  @ApiPropertyOptional({ example: 12 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10000)
  numberOfUnits?: number;

  @ApiPropertyOptional({ enum: PropertyStatusInput })
  @IsOptional()
  @IsEnum(PropertyStatusInput)
  status?: PropertyStatusInput;
}

export const adminPropertyStatusMap: Record<PropertyStatusInput, PropertyStatus> =
  propertyStatusMap;

export class AdminCreateUnitDto {
  @ApiProperty({ example: 'Unit 1' })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name!: string;

  @ApiProperty({ example: 'Mini-flat' })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  unitType!: string;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(50)
  bedroomCount!: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(50)
  bathroomCount?: number;

  @ApiProperty({ example: 800000 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  rentAmount!: number;

  @ApiPropertyOptional({ example: 50000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  serviceCharge?: number;

  @ApiPropertyOptional({ example: 500000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  depositAmount?: number;

  @ApiPropertyOptional({ example: 'Ready-to-inspect mini-flat in Yaba' })
  @IsOptional()
  @IsString()
  @MaxLength(140)
  listingTitle?: string;

  @ApiPropertyOptional({ example: 'CasaX-reviewed unit setup notes for publishing.' })
  @IsOptional()
  @IsString()
  @MaxLength(1200)
  publicDescription?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(500, { each: true })
  photos?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(80, { each: true })
  amenities?: string[];

  @ApiPropertyOptional({ example: '2026-07-01' })
  @IsOptional()
  @IsDateString()
  availabilityDate?: string;

  @ApiPropertyOptional({ example: 'Inspection available on request.' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  inspectionNotes?: string;

  @ApiPropertyOptional({ enum: UnitReadinessStatus })
  @IsOptional()
  @IsEnum(UnitReadinessStatus)
  readinessStatus?: UnitReadinessStatus;

  @ApiPropertyOptional({ enum: UnitStatusInput })
  @IsOptional()
  @IsEnum(UnitStatusInput)
  status?: UnitStatusInput;

  @ApiPropertyOptional({ example: 'vacant' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  occupancyStatus?: string;
}

export class AdminCreateUnitImageDto {
  @ApiPropertyOptional({ example: 'Cover photo' })
  @IsOptional()
  @IsString()
  @MaxLength(140)
  caption?: string;

  @ApiPropertyOptional({ example: 'cover' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  category?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isCover?: boolean;
}

export class AdminUpdateUnitImageDto {
  @ApiPropertyOptional({ example: 'Bathroom' })
  @IsOptional()
  @IsString()
  @MaxLength(140)
  caption?: string;

  @ApiPropertyOptional({ example: 'bathroom' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  category?: string;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isCover?: boolean;
}

export class AdminPropertyAssetDto {
  @ApiProperty({ example: 'Front exterior photo' })
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  title!: string;

  @ApiPropertyOptional({ example: 'https://example.com/file.jpg' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  url?: string;

  @ApiPropertyOptional({ example: 'Upload storage pending; metadata captured.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

export class AdminOnboardExistingResidentDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  unitId!: string;

  @ApiProperty({ example: 'Ada' })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  firstName!: string;

  @ApiProperty({ example: 'Okafor' })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  lastName!: string;

  @ApiPropertyOptional({ example: 'ada@example.com' })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  email?: string;

  @ApiPropertyOptional({ example: '+2348012345678' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @ApiProperty({ example: '2026-06-01' })
  @IsDateString()
  moveInDate!: string;

  @ApiProperty({ example: '2026-06-01' })
  @IsDateString()
  leaseStartDate!: string;

  @ApiProperty({ example: '2027-05-31' })
  @IsDateString()
  leaseEndDate!: string;

  @ApiProperty({ enum: PaymentFrequencyInput, example: 'yearly' })
  @IsEnum(PaymentFrequencyInput)
  paymentFrequency!: PaymentFrequencyInput;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  sendInvite?: boolean;
}

export class AdminOnboardApprovedApplicantDto {
  @ApiProperty({ example: '2026-06-01' })
  @IsDateString()
  moveInDate!: string;

  @ApiProperty({ example: '2026-06-01' })
  @IsDateString()
  leaseStartDate!: string;

  @ApiProperty({ example: '2027-05-31' })
  @IsDateString()
  leaseEndDate!: string;

  @ApiProperty({ enum: PaymentFrequencyInput, example: 'yearly' })
  @IsEnum(PaymentFrequencyInput)
  paymentFrequency!: PaymentFrequencyInput;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  sendInvite?: boolean;
}

export class AdminUpdateVacancyDto {
  @ApiPropertyOptional({ example: 'Self-contained apartment in Lekki' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(140)
  title?: string;

  @ApiPropertyOptional({ example: 'Verified vacancy managed by CasaX.' })
  @IsOptional()
  @IsString()
  @MaxLength(1200)
  description?: string;

  @ApiPropertyOptional({ enum: VacancyStatus })
  @IsOptional()
  @IsEnum(VacancyStatus)
  status?: VacancyStatus;
}
