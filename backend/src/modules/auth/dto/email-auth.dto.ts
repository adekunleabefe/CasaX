import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class AuthEmailDto {
  @ApiProperty({ example: 'ade@casax.dev' })
  @IsEmail()
  @MaxLength(255)
  email!: string;
}

export class AuthTokenDto {
  @ApiProperty({ description: 'One-time secure email token' })
  @IsString()
  @MinLength(20)
  @MaxLength(256)
  token!: string;
}

export class ResetPasswordDto extends AuthTokenDto {
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
