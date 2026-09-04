import { toBool } from '../../settings/utils/mysql-datetime';
import type { SupplierStatus } from './dto/create-supplier.dto';
import type {
  SupplierAddressResponseDto,
  SupplierAddressType,
  SupplierContactResponseDto,
  SupplierPaymentTermResponseDto,
} from './dto/supplier-nested.dto';
import type { SupplierResponseDto } from './dto/supplier-response.dto';

export type SupplierRow = {
  id: string;
  organization_id: string;
  code: string;
  name: string;
  category_id: string | null;
  country_id: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  tax_id: string | null;
  rating: string | null;
  status: SupplierStatus;
  preferred: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type SupplierContactRow = {
  id: string;
  supplier_id: string;
  first_name: string;
  last_name: string;
  title: string | null;
  email: string | null;
  phone: string | null;
  is_primary: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type SupplierAddressRow = {
  id: string;
  supplier_id: string;
  type: SupplierAddressType;
  line1: string;
  line2: string | null;
  city_id: string | null;
  country_id: string | null;
  is_default: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type SupplierPaymentTermRow = {
  id: string;
  supplier_id: string;
  payment_term_id: string;
  is_default: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export function toSupplierResponse(
  row: SupplierRow,
  nested?: {
    contacts?: SupplierContactResponseDto[];
    addresses?: SupplierAddressResponseDto[];
    paymentTerms?: SupplierPaymentTermResponseDto[];
  },
): SupplierResponseDto {
  return {
    id: row.id,
    organizationId: row.organization_id,
    code: row.code,
    name: row.name,
    categoryId: row.category_id,
    countryId: row.country_id,
    email: row.email,
    phone: row.phone,
    website: row.website,
    taxId: row.tax_id,
    rating: row.rating,
    status: row.status,
    preferred: toBool(row.preferred),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...(nested?.contacts !== undefined ? { contacts: nested.contacts } : {}),
    ...(nested?.addresses !== undefined
      ? { addresses: nested.addresses }
      : {}),
    ...(nested?.paymentTerms !== undefined
      ? { paymentTerms: nested.paymentTerms }
      : {}),
  };
}

export function toSupplierContactResponse(
  row: SupplierContactRow,
): SupplierContactResponseDto {
  return {
    id: row.id,
    supplierId: row.supplier_id,
    firstName: row.first_name,
    lastName: row.last_name,
    title: row.title,
    email: row.email,
    phone: row.phone,
    isPrimary: toBool(row.is_primary),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toSupplierAddressResponse(
  row: SupplierAddressRow,
): SupplierAddressResponseDto {
  return {
    id: row.id,
    supplierId: row.supplier_id,
    type: row.type,
    line1: row.line1,
    line2: row.line2,
    cityId: row.city_id,
    countryId: row.country_id,
    isDefault: toBool(row.is_default),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toSupplierPaymentTermResponse(
  row: SupplierPaymentTermRow,
): SupplierPaymentTermResponseDto {
  return {
    id: row.id,
    supplierId: row.supplier_id,
    paymentTermId: row.payment_term_id,
    isDefault: toBool(row.is_default),
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
