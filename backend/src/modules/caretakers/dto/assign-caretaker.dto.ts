import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, MaxLength } from 'class-validator';

export class AssignCaretakerDto {
  @ApiProperty({ example: 'caretaker@casax.ng' })
  @IsEmail()
  @MaxLength(255)
  caretakerEmail!: string;
}
