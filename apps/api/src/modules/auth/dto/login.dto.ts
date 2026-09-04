import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin@sinfinity.cd' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'string', minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;
}
