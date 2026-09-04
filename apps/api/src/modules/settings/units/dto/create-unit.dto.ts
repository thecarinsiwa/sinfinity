import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export const UNIT_TYPES = [
  'count',
  'weight',
  'length',
  'volume',
  'other',
] as const;

export type UnitType = (typeof UNIT_TYPES)[number];

export class CreateUnitDto {
  @ApiProperty({ example: 'PCS' })
  @IsString()
  @MaxLength(32)
  code!: string;

  @ApiProperty({ example: 'Piece' })
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiPropertyOptional({ example: 'pc', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  symbol?: string | null;

  @ApiPropertyOptional({ enum: UNIT_TYPES, example: 'count', default: 'count' })
  @IsOptional()
  @IsIn(UNIT_TYPES)
  unitType?: UnitType;
}
