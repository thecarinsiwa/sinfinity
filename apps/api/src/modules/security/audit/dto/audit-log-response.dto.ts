import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AuditLogResponseDto {
  @ApiProperty()
  id!: string;

  @ApiPropertyOptional({ nullable: true })
  organizationId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  userId!: string | null;

  @ApiProperty({ example: 'create' })
  action!: string;

  @ApiProperty({ example: 'users' })
  entityType!: string;

  @ApiPropertyOptional({ nullable: true })
  entityId!: string | null;

  @ApiPropertyOptional({ nullable: true, type: Object })
  oldValues!: Record<string, unknown> | unknown[] | null;

  @ApiPropertyOptional({ nullable: true, type: Object })
  newValues!: Record<string, unknown> | unknown[] | null;

  @ApiPropertyOptional({ nullable: true })
  ipAddress!: string | null;

  @ApiProperty()
  createdAt!: string;
}
