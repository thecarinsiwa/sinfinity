import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateOpportunityDto } from './create-opportunity.dto';

export class UpdateOpportunityDto extends PartialType(
  OmitType(CreateOpportunityDto, ['items'] as const),
) {}
