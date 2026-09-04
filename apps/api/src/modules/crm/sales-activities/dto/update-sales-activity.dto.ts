import { PartialType } from '@nestjs/swagger';
import { CreateSalesActivityDto } from './create-sales-activity.dto';

export class UpdateSalesActivityDto extends PartialType(
  CreateSalesActivityDto,
) {}
