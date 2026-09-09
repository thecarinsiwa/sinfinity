import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  LANDED_COST_STATUSES,
  type LandedCostStatus,
} from '../landed-cost-statuses';
import { LandedCostItemResponseDto } from './landed-cost-item.dto';

export class LandedCostResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiProperty({ example: 'LC-2026-001' })
  reference!: string;

  @ApiPropertyOptional({ nullable: true })
  purchaseOrderId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  shipmentId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  currencyId!: string | null;

  @ApiProperty({ example: '9500.0000' })
  goodsCost!: string;

  @ApiProperty({ example: '0.0000' })
  totalAdditionalCosts!: string;

  @ApiProperty({ example: '9500.0000' })
  totalLandedCost!: string;

  @ApiProperty({ enum: LANDED_COST_STATUSES })
  status!: LandedCostStatus;

  @ApiPropertyOptional({ nullable: true })
  calculatedAt!: string | null;

  @ApiPropertyOptional({ nullable: true })
  calculatedBy!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;

  @ApiPropertyOptional({ type: [LandedCostItemResponseDto] })
  items?: LandedCostItemResponseDto[];
}
