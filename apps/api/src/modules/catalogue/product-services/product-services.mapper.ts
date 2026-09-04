import { toBool } from '../../settings/utils/mysql-datetime';
import type { ProductServiceLinkResponseDto } from './dto/product-service-link.dto';

export type ProductServiceLinkRow = {
  id: string;
  product_id: string;
  service_id: string;
  is_required: number;
  default_quantity: string;
  created_at: string;
  updated_at: string;
  service_code: string;
  service_name: string;
};

export function toProductServiceLinkResponse(
  row: ProductServiceLinkRow,
): ProductServiceLinkResponseDto {
  return {
    id: row.id,
    productId: row.product_id,
    serviceId: row.service_id,
    isRequired: toBool(row.is_required),
    defaultQuantity: row.default_quantity,
    serviceCode: row.service_code,
    serviceName: row.service_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
