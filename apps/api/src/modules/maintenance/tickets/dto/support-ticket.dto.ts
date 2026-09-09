import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../../../common/dto/pagination-query.dto';
import {
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  type TicketPriority,
  type TicketStatus,
} from '../../ticket-statuses';

export class CreateSupportTicketDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  organizationId?: string;

  @ApiProperty({ example: 'TKT-2026-001' })
  @IsString()
  @MaxLength(64)
  ticketNumber!: string;

  @ApiProperty()
  @IsUUID('all')
  customerId!: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  contactId?: string | null;

  @ApiProperty({ example: 'Fibre down on campus' })
  @IsString()
  @MaxLength(255)
  subject!: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(20000)
  description?: string | null;

  @ApiPropertyOptional({ enum: TICKET_PRIORITIES, default: 'medium' })
  @IsOptional()
  @IsIn([...TICKET_PRIORITIES])
  priority?: TicketPriority;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  assignedTo?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  relatedSerialNumberId?: string | null;
}

export class UpdateSupportTicketDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  ticketNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  customerId?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  contactId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  subject?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(20000)
  description?: string | null;

  @ApiPropertyOptional({ enum: TICKET_PRIORITIES })
  @IsOptional()
  @IsIn([...TICKET_PRIORITIES])
  priority?: TicketPriority;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  relatedSerialNumberId?: string | null;
}

export class TransitionSupportTicketDto {
  @ApiProperty({ enum: TICKET_STATUSES })
  @IsIn([...TICKET_STATUSES])
  toStatus!: TicketStatus;
}

export class AssignSupportTicketDto {
  @ApiProperty({
    nullable: true,
    description: 'User to assign; null to unassign',
  })
  @IsOptional()
  @IsUUID('all')
  assignedTo!: string | null;
}

export class SupportTicketResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiProperty()
  ticketNumber!: string;

  @ApiProperty()
  customerId!: string;

  @ApiPropertyOptional({ nullable: true })
  contactId!: string | null;

  @ApiProperty()
  subject!: string;

  @ApiPropertyOptional({ nullable: true })
  description!: string | null;

  @ApiProperty({ enum: TICKET_PRIORITIES })
  priority!: TicketPriority;

  @ApiProperty({ enum: TICKET_STATUSES })
  status!: TicketStatus;

  @ApiPropertyOptional({ nullable: true })
  assignedTo!: string | null;

  @ApiPropertyOptional({ nullable: true })
  relatedSerialNumberId!: string | null;

  @ApiProperty()
  openedAt!: string;

  @ApiPropertyOptional({ nullable: true })
  closedAt!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;

  @ApiPropertyOptional({ nullable: true })
  deletedAt!: string | null;
}

export class ListSupportTicketsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  organizationId?: string;

  @ApiPropertyOptional({ example: 'TKT-2026' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  search?: string;

  @ApiPropertyOptional({ enum: TICKET_STATUSES })
  @IsOptional()
  @IsIn([...TICKET_STATUSES])
  status?: TicketStatus;

  @ApiPropertyOptional({ enum: TICKET_PRIORITIES })
  @IsOptional()
  @IsIn([...TICKET_PRIORITIES])
  priority?: TicketPriority;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  customerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  assignedTo?: string;
}
