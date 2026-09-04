/**
 * Canonical permission catalog (module.action).
 * Seeded idempotently; codes must match @RequirePermissions usage and ROADMAP.
 */
export type PermissionDef = {
  module: string;
  action: string;
  code: string;
  description: string;
};

function perm(
  module: string,
  action: string,
  description: string,
): PermissionDef {
  return {
    module,
    action,
    code: `${module}.${action}`,
    description,
  };
}

export const PERMISSION_CATALOG: PermissionDef[] = [
  // Phase 0–2 (implemented / near-term)
  perm('settings', 'read', 'Read global reference data'),
  perm('settings', 'write', 'Manage global reference data'),
  perm('organizations', 'read', 'Read organizations'),
  perm('organizations', 'write', 'Manage organizations'),
  perm('branches', 'read', 'Read branches'),
  perm('branches', 'write', 'Manage branches'),
  perm('users', 'read', 'Read users'),
  perm('users', 'write', 'Manage users'),
  perm('roles', 'read', 'Read roles and permissions'),
  perm('roles', 'write', 'Manage roles and user role assignments'),
  perm('audit', 'read', 'Read audit logs'),
  perm('system_settings', 'read', 'Read organization system settings'),
  perm('system_settings', 'write', 'Manage organization system settings'),

  // Documents / catalogue
  perm('documents', 'read', 'Read documents'),
  perm('documents', 'write', 'Manage documents'),
  perm('contracts', 'read', 'Read contracts'),
  perm('contracts', 'write', 'Manage contracts'),
  perm('catalog', 'read', 'Read product/service catalog'),
  perm('catalog', 'write', 'Manage product/service catalog'),

  // CRM / sales
  perm('customers', 'read', 'Read customers'),
  perm('customers', 'write', 'Manage customers'),
  perm('leads', 'read', 'Read leads'),
  perm('leads', 'write', 'Manage leads'),
  perm('leads', 'convert', 'Convert leads'),
  perm('opportunities', 'read', 'Read opportunities'),
  perm('opportunities', 'write', 'Manage opportunities'),
  perm('quotations', 'read', 'Read quotations'),
  perm('quotations', 'write', 'Manage quotations'),
  perm('quotations', 'approve', 'Approve or reject quotations'),
  perm('sales_orders', 'read', 'Read sales orders'),
  perm('sales_orders', 'write', 'Manage sales orders'),

  // Procurement
  perm('suppliers', 'read', 'Read suppliers'),
  perm('suppliers', 'write', 'Manage suppliers'),
  perm('procurement', 'read', 'Read procurement requests/quotes'),
  perm('procurement', 'write', 'Manage procurement'),
  perm('procurement', 'approve', 'Approve procurement'),
  perm('purchase_orders', 'read', 'Read purchase orders'),
  perm('purchase_orders', 'write', 'Manage purchase orders'),

  // Logistics / inventory
  perm('shipments', 'read', 'Read shipments'),
  perm('shipments', 'write', 'Manage shipments'),
  perm('landed_costs', 'read', 'Read landed costs'),
  perm('landed_costs', 'write', 'Manage landed costs'),
  perm('inventory', 'read', 'Read inventory'),
  perm('inventory', 'adjust', 'Adjust inventory'),
  perm('deliveries', 'read', 'Read deliveries'),
  perm('deliveries', 'write', 'Manage deliveries'),

  // Projects / support
  perm('projects', 'read', 'Read projects'),
  perm('projects', 'write', 'Manage projects'),
  perm('tickets', 'read', 'Read tickets'),
  perm('tickets', 'write', 'Manage tickets'),
  perm('tickets', 'assign', 'Assign tickets'),
  perm('tasks', 'read', 'Read tasks'),
  perm('tasks', 'write', 'Manage tasks'),

  // Finance
  perm('invoices', 'read', 'Read invoices'),
  perm('invoices', 'write', 'Manage invoices'),
  perm('invoices', 'issue', 'Issue invoices'),
  perm('finance', 'ledger.read', 'Read finance ledger'),
];

