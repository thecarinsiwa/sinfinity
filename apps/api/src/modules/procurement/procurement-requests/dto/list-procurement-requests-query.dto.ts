import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../../../common/dto/pagination-query.dto';
import {
  PROCUREMENT_REQUEST_PRIORITIES,
  PROCUREMENT_REQUEST_STATUSES,
  type ProcurementRequestPriority,
  type ProcurementRequestStatus,
} from '../procurement-request-statuses';

export class ListProcurementRequestsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  organizationId?: string;

  @ApiPropertyOptional({ example: 'PR-2026' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  search?: string;

  @ApiPropertyOptional({ enum: PROCUREMENT_REQUEST_STATUSES })
  @IsOptional()
  @IsIn(PROCUREMENT_REQUEST_STATUSES)
  status?: ProcurementRequestStatus;

  @ApiPropertyOptional({ enum: PROCUREMENT_REQUEST_PRIORITIES })
  @IsOptional()
  @IsIn(PROCUREMENT_REQUEST_PRIORITIES)
  priority?: ProcurementRequestPriority;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  opportunityId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  salesOrderId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  requestedBy?: string;
}
