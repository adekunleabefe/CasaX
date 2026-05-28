import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class ValidateSetupAccountTokenDto {
  @ApiProperty({ description: 'One-time tenant invitation token' })
  @IsString()
  @MinLength(20)
  @MaxLength(256)
  token!: string;
}

export class SetupAccountDto extends ValidateSetupAccountTokenDto {
  @ApiProperty({ minLength: 8, example: 'SecurePassword123!' })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;

  @ApiProperty({ minLength: 8, example: 'SecurePassword123!' })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  confirmPassword!: string;
}
