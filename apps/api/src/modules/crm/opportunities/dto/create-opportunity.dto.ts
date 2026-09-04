import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { CreateOpportunityItemDto } from './opportunity-item.dto';

const DECIMAL_REGEX = /^-?\d+(\.\d+)?$/;

export const OPPORTUNITY_STAGES = [
  'qualification',
  'proposal',
  'negotiation',
  'won',
  'lost',
] as const;
export type OpportunityStage = (typeof OPPORTUNITY_STAGES)[number];

export class CreateOpportunityDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  organizationId?: string;

  @ApiProperty()
  @IsUUID('all')
  customerId!: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  leadId?: string | null;

  @ApiProperty({ example: 'Firewall refresh Q4' })
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiPropertyOptional({
    enum: OPPORTUNITY_STAGES,
    default: 'qualification',
  })
  @IsOptional()
  @IsIn(OPPORTUNITY_STAGES)
  stage?: OpportunityStage;

  @ApiPropertyOptional({ example: 20, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  probability?: number;

  @ApiPropertyOptional({
    nullable: true,
    example: '2026-12-31',
    description: 'ISO date (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsDateString()
  expectedCloseDate?: string | null;

  @ApiPropertyOptional({
    nullable: true,
    example: '25000.0000',
    description: 'Decimal string',
  })
  @IsOptional()
  @IsString()
  @Matches(DECIMAL_REGEX, { message: 'amount must be a decimal string' })
  amount?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  currencyId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  ownerUserId?: string | null;

  @ApiPropertyOptional({ type: [CreateOpportunityItemDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => CreateOpportunityItemDto)
  items?: CreateOpportunityItemDto[];
}
