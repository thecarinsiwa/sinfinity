import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  PROCUREMENT_REQUEST_PRIORITIES,
  PROCUREMENT_REQUEST_STATUSES,
  type ProcurementRequestPriority,
  type ProcurementRequestStatus,
} from '../procurement-request-statuses';
import { ProcurementRequestItemResponseDto } from './procurement-request-item.dto';

export class ProcurementRequestResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiProperty({ example: 'PR-2026-001' })
  requestNumber!: string;

  @ApiProperty()
  title!: string;

  @ApiPropertyOptional({ nullable: true })
  requestedBy!: string | null;

  @ApiPropertyOptional({ nullable: true })
  opportunityId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  salesOrderId!: string | null;

  @ApiPropertyOptional({ nullable: true, example: '2026-10-01' })
  neededBy!: string | null;

  @ApiProperty({ enum: PROCUREMENT_REQUEST_STATUSES })
  status!: ProcurementRequestStatus;

  @ApiProperty({ enum: PROCUREMENT_REQUEST_PRIORITIES })
  priority!: ProcurementRequestPriority;

  @ApiPropertyOptional({ nullable: true })
  notes!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;

  @ApiPropertyOptional({ type: [ProcurementRequestItemResponseDto] })
  items?: ProcurementRequestItemResponseDto[];
}
