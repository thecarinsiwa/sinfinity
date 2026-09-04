import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ShippingTermResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ example: 'FOB' })
  code!: string;

  @ApiProperty({ example: 'Free On Board' })
  name!: string;

  @ApiPropertyOptional({ nullable: true })
  description!: string | null;

  @ApiPropertyOptional({ example: '2020', nullable: true })
  incotermVersion!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
