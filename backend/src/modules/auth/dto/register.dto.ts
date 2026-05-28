import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export enum SelfRegistrationRole {
  LANDLORD = 'LANDLORD',
  APPLICANT = 'APPLICANT',
}

export class RegisterDto {
  @ApiProperty({ example: 'daniel@example.com' })
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @ApiProperty({ minLength: 8, example: 'SecurePassword123!' })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;

  @ApiProperty({ example: 'Daniel' })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  firstName!: string;

  @ApiProperty({ example: 'Okafor' })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  lastName!: string;

  @ApiProperty({
    enum: SelfRegistrationRole,
    default: SelfRegistrationRole.APPLICANT,
    example: 'landlord',
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsEnum(SelfRegistrationRole)
  role: SelfRegistrationRole = SelfRegistrationRole.APPLICANT;
}
