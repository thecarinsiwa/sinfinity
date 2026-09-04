import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CountryResponseDto {
  @ApiProperty({ example: '0191e6b8-4c3a-7b2d-9f1e-2a3b4c5d6e7f' })
  id!: string;

  @ApiProperty({ example: 'CD' })
  code!: string;

  @ApiPropertyOptional({ example: 'COD', nullable: true })
  code3!: string | null;

  @ApiProperty({ example: 'Congo, Democratic Republic of the' })
  name!: string;

  @ApiPropertyOptional({ example: '+243', nullable: true })
  phoneCode!: string | null;

  @ApiProperty({ example: '2026-09-04 10:00:00.000' })
  createdAt!: string;

  @ApiProperty({ example: '2026-09-04 10:00:00.000' })
  updatedAt!: string;
}
