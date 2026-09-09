/**
 * Canonical Swagger / OpenAPI tag names (Phase 0–14).
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
  Fournisseurs: 'Fournisseurs',
  Devis: 'Devis',
  CommandesClients: 'Commandes clients',
  Sourcing: 'Sourcing',
  Achats: 'Achats',
  Logistique: 'Logistique',
  CoutRendu: 'Coût rendu',
  Stock: 'Stock',
  Livraison: 'Livraison',
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
  {
    name: SWAGGER_TAG.Fournisseurs,
    description:
      'Supplier master data, supplier catalog, evaluations, documents and history',
  },
  {
    name: SWAGGER_TAG.Devis,
    description:
      'Customer quotations, line items, terms, versions and approval workflow',
  },
  {
    name: SWAGGER_TAG.CommandesClients,
    description:
      'Customer sales orders, line items, status workflow, payments and documents',
  },
  {
    name: SWAGGER_TAG.Sourcing,
    description:
      'Internal procurement requests, supplier quotes, comparisons and approvals',
  },
  {
    name: SWAGGER_TAG.Achats,
    description:
      'Supplier purchase orders, status workflow, payments and goods receipts',
  },
  {
    name: SWAGGER_TAG.Logistique,
    description:
      'Shipping methods, carriers, international shipments, customs and ad-hoc delivery addresses',
  },
  {
    name: SWAGGER_TAG.CoutRendu,
    description:
      'Landed cost headers, line items, ancillary fees and cost allocation for RDC imports',
  },
  {
    name: SWAGGER_TAG.Stock,
    description:
      'Warehouses, locations, inventory quantities, movements, transfers, batches and serial numbers',
  },
  {
    name: SWAGGER_TAG.Livraison,
    description:
      'Customer deliveries, line items, GPS tracking, confirmations and proof of delivery',
  },
];
