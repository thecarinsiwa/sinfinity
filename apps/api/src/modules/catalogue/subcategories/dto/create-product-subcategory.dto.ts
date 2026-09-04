import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateProductSubcategoryDto {
  @ApiProperty()
  @IsUUID('all')
  categoryId!: string;

  @ApiProperty({ example: 'LAPTOP' })
  @IsString()
  @MaxLength(64)
  code!: string;

  @ApiProperty({ example: 'Ordinateurs portables' })
  @IsString()
  @MaxLength(255)
  name!: string;
}
