import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import { PaginationQueryDto } from '../../../../common/dto/pagination-query.dto';
import {
  CONTRACT_STATUSES,
  type ContractStatus,
} from '../../contract-statuses';
import {
  SCHEDULE_FREQUENCIES,
  type ScheduleFrequency,
} from '../../schedule-frequencies';

const DECIMAL_REGEX = /^-?\d+(\.\d+)?$/;

export class CreateMaintenanceContractDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  organizationId?: string;

  @ApiProperty({ example: 'MC-2026-001' })
  @IsString()
  @MaxLength(64)
  contractNumber!: string;

  @ApiProperty()
  @IsUUID('all')
  customerId!: string;

  @ApiProperty({ example: '2026-01-01', description: 'ISO date YYYY-MM-DD' })
  @IsDateString()
  startDate!: string;

  @ApiPropertyOptional({ example: '2026-12-31', nullable: true })
  @IsOptional()
  @IsDateString()
  endDate?: string | null;

  @ApiPropertyOptional({ nullable: true, example: 24 })
  @IsOptional()
  @IsInt()
  @Min(0)
  slaHours?: number | null;

  @ApiPropertyOptional({ example: '12000.0000', nullable: true })
  @IsOptional()
  @IsString()
  @Matches(DECIMAL_REGEX, { message: 'amount must be a decimal string' })
  amount?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  currencyId?: string | null;
}

export class UpdateMaintenanceContractDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  contractNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  customerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsDateString()
  endDate?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  slaHours?: number | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @Matches(DECIMAL_REGEX, { message: 'amount must be a decimal string' })
  amount?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  currencyId?: string | null;
}

export class TransitionMaintenanceContractDto {
  @ApiProperty({ enum: CONTRACT_STATUSES })
  @IsIn([...CONTRACT_STATUSES])
  toStatus!: ContractStatus;
}

export class MaintenanceContractResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiProperty()
  contractNumber!: string;

  @ApiProperty()
  customerId!: string;

  @ApiProperty()
  startDate!: string;

  @ApiPropertyOptional({ nullable: true })
  endDate!: string | null;

  @ApiPropertyOptional({ nullable: true })
  slaHours!: number | null;

  @ApiProperty({ enum: CONTRACT_STATUSES })
  status!: ContractStatus;

  @ApiPropertyOptional({ nullable: true })
  amount!: string | null;

  @ApiPropertyOptional({ nullable: true })
  currencyId!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;

  @ApiPropertyOptional({ nullable: true })
  deletedAt!: string | null;

  @ApiPropertyOptional({ type: () => [MaintenanceContractItemResponseDto] })
  items?: MaintenanceContractItemResponseDto[];

  @ApiPropertyOptional({ type: () => [MaintenanceScheduleResponseDto] })
  schedules?: MaintenanceScheduleResponseDto[];
}

export class CreateMaintenanceContractItemDto {
  @ApiProperty()
  @IsUUID('all')
  productId!: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  serialNumberId?: string | null;

  @ApiPropertyOptional({ example: 'full', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  coverageLevel?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  notes?: string | null;
}

export class UpdateMaintenanceContractItemDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  productId?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  serialNumberId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  coverageLevel?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  notes?: string | null;
}

export class MaintenanceContractItemResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  maintenanceContractId!: string;

  @ApiPropertyOptional({ nullable: true })
  productId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  serialNumberId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  coverageLevel!: string | null;

  @ApiPropertyOptional({ nullable: true })
  notes!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class CreateMaintenanceScheduleDto {
  @ApiProperty({ example: 'Quarterly preventive' })
  @IsString()
  @MaxLength(255)
  title!: string;

  @ApiPropertyOptional({
    enum: SCHEDULE_FREQUENCIES,
    default: 'quarterly',
  })
  @IsOptional()
  @IsIn([...SCHEDULE_FREQUENCIES])
  frequency?: ScheduleFrequency;

  @ApiPropertyOptional({
    example: '2026-04-01',
    nullable: true,
    description: 'ISO date YYYY-MM-DD',
  })
  @IsOptional()
  @IsDateString()
  nextDueAt?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  technicianId?: string | null;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateMaintenanceScheduleDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({ enum: SCHEDULE_FREQUENCIES })
  @IsOptional()
  @IsIn([...SCHEDULE_FREQUENCIES])
  frequency?: ScheduleFrequency;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsDateString()
  nextDueAt?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  technicianId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class MaintenanceScheduleResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  maintenanceContractId!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty({ enum: SCHEDULE_FREQUENCIES })
  frequency!: ScheduleFrequency;

  @ApiPropertyOptional({ nullable: true })
  nextDueAt!: string | null;

  @ApiPropertyOptional({ nullable: true })
  technicianId!: string | null;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class ListMaintenanceContractsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  organizationId?: string;

  @ApiPropertyOptional({ example: 'MC-2026' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  search?: string;

  @ApiPropertyOptional({ enum: CONTRACT_STATUSES })
  @IsOptional()
  @IsIn([...CONTRACT_STATUSES])
  status?: ContractStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  customerId?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    if (value === 'true' || value === true || value === '1' || value === 1) {
      return true;
    }
    if (value === 'false' || value === false || value === '0' || value === 0) {
      return false;
    }
    return value;
  })
  @IsBoolean()
  includeDeleted?: boolean;
}
