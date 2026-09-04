import { PartialType } from '@nestjs/swagger';
import { CreateShippingTermDto } from './create-shipping-term.dto';

export class UpdateShippingTermDto extends PartialType(CreateShippingTermDto) {}
