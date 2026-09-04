import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../../../common/dto/pagination-query.dto';
import {
  OPPORTUNITY_STAGES,
  type OpportunityStage,
} from './create-opportunity.dto';

export class ListOpportunitiesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  organizationId?: string;

  @ApiPropertyOptional({ example: 'Firewall' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  search?: string;

  @ApiPropertyOptional({ enum: OPPORTUNITY_STAGES })
  @IsOptional()
  @IsIn(OPPORTUNITY_STAGES)
  stage?: OpportunityStage;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  customerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  leadId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  ownerUserId?: string;
}

export class RecalculateAmountQueryDto {
  @ApiPropertyOptional({
    description:
      'When true, set opportunity.amount to the sum of item line totals',
    default: false,
  })
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
  recalculateAmount?: boolean;
}
