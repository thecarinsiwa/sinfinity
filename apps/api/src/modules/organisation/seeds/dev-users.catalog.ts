import type { SystemRoleCode } from '../../security/rbac/permissions.catalog';

/**
 * Local / CI bootstrap accounts (NODE_ENV development|test only).
 * Password comes from SEED_DEV_PASSWORD (default below) — never use in production.
 */
export const SEED_DEV_PASSWORD_DEFAULT = 'local-dev-only-1';

export const SEED_DEV_ORG = {
  name: 'Sinfinity SARL',
  legalName: 'Sinfinity Société à Responsabilité Limitée',
  taxId: 'CD-DEV-0001',
  email: 'contact@sinfinity.cd',
  phone: '+243900000000',
  website: 'https://sinfinity.cd',
  /** Settings seed codes */
  defaultCurrencyCode: 'USD',
  countryCode: 'CD',
} as const;

export const SEED_DEV_BRANCHES = [
  {
    code: 'HQ-KIN',
    name: 'Siège Kinshasa',
    type: 'office' as const,
    phone: '+243900000001',
    cityName: 'Kinshasa',
    cityRegion: 'Kinshasa',
  },
  {
    code: 'WH-KIN',
    name: 'Entrepôt Kinshasa',
    type: 'warehouse' as const,
    phone: '+243900000002',
    cityName: 'Kinshasa',
    cityRegion: 'Kinshasa',
  },
] as const;

export type SeedDevUserDef = {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  roleCode: SystemRoleCode;
  /** Prefer HQ branch when true */
  branchCode: string;
};

export const SEED_DEV_USERS: SeedDevUserDef[] = [
  {
    email: 'admin@sinfinity.cd',
    firstName: 'Admin',
    lastName: 'Sinfinity',
    phone: '+243900000010',
    roleCode: 'ADMIN',
    branchCode: 'HQ-KIN',
  },
  {
    email: 'sales@sinfinity.cd',
    firstName: 'Sales',
    lastName: 'Demo',
    phone: '+243900000011',
    roleCode: 'SALES',
    branchCode: 'HQ-KIN',
  },
  {
    email: 'procurement@sinfinity.cd',
    firstName: 'Procurement',
    lastName: 'Demo',
    phone: '+243900000012',
    roleCode: 'PROCUREMENT',
    branchCode: 'HQ-KIN',
  },
  {
    email: 'logistics@sinfinity.cd',
    firstName: 'Logistics',
    lastName: 'Demo',
    phone: '+243900000013',
    roleCode: 'LOGISTICS',
    branchCode: 'WH-KIN',
  },
  {
    email: 'technical@sinfinity.cd',
    firstName: 'Technical',
    lastName: 'Demo',
    phone: '+243900000014',
    roleCode: 'TECHNICAL',
    branchCode: 'HQ-KIN',
  },
  {
    email: 'finance@sinfinity.cd',
    firstName: 'Finance',
    lastName: 'Demo',
    phone: '+243900000015',
    roleCode: 'FINANCE',
    branchCode: 'HQ-KIN',
  },
];
