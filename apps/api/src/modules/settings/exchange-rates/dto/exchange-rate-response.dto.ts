import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ExchangeRateResponseDto {
  @ApiProperty({ example: '0191e6b8-4c3a-7b2d-9f1e-2a3b4c5d6e7f' })
  id!: string;

  @ApiProperty()
  fromCurrencyId!: string;

  @ApiProperty()
  toCurrencyId!: string;

  @ApiProperty({
    example: '2850.50000000',
    description: 'Decimal string (never float)',
  })
  rate!: string;

  @ApiProperty({ example: '2026-09-04' })
  rateDate!: string;

  @ApiPropertyOptional({ example: 'manual', nullable: true })
  source!: string | null;

  @ApiProperty({ example: '2026-09-04 10:00:00.000' })
  createdAt!: string;
}
