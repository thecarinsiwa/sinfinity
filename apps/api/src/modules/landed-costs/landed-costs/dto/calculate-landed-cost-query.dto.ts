import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import {
  ALLOCATION_METHODS,
  type AllocationMethod,
} from '../../landed-costs-engine';

export class CalculateLandedCostQueryDto {
  @ApiPropertyOptional({
    enum: ALLOCATION_METHODS,
    default: 'value',
    description:
      'Allocation of total_additional_costs across items: value (goods_cost), weight or volume (from shipment_items).',
  })
  @IsOptional()
  @IsIn([...ALLOCATION_METHODS])
  method?: AllocationMethod = 'value';
}
