import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProductModelResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  brandId!: string;

  @ApiProperty({ example: 'Catalyst 9300' })
  name!: string;

  @ApiPropertyOptional({
    nullable: true,
    example: 'C9300-24T',
  })
  manufacturerSku!: string | null;

  @ApiPropertyOptional({ nullable: true })
  description!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
