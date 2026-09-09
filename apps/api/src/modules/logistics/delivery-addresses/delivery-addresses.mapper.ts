import type { DeliveryAddressResponseDto } from './dto/delivery-address.dto';

export type DeliveryAddressRow = {
  id: string;
  organization_id: string;
  label: string | null;
  line1: string;
  line2: string | null;
  city_id: string | null;
  country_id: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  customer_id: string | null;
  warehouse_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export function toDeliveryAddressResponse(
  row: DeliveryAddressRow,
): DeliveryAddressResponseDto {
  return {
    id: row.id,
    organizationId: row.organization_id,
    label: row.label,
    line1: row.line1,
    line2: row.line2,
    cityId: row.city_id,
    countryId: row.country_id,
    contactName: row.contact_name,
    contactPhone: row.contact_phone,
    customerId: row.customer_id,
    warehouseId: row.warehouse_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
