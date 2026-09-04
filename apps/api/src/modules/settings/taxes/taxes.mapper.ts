import { toBool } from '../utils/mysql-datetime';
import type { TaxType } from './dto/create-tax.dto';
import { TaxResponseDto } from './dto/tax-response.dto';

export type TaxRow = {
  id: string;
  organization_id: string | null;
  code: string;
  name: string;
  rate: string;
  tax_type: TaxType;
  country_id: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export function toTaxResponse(row: TaxRow): TaxResponseDto {
  return {
    id: row.id,
    organizationId: row.organization_id,
    code: row.code,
    name: row.name,
    rate: row.rate,
    taxType: row.tax_type,
    countryId: row.country_id,
    isActive: toBool(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
