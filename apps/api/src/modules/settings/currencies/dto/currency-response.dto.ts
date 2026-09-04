import { ApiProperty } from '@nestjs/swagger';

export class CurrencyResponseDto {
  @ApiProperty({ example: '0191e6b8-4c3a-7b2d-9f1e-2a3b4c5d6e7f' })
  id!: string;

  @ApiProperty({ example: 'USD' })
  code!: string;

  @ApiProperty({ example: 'US Dollar' })
  name!: string;

  @ApiProperty({ example: '$' })
  symbol!: string;

  @ApiProperty({ example: 2 })
  decimalPlaces!: number;

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiProperty({ example: '2026-09-04 10:00:00.000' })
  createdAt!: string;

  @ApiProperty({ example: '2026-09-04 10:00:00.000' })
  updatedAt!: string;
}
