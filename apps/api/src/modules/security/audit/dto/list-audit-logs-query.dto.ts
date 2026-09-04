import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../../../common/dto/pagination-query.dto';

export class ListAuditLogsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by organization (super-admin). Ignored for org users.',
  })
  @IsOptional()
  @IsUUID('all')
  organizationId?: string;

  @ApiPropertyOptional({ example: 'users' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  entityType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  entityId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  userId?: string;

  @ApiPropertyOptional({ example: 'create' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  action?: string;

  @ApiPropertyOptional({
    description: 'Inclusive lower bound (ISO date or datetime)',
    example: '2026-09-01',
  })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  dateFrom?: string;

  @ApiPropertyOptional({
    description: 'Inclusive upper bound (ISO date or datetime)',
    example: '2026-09-30',
  })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  dateTo?: string;
}
