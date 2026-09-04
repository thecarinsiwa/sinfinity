/**
 * Canonical Swagger / OpenAPI tag names (Phase 0–5).
 * Controllers and DocumentBuilder must use these exact strings.
 */
export const SWAGGER_TAG = {
  Health: 'Health',
  Settings: 'Settings',
  Auth: 'Auth',
  Organisation: 'Organisation',
  Securite: 'Sécurité',
  Documents: 'Documents',
  Catalogue: 'Catalogue',
  Crm: 'CRM',
} as const;

export type SwaggerTagName = (typeof SWAGGER_TAG)[keyof typeof SWAGGER_TAG];

export const SWAGGER_TAG_DEFINITIONS: ReadonlyArray<{
  name: SwaggerTagName;
  description: string;
}> = [
  {
    name: SWAGGER_TAG.Health,
    description: 'Liveness and readiness',
  },
  {
    name: SWAGGER_TAG.Settings,
    description:
      'Global reference data: geography, currencies, taxes, units, commercial terms',
  },
  {
    name: SWAGGER_TAG.Auth,
    description:
      'Login, refresh, set-password, logout and current user (login/refresh/set-password without Bearer)',
  },
  {
    name: SWAGGER_TAG.Organisation,
    description:
      'Tenants, branches, users and organization-level system settings',
  },
  {
    name: SWAGGER_TAG.Securite,
    description:
      'Roles, permissions, user role assignments, me/permissions and audit logs',
  },
  {
    name: SWAGGER_TAG.Documents,
    description:
      'Document types, file storage, versions, polymorphic links and framework contracts',
  },
  {
    name: SWAGGER_TAG.Catalogue,
    description:
      'Product taxonomy, products (specs/images), services and product–service links',
  },
  {
    name: SWAGGER_TAG.Crm,
    description:
      'Customers, leads (convert), opportunities, and sales activities',
  },
];
