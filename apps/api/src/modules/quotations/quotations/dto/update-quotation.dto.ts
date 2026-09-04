import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateQuotationDto } from './create-quotation.dto';

export class UpdateQuotationDto extends PartialType(
  OmitType(CreateQuotationDto, ['items', 'terms'] as const),
) {}
