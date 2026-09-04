import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import {
  PROCUREMENT_REQUEST_STATUSES,
  type ProcurementRequestStatus,
} from '../procurement-request-statuses';

export class TransitionProcurementRequestDto {
  @ApiProperty({ enum: PROCUREMENT_REQUEST_STATUSES })
  @IsIn(PROCUREMENT_REQUEST_STATUSES)
  toStatus!: ProcurementRequestStatus;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  notes?: string | null;
}
