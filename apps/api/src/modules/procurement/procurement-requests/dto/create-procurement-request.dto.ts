import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import {
  PROCUREMENT_REQUEST_PRIORITIES,
  type ProcurementRequestPriority,
} from '../procurement-request-statuses';
import { CreateProcurementRequestItemDto } from './procurement-request-item.dto';

export class CreateProcurementRequestDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  organizationId?: string;

  @ApiProperty({ example: 'PR-2026-001' })
  @IsString()
  @MaxLength(64)
  requestNumber!: string;

  @ApiProperty({ example: '40 network switches Q4' })
  @IsString()
  @MaxLength(255)
  title!: string;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Defaults to the authenticated user',
  })
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

  @ApiPropertyOptional({
    enum: PROCUREMENT_REQUEST_PRIORITIES,
    default: 'medium',
  })
  @IsOptional()
  @IsIn(PROCUREMENT_REQUEST_PRIORITIES)
  priority?: ProcurementRequestPriority;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  notes?: string | null;

  @ApiPropertyOptional({ type: [CreateProcurementRequestItemDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => CreateProcurementRequestItemDto)
  items?: CreateProcurementRequestItemDto[];
}
