import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UNIT_TYPES, type UnitType } from './create-unit.dto';

export class UnitResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ example: 'PCS' })
  code!: string;

  @ApiProperty({ example: 'Piece' })
  name!: string;

  @ApiPropertyOptional({ example: 'pc', nullable: true })
  symbol!: string | null;

  @ApiProperty({ enum: UNIT_TYPES, example: 'count' })
  unitType!: UnitType;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
