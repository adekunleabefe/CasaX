import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApplicationStatusInput } from './list-applications-query.dto';

export class UpdateApplicationDto {
  @ApiPropertyOptional({
    enum: [
      ApplicationStatusInput.PENDING,
      ApplicationStatusInput.INSPECTION_BOOKED,
      ApplicationStatusInput.UNDER_REVIEW,
    ],
  })
  @IsOptional()
  @IsEnum(ApplicationStatusInput)
  status?: ApplicationStatusInput;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

export class RejectApplicationDto {
  @ApiPropertyOptional({ example: 'Applicant did not meet requirements.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
