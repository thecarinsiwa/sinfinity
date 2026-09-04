import { toBool } from '../../settings/utils/mysql-datetime';
import type {
  CustomerStatus,
  CustomerType,
} from './dto/create-customer.dto';
import type {
  AddressType,
  CustomerAddressResponseDto,
  CustomerContactResponseDto,
  CustomerNoteResponseDto,
} from './dto/customer-nested.dto';
import type { CustomerResponseDto } from './dto/customer-response.dto';

export type CustomerRow = {
  id: string;
  organization_id: string;
  category_id: string | null;
  code: string;
  type: CustomerType;
  name: string;
  legal_name: string | null;
  tax_id: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  owner_user_id: string | null;
  status: CustomerStatus;
  converted_from_lead_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type CustomerContactRow = {
  id: string;
  customer_id: string;
  first_name: string;
  last_name: string;
  title: string | null;
  email: string | null;
  phone: string | null;
  is_primary: number;
  is_decision_maker: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type CustomerAddressRow = {
  id: string;
  customer_id: string;
  type: AddressType;
  label: string | null;
  line1: string;
  line2: string | null;
  city_id: string | null;
  country_id: string | null;
  postal_code: string | null;
  is_default: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type CustomerNoteRow = {
  id: string;
  customer_id: string;
  author_id: string | null;
  note: string;
  is_pinned: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export function toCustomerResponse(
  row: CustomerRow,
  nested?: {
    contacts?: CustomerContactResponseDto[];
    addresses?: CustomerAddressResponseDto[];
    notes?: CustomerNoteResponseDto[];
  },
): CustomerResponseDto {
  return {
    id: row.id,
    organizationId: row.organization_id,
    categoryId: row.category_id,
    code: row.code,
    type: row.type,
    name: row.name,
    legalName: row.legal_name,
    taxId: row.tax_id,
    email: row.email,
    phone: row.phone,
    website: row.website,
    ownerUserId: row.owner_user_id,
    status: row.status,
    convertedFromLeadId: row.converted_from_lead_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...(nested?.contacts !== undefined
      ? { contacts: nested.contacts }
      : {}),
    ...(nested?.addresses !== undefined
      ? { addresses: nested.addresses }
      : {}),
    ...(nested?.notes !== undefined ? { notes: nested.notes } : {}),
  };
}

export function toCustomerContactResponse(
  row: CustomerContactRow,
): CustomerContactResponseDto {
  return {
    id: row.id,
    customerId: row.customer_id,
    firstName: row.first_name,
    lastName: row.last_name,
    title: row.title,
    email: row.email,
    phone: row.phone,
    isPrimary: toBool(row.is_primary),
    isDecisionMaker: toBool(row.is_decision_maker),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toCustomerAddressResponse(
  row: CustomerAddressRow,
): CustomerAddressResponseDto {
  return {
    id: row.id,
    customerId: row.customer_id,
    type: row.type,
    label: row.label,
    line1: row.line1,
    line2: row.line2,
    cityId: row.city_id,
    countryId: row.country_id,
    postalCode: row.postal_code,
    isDefault: toBool(row.is_default),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toCustomerNoteResponse(
  row: CustomerNoteRow,
): CustomerNoteResponseDto {
  return {
    id: row.id,
    customerId: row.customer_id,
    authorId: row.author_id,
    note: row.note,
    isPinned: toBool(row.is_pinned),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
