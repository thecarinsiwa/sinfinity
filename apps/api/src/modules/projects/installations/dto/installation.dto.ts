import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';
import {
  INSTALLATION_STATUSES,
  type InstallationStatus,
} from '../../installation-statuses';
import {
  INSTALLATION_TASK_STATUSES,
  type InstallationTaskStatus,
} from '../../installation-task-statuses';

const DECIMAL_REGEX = /^-?\d+(\.\d+)?$/;

export class CreateInstallationDto {
  @ApiProperty({ example: 'Baie serveur bâtiment A' })
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  siteLocation?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  leadTechnicianId?: string | null;
}

export class UpdateInstallationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  siteLocation?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  leadTechnicianId?: string | null;
}

export class TransitionInstallationDto {
  @ApiProperty({ enum: INSTALLATION_STATUSES })
  @IsIn([...INSTALLATION_STATUSES])
  toStatus!: InstallationStatus;
}

export class InstallationResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  projectId!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional({ nullable: true })
  siteLocation!: string | null;

  @ApiPropertyOptional({ nullable: true })
  scheduledAt!: string | null;

  @ApiPropertyOptional({ nullable: true })
  completedAt!: string | null;

  @ApiProperty({ enum: INSTALLATION_STATUSES })
  status!: InstallationStatus;

  @ApiPropertyOptional({ nullable: true })
  leadTechnicianId!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;

  @ApiPropertyOptional({ type: () => [InstallationItemResponseDto] })
  items?: InstallationItemResponseDto[];

  @ApiPropertyOptional({ type: () => [InstallationTaskResponseDto] })
  tasks?: InstallationTaskResponseDto[];
}

export class CreateInstallationItemDto {
  @ApiProperty()
  @IsUUID('all')
  productId!: string;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Required when product is serialized; must be shipped',
  })
  @IsOptional()
  @IsUUID('all')
  serialNumberId?: string | null;

  @ApiPropertyOptional({
    example: '1.0000',
    description: 'Defaults to 1.0000; must be 1 for serialized products',
  })
  @IsOptional()
  @IsString()
  @Matches(DECIMAL_REGEX, { message: 'quantity must be a decimal string' })
  quantity?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  notes?: string | null;
}

export class UpdateInstallationItemDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  productId?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  serialNumberId?: string | null;

  @ApiPropertyOptional({ example: '1.0000' })
  @IsOptional()
  @IsString()
  @Matches(DECIMAL_REGEX, { message: 'quantity must be a decimal string' })
  quantity?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  notes?: string | null;
}

export class InstallationItemResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  installationId!: string;

  @ApiPropertyOptional({ nullable: true })
  productId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  serialNumberId!: string | null;

  @ApiProperty({ example: '1.0000' })
  quantity!: string;

  @ApiPropertyOptional({ nullable: true })
  installedAt!: string | null;

  @ApiPropertyOptional({ nullable: true })
  notes!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class CreateInstallationTaskDto {
  @ApiProperty({ example: 'Tirer la fibre' })
  @IsString()
  @MaxLength(255)
  title!: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  description?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  technicianId?: string | null;

  @ApiPropertyOptional({
    enum: INSTALLATION_TASK_STATUSES,
    default: 'todo',
  })
  @IsOptional()
  @IsIn([...INSTALLATION_TASK_STATUSES])
  status?: InstallationTaskStatus;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsDateString()
  dueAt?: string | null;
}

export class UpdateInstallationTaskDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  description?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  technicianId?: string | null;

  @ApiPropertyOptional({ enum: INSTALLATION_TASK_STATUSES })
  @IsOptional()
  @IsIn([...INSTALLATION_TASK_STATUSES])
  status?: InstallationTaskStatus;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsDateString()
  dueAt?: string | null;
}

export class InstallationTaskResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  installationId!: string;

  @ApiProperty()
  title!: string;

  @ApiPropertyOptional({ nullable: true })
  description!: string | null;

  @ApiPropertyOptional({ nullable: true })
  technicianId!: string | null;

  @ApiProperty({ enum: INSTALLATION_TASK_STATUSES })
  status!: InstallationTaskStatus;

  @ApiPropertyOptional({ nullable: true })
  dueAt!: string | null;

  @ApiPropertyOptional({ nullable: true })
  completedAt!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
