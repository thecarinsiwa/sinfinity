import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CityResponseDto {
  @ApiProperty({ example: '0191e6b8-4c3a-7b2d-9f1e-2a3b4c5d6e7f' })
  id!: string;

  @ApiProperty({ example: '0191e6b8-4c3a-7b2d-9f1e-aaaaaaaaaaaa' })
  countryId!: string;

  @ApiProperty({ example: 'Kinshasa' })
  name!: string;

  @ApiPropertyOptional({ example: 'Kinshasa', nullable: true })
  region!: string | null;

  @ApiProperty({ example: '2026-09-04 10:00:00.000' })
  createdAt!: string;

  @ApiProperty({ example: '2026-09-04 10:00:00.000' })
  updatedAt!: string;
}
