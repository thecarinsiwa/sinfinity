import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProductUnitResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ example: 'PCS' })
  code!: string;

  @ApiProperty({ example: 'Pièce' })
  name!: string;

  @ApiPropertyOptional({ nullable: true, example: 'pcs' })
  symbol!: string | null;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Optional link to global settings units',
  })
  unitId!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
