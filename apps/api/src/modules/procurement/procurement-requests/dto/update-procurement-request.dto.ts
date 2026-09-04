import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import {
  PROCUREMENT_REQUEST_PRIORITIES,
  type ProcurementRequestPriority,
} from '../procurement-request-statuses';

export class UpdateProcurementRequestDto {
  @ApiPropertyOptional({ example: 'PR-2026-001' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  requestNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  requestedBy?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  opportunityId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  salesOrderId?: string | null;

  @ApiPropertyOptional({ nullable: true, example: '2026-10-01' })
  @IsOptional()
  @IsDateString()
  neededBy?: string | null;

  @ApiPropertyOptional({ enum: PROCUREMENT_REQUEST_PRIORITIES })
  @IsOptional()
  @IsIn(PROCUREMENT_REQUEST_PRIORITIES)
  priority?: ProcurementRequestPriority;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  notes?: string | null;
}
