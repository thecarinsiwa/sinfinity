import { toBool } from '../../settings/utils/mysql-datetime';
import { OrganizationResponseDto } from './dto/organization-response.dto';

export type OrganizationRow = {
  id: string;
  name: string;
  legal_name: string | null;
  tax_id: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  logo_url: string | null;
  default_currency_id: string | null;
  country_id: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export function toOrganizationResponse(
  row: OrganizationRow,
): OrganizationResponseDto {
  return {
    id: row.id,
    name: row.name,
    legalName: row.legal_name,
    taxId: row.tax_id,
    email: row.email,
    phone: row.phone,
    website: row.website,
    logoUrl: row.logo_url,
    defaultCurrencyId: row.default_currency_id,
    countryId: row.country_id,
    isActive: toBool(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
