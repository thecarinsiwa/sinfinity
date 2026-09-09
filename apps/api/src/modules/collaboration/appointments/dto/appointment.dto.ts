import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { PaginationQueryDto } from '../../../../common/dto/pagination-query.dto';
import {
  APPOINTMENT_STATUSES,
  MEETING_TYPES,
  type AppointmentStatus,
  type MeetingType,
} from '../../appointment-statuses';

export class CreateAppointmentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  organizationId?: string;

  @ApiProperty({ example: 'Site survey' })
  @IsString()
  @MaxLength(255)
  title!: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(20000)
  description?: string | null;

  @ApiProperty({ example: '2026-04-15T09:00:00.000Z' })
  @IsDateString()
  startAt!: string;

  @ApiProperty({ example: '2026-04-15T10:00:00.000Z' })
  @IsDateString()
  endAt!: string;

  @ApiPropertyOptional({ nullable: true, example: 'https://meet.example' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string | null;

  @ApiPropertyOptional({ enum: MEETING_TYPES, default: 'in_person' })
  @IsOptional()
  @IsIn([...MEETING_TYPES])
  meetingType?: MeetingType;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Defaults to current user',
  })
  @IsOptional()
  @IsUUID('all')
  organizerId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  customerId?: string | null;
}

export class UpdateAppointmentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(20000)
  description?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endAt?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string | null;

  @ApiPropertyOptional({ enum: MEETING_TYPES })
  @IsOptional()
  @IsIn([...MEETING_TYPES])
  meetingType?: MeetingType;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  organizerId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  customerId?: string | null;
}

export class TransitionAppointmentDto {
  @ApiProperty({
    enum: APPOINTMENT_STATUSES,
    description: 'scheduled → completed|cancelled|no_show',
  })
  @IsIn([...APPOINTMENT_STATUSES])
  toStatus!: AppointmentStatus;
}

export class ListAppointmentsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  organizationId?: string;

  @ApiPropertyOptional({ example: 'survey' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  search?: string;

  @ApiPropertyOptional({ enum: APPOINTMENT_STATUSES })
  @IsOptional()
  @IsIn([...APPOINTMENT_STATUSES])
  status?: AppointmentStatus;

  @ApiPropertyOptional({ enum: MEETING_TYPES })
  @IsOptional()
  @IsIn([...MEETING_TYPES])
  meetingType?: MeetingType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  organizerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  customerId?: string;

  @ApiPropertyOptional({
    example: '2026-04-01T00:00:00.000Z',
    description: 'Inclusive lower bound on startAt',
  })
  @IsOptional()
  @IsDateString()
  startFrom?: string;

  @ApiPropertyOptional({
    example: '2026-04-30T23:59:59.000Z',
    description: 'Inclusive upper bound on startAt',
  })
  @IsOptional()
  @IsDateString()
  startTo?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  includeDeleted?: boolean;
}

export class AppointmentResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiProperty()
  title!: string;

  @ApiPropertyOptional({ nullable: true })
  description!: string | null;

  @ApiProperty()
  startAt!: string;

  @ApiProperty()
  endAt!: string;

  @ApiPropertyOptional({ nullable: true })
  location!: string | null;

  @ApiProperty({ enum: MEETING_TYPES })
  meetingType!: MeetingType;

  @ApiPropertyOptional({ nullable: true })
  organizerId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  customerId!: string | null;

  @ApiProperty({ enum: APPOINTMENT_STATUSES })
  status!: AppointmentStatus;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;

  @ApiPropertyOptional({ nullable: true })
  deletedAt!: string | null;
}
