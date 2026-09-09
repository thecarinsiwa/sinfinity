import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { PaginationQueryDto } from '../../../../common/dto/pagination-query.dto';
import {
  SERVICE_REQUEST_STATUSES,
  type ServiceRequestStatus,
} from '../../service-request-statuses';
import { TICKET_PRIORITIES, type TicketPriority } from '../../ticket-statuses';
import { SupportTicketResponseDto } from './support-ticket.dto';

export class CreateServiceRequestDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  organizationId?: string;

  @ApiProperty()
  @IsUUID('all')
  customerId!: string;

  @ApiPropertyOptional({ example: 'repair', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  requestType?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(20000)
  description?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsDateString()
  requestedAt?: string | null;
}

export class UpdateServiceRequestDto {
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  requestType?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(20000)
  description?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsDateString()
  requestedAt?: string | null;
}

export class TransitionServiceRequestDto {
  @ApiProperty({ enum: SERVICE_REQUEST_STATUSES })
  @IsIn([...SERVICE_REQUEST_STATUSES])
  toStatus!: ServiceRequestStatus;
}

export class ConvertServiceRequestDto {
  @ApiProperty({ example: 'TKT-2026-001' })
  @IsString()
  @MaxLength(64)
  ticketNumber!: string;

  @ApiPropertyOptional({
    description: 'Defaults to requestType or a generic subject',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  subject?: string;

  @ApiPropertyOptional({ enum: TICKET_PRIORITIES, default: 'medium' })
  @IsOptional()
  @IsIn([...TICKET_PRIORITIES])
  priority?: TicketPriority;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  contactId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  relatedSerialNumberId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  assignedTo?: string | null;
}

export class ServiceRequestResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiProperty()
  customerId!: string;

  @ApiPropertyOptional({ nullable: true })
  requestType!: string | null;

  @ApiPropertyOptional({ nullable: true })
  description!: string | null;

  @ApiProperty({ enum: SERVICE_REQUEST_STATUSES })
  status!: ServiceRequestStatus;

  @ApiPropertyOptional({ nullable: true })
  convertedTicketId!: string | null;

  @ApiProperty()
  requestedAt!: string;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class ConvertServiceRequestResponseDto {
  @ApiProperty({ type: () => ServiceRequestResponseDto })
  serviceRequest!: ServiceRequestResponseDto;

  @ApiProperty({ type: () => SupportTicketResponseDto })
  ticket!: SupportTicketResponseDto;
}

export class ListServiceRequestsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  organizationId?: string;

  @ApiPropertyOptional({ enum: SERVICE_REQUEST_STATUSES })
  @IsOptional()
  @IsIn([...SERVICE_REQUEST_STATUSES])
  status?: ServiceRequestStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  customerId?: string;

  @ApiPropertyOptional({ example: 'repair' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  requestType?: string;
}
