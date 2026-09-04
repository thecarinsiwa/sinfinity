import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProductSubcategoryResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  categoryId!: string;

  @ApiProperty({ example: 'LAPTOP' })
  code!: string;

  @ApiProperty({ example: 'Ordinateurs portables' })
  name!: string;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
