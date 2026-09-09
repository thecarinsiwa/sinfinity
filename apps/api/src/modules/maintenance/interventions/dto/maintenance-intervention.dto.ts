import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { PaginationQueryDto } from '../../../../common/dto/pagination-query.dto';
import {
  INTERVENTION_STATUSES,
  INTERVENTION_TYPES,
  type InterventionStatus,
  type InterventionType,
} from '../../intervention-statuses';

export class CreateMaintenanceInterventionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  organizationId?: string;

  @ApiProperty()
  @IsUUID('all')
  customerId!: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  ticketId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  scheduleId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  contractId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  technicianId?: string | null;

  @ApiPropertyOptional({
    enum: INTERVENTION_TYPES,
    default: 'corrective',
  })
  @IsOptional()
  @IsIn([...INTERVENTION_TYPES])
  interventionType?: InterventionType;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsDateString()
  startedAt?: string | null;
}

export class UpdateMaintenanceInterventionDto {
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  ticketId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  scheduleId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  contractId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  technicianId?: string | null;

  @ApiPropertyOptional({ enum: INTERVENTION_TYPES })
  @IsOptional()
  @IsIn([...INTERVENTION_TYPES])
  interventionType?: InterventionType;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsDateString()
  startedAt?: string | null;
}

export class TransitionMaintenanceInterventionDto {
  @ApiProperty({ enum: INTERVENTION_STATUSES })
  @IsIn([...INTERVENTION_STATUSES])
  toStatus!: InterventionStatus;
}

export class MaintenanceInterventionResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiPropertyOptional({ nullable: true })
  ticketId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  scheduleId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  contractId!: string | null;

  @ApiProperty()
  customerId!: string;

  @ApiPropertyOptional({ nullable: true })
  technicianId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  startedAt!: string | null;

  @ApiPropertyOptional({ nullable: true })
  endedAt!: string | null;

  @ApiProperty({ enum: INTERVENTION_TYPES })
  interventionType!: InterventionType;

  @ApiProperty({ enum: INTERVENTION_STATUSES })
  status!: InterventionStatus;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;

  @ApiPropertyOptional({ type: () => [MaintenanceReportResponseDto] })
  reports?: MaintenanceReportResponseDto[];
}

export class CreateMaintenanceReportDto {
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  summary?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(20000)
  actionsTaken?: string | null;

  @ApiPropertyOptional({
    description: 'Free-form JSON object or array of parts used',
    nullable: true,
  })
  @IsOptional()
  partsUsed?: Record<string, unknown> | unknown[] | null;

  @ApiPropertyOptional({
    type: [String],
    nullable: true,
    description: 'Document UUIDs belonging to the same organization',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  documentIds?: string[] | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsDateString()
  reportedAt?: string | null;
}

export class UpdateMaintenanceReportDto {
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  summary?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(20000)
  actionsTaken?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  partsUsed?: Record<string, unknown> | unknown[] | null;

  @ApiPropertyOptional({ type: [String], nullable: true })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  documentIds?: string[] | null;
}

export class MaintenanceReportResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  interventionId!: string;

  @ApiPropertyOptional({ nullable: true })
  summary!: string | null;

  @ApiPropertyOptional({ nullable: true })
  actionsTaken!: string | null;

  @ApiPropertyOptional({ nullable: true })
  partsUsed!: Record<string, unknown> | unknown[] | null;

  @ApiPropertyOptional({ type: [String], nullable: true })
  documentIds!: string[] | null;

  @ApiProperty()
  reportedAt!: string;

  @ApiProperty()
  createdAt!: string;
}

export class ListMaintenanceInterventionsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  organizationId?: string;

  @ApiPropertyOptional({ enum: INTERVENTION_STATUSES })
  @IsOptional()
  @IsIn([...INTERVENTION_STATUSES])
  status?: InterventionStatus;

  @ApiPropertyOptional({ enum: INTERVENTION_TYPES })
  @IsOptional()
  @IsIn([...INTERVENTION_TYPES])
  interventionType?: InterventionType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  customerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  ticketId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  contractId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  scheduleId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  technicianId?: string;
}