export const SYSTEM_ROLE_CODES = [
  'ADMIN',
  'SALES',
  'PROCUREMENT',
  'LOGISTICS',
  'TECHNICAL',
  'FINANCE',
] as const;

export type SystemRoleCode = (typeof SYSTEM_ROLE_CODES)[number];

export type SystemRoleDef = {
  code: SystemRoleCode;
  name: string;
  description: string;
  /** Permission codes; empty means none; use '*' for all catalog codes */
  permissions: '*' | string[];
};

const SALES_PERMS = [
  'settings.read',
  'organizations.read',
  'branches.read',
  'customers.read',
  'customers.write',
  'leads.read',
  'leads.write',
  'leads.convert',
  'opportunities.read',
  'opportunities.write',
  'quotations.read',
  'quotations.write',
  'sales_orders.read',
  'sales_orders.write',
  'catalog.read',
  'documents.read',
  'documents.write',
  'contracts.read',
  'tasks.read',
  'tasks.write',
];

const PROCUREMENT_PERMS = [
  'settings.read',
  'organizations.read',
  'branches.read',
  'suppliers.read',
  'suppliers.write',
  'procurement.read',
  'procurement.write',
  'procurement.approve',
  'purchase_orders.read',
  'purchase_orders.write',
  'catalog.read',
  'documents.read',
  'documents.write',
  'tasks.read',
  'tasks.write',
];

const LOGISTICS_PERMS = [
  'settings.read',
  'organizations.read',
  'branches.read',
  'shipments.read',
  'shipments.write',
  'landed_costs.read',
  'landed_costs.write',
  'inventory.read',
  'inventory.adjust',
  'deliveries.read',
  'deliveries.write',
  'purchase_orders.read',
  'sales_orders.read',
  'documents.read',
  'documents.write',
  'tasks.read',
  'tasks.write',
];

const TECHNICAL_PERMS = [
  'settings.read',
  'organizations.read',
  'branches.read',
  'projects.read',
  'projects.write',
  'tickets.read',
  'tickets.write',
  'tickets.assign',
  'catalog.read',
  'customers.read',
  'documents.read',
  'documents.write',
  'tasks.read',
  'tasks.write',
];

const FINANCE_PERMS = [
  'settings.read',
  'organizations.read',
  'branches.read',
  'invoices.read',
  'invoices.write',
  'invoices.issue',
  'finance.ledger.read',
  'customers.read',
  'sales_orders.read',
  'purchase_orders.read',
  'landed_costs.read',
  'documents.read',
  'documents.write',
  'audit.read',
  'tasks.read',
  'tasks.write',
];

export const SYSTEM_ROLES: SystemRoleDef[] = [
  {
    code: 'ADMIN',
    name: 'Administrator',
    description: 'Full access to all modules',
    permissions: '*',
  },
  {
    code: 'SALES',
    name: 'Sales',
    description: 'CRM, quotations and sales orders',
    permissions: SALES_PERMS,
  },
  {
    code: 'PROCUREMENT',
    name: 'Procurement',
    description: 'Suppliers, sourcing and purchase orders',
    permissions: PROCUREMENT_PERMS,
  },
  {
    code: 'LOGISTICS',
    name: 'Logistics',
    description: 'Shipments, inventory and deliveries',
    permissions: LOGISTICS_PERMS,
  },
  {
    code: 'TECHNICAL',
    name: 'Technical',
    description: 'Projects, tickets and field work',
    permissions: TECHNICAL_PERMS,
  },
  {
    code: 'FINANCE',
    name: 'Finance',
    description: 'Invoicing and ledger',
    permissions: FINANCE_PERMS,
  },
];

export function resolveRolePermissionCodes(
  role: SystemRoleDef,
): string[] {
  if (role.permissions === '*') {
    return PERMISSION_CATALOG.map((p) => p.code);
  }
  return [...role.permissions];
}
