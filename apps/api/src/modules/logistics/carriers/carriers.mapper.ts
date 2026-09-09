import { toBool } from '../../settings/utils/mysql-datetime';
import type { CarrierResponseDto } from './dto/carrier.dto';

export type CarrierRow = {
  id: string;
  organization_id: string;
  name: string;
  code: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  tracking_url_template: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export function toCarrierResponse(row: CarrierRow): CarrierResponseDto {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    code: row.code,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    trackingUrlTemplate: row.tracking_url_template,
    isActive: toBool(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
