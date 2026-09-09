import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../../../common/dto/pagination-query.dto';
import {
  LANDED_COST_STATUSES,
  type LandedCostStatus,
} from '../landed-cost-statuses';

export class ListLandedCostsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  organizationId?: string;

  @ApiPropertyOptional({ example: 'LC-2026' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  search?: string;

  @ApiPropertyOptional({ enum: LANDED_COST_STATUSES })
  @IsOptional()
  @IsIn([...LANDED_COST_STATUSES])
  status?: LandedCostStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  purchaseOrderId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  shipmentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  currencyId?: string;
}
