import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export const SALES_ACTIVITY_RELATED_TYPES = [
  'lead',
  'customer',
  'opportunity',
] as const;
export type SalesActivityRelatedType =
  (typeof SALES_ACTIVITY_RELATED_TYPES)[number];

export class CreateSalesActivityDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  organizationId?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  activityTypeId?: string | null;

  @ApiProperty({ example: 'Follow-up call' })
  @IsString()
  @MaxLength(255)
  subject!: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({
    enum: SALES_ACTIVITY_RELATED_TYPES,
    nullable: true,
  })
  @IsOptional()
  @IsIn(SALES_ACTIVITY_RELATED_TYPES)
  relatedType?: SalesActivityRelatedType | null;

  @ApiPropertyOptional({ nullable: true })
  @ValidateIf(
    (o: CreateSalesActivityDto) =>
      o.relatedType != null || o.relatedId != null,
  )
  @IsUUID('all')
  relatedId?: string | null;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Defaults to the current user',
  })
  @IsOptional()
  @IsUUID('all')
  userId?: string | null;

  @ApiPropertyOptional({
    nullable: true,
    example: '2026-09-10T14:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsDateString()
  completedAt?: string | null;

  @ApiPropertyOptional({ nullable: true, example: 'Left voicemail' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  outcome?: string | null;
}
