import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { PaginationQueryDto } from '../../../../common/dto/pagination-query.dto';
import {
  SALES_ACTIVITY_RELATED_TYPES,
  type SalesActivityRelatedType,
} from './create-sales-activity.dto';

export class ListSalesActivitiesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  organizationId?: string;

  @ApiPropertyOptional({ example: 'Follow-up' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  search?: string;

  @ApiPropertyOptional({ enum: SALES_ACTIVITY_RELATED_TYPES })
  @IsOptional()
  @IsIn(SALES_ACTIVITY_RELATED_TYPES)
  relatedType?: SalesActivityRelatedType;

  @ApiPropertyOptional()
  @ValidateIf(
    (o: ListSalesActivitiesQueryDto) =>
      o.relatedType != null || o.relatedId != null,
  )
  @IsUUID('all')
  relatedId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  activityTypeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  userId?: string;

  @ApiPropertyOptional({
    description: 'Filter scheduled_at >= this ISO datetime',
  })
  @IsOptional()
  @IsDateString()
  scheduledAtFrom?: string;

  @ApiPropertyOptional({
    description: 'Filter scheduled_at <= this ISO datetime',
  })
  @IsOptional()
  @IsDateString()
  scheduledAtTo?: string;
}
