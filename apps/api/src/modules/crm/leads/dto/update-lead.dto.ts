import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import {
  CreateLeadDto,
  LEAD_PATCH_STATUSES,
  type LeadPatchStatus,
} from './create-lead.dto';

export class UpdateLeadDto extends PartialType(CreateLeadDto) {
  @ApiPropertyOptional({
    enum: LEAD_PATCH_STATUSES,
    description: 'Manual workflow; converted is only via POST /leads/:id/convert',
  })
  @IsOptional()
  @IsIn(LEAD_PATCH_STATUSES)
  declare status?: LeadPatchStatus;
}
