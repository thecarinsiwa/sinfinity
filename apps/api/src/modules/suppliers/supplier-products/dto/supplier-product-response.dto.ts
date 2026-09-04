import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SupplierProductResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  supplierId!: string;

  @ApiProperty()
  productId!: string;

  @ApiPropertyOptional({ nullable: true, example: 'SZ-SW-9300' })
  supplierSku!: string | null;

  @ApiProperty({ example: '850.0000', description: 'Decimal string' })
  unitPrice!: string;

  @ApiPropertyOptional({ nullable: true })
  currencyId!: string | null;

  @ApiPropertyOptional({
    nullable: true,
    example: '10.0000',
    description: 'Decimal string',
  })
  moq!: string | null;

  @ApiPropertyOptional({ nullable: true, example: 21 })
  leadTimeDays!: number | null;

  @ApiProperty()
  isAvailable!: boolean;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
