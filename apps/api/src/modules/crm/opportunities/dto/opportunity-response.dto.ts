import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  OPPORTUNITY_STAGES,
  type OpportunityStage,
} from './create-opportunity.dto';
import { OpportunityItemResponseDto } from './opportunity-item.dto';

export class OpportunityResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiProperty()
  customerId!: string;

  @ApiPropertyOptional({ nullable: true })
  leadId!: string | null;

  @ApiProperty({ example: 'Firewall refresh Q4' })
  name!: string;

  @ApiProperty({ enum: OPPORTUNITY_STAGES })
  stage!: OpportunityStage;

  @ApiProperty({ example: 20 })
  probability!: number;

  @ApiPropertyOptional({ nullable: true, example: '2026-12-31' })
  expectedCloseDate!: string | null;

  @ApiPropertyOptional({
    nullable: true,
    example: '25000.0000',
    description: 'Decimal string',
  })
  amount!: string | null;

  @ApiPropertyOptional({ nullable: true })
  currencyId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  ownerUserId!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;

  @ApiPropertyOptional({
    type: [OpportunityItemResponseDto],
    description: 'Present on get-by-id and create',
  })
  items?: OpportunityItemResponseDto[];
}
