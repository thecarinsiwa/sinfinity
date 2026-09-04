import { toBool } from '../../settings/utils/mysql-datetime';
import type {
  ServiceBillingType,
  ServiceResponseDto,
} from './dto/service-response.dto';

export type ServiceRow = {
  id: string;
  organization_id: string;
  code: string;
  name: string;
  description: string | null;
  category_id: string | null;
  base_price: string;
  currency_id: string | null;
  billing_type: ServiceBillingType;
  is_active: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export function toServiceResponse(row: ServiceRow): ServiceResponseDto {
  return {
    id: row.id,
    organizationId: row.organization_id,
    code: row.code,
    name: row.name,
    description: row.description,
    categoryId: row.category_id,
    basePrice: row.base_price,
    currencyId: row.currency_id,
    billingType: row.billing_type,
    isActive: toBool(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
