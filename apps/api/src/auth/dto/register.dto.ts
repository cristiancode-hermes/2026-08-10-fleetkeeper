import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'carlos' })
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  username: string;

  @ApiProperty({ example: 'carlos@flota.es' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'fleet123456' })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;
}
