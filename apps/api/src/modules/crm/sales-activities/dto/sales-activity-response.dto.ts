import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  SALES_ACTIVITY_RELATED_TYPES,
  type SalesActivityRelatedType,
} from './create-sales-activity.dto';

export class SalesActivityResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiPropertyOptional({ nullable: true })
  activityTypeId!: string | null;

  @ApiProperty({ example: 'Follow-up call' })
  subject!: string;

  @ApiPropertyOptional({ nullable: true })
  description!: string | null;

  @ApiPropertyOptional({
    enum: SALES_ACTIVITY_RELATED_TYPES,
    nullable: true,
  })
  relatedType!: SalesActivityRelatedType | null;

  @ApiPropertyOptional({ nullable: true })
  relatedId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  userId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  scheduledAt!: string | null;

  @ApiPropertyOptional({ nullable: true })
  completedAt!: string | null;

  @ApiPropertyOptional({ nullable: true })
  outcome!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
