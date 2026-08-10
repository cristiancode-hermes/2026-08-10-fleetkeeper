import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'carlos', description: 'Username O email' })
  @IsString()
  identifier: string;

  @ApiProperty({ example: 'fleet123456' })
  @IsString()
  @MinLength(8)
  password: string;
}
