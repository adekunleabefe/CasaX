import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class SaveAgreementDto {
  @ApiPropertyOptional({ example: 'Tenancy agreement - Cedar Court / B12' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(180)
  title?: string;

  @ApiPropertyOptional({ description: 'Markdown agreement content.' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(30000)
  content?: string;
}
