-- RBAC seed (permissions + system roles)
-- Prefer the idempotent Nest seeder:
--   pnpm --filter @sinfinity/api seed:rbac
--
-- This SQL file is a lightweight bootstrap for greenfield DBs when the Nest
-- app cannot run yet. It inserts catalog permissions and system roles only.
-- Role↔ permission mapping is best applied via seed:rbac (ADMIN = all, etc.).

INSERT INTO `permissions` (`id`, `module`, `action`, `code`, `description`)
SELECT UUID(), 'settings', 'read', 'settings.read', 'Read global reference data'
WHERE NOT EXISTS (SELECT 1 FROM `permissions` WHERE `code` = 'settings.read');

INSERT INTO `permissions` (`id`, `module`, `action`, `code`, `description`)
SELECT UUID(), 'settings', 'write', 'settings.write', 'Manage global reference data'
WHERE NOT EXISTS (SELECT 1 FROM `permissions` WHERE `code` = 'settings.write');

INSERT INTO `permissions` (`id`, `module`, `action`, `code`, `description`)
SELECT UUID(), 'organizations', 'read', 'organizations.read', 'Read organizations'
WHERE NOT EXISTS (SELECT 1 FROM `permissions` WHERE `code` = 'organizations.read');

INSERT INTO `permissions` (`id`, `module`, `action`, `code`, `description`)
SELECT UUID(), 'organizations', 'write', 'organizations.write', 'Manage organizations'
WHERE NOT EXISTS (SELECT 1 FROM `permissions` WHERE `code` = 'organizations.write');

INSERT INTO `permissions` (`id`, `module`, `action`, `code`, `description`)
SELECT UUID(), 'branches', 'read', 'branches.read', 'Read branches'
WHERE NOT EXISTS (SELECT 1 FROM `permissions` WHERE `code` = 'branches.read');

INSERT INTO `permissions` (`id`, `module`, `action`, `code`, `description`)
SELECT UUID(), 'branches', 'write', 'branches.write', 'Manage branches'
WHERE NOT EXISTS (SELECT 1 FROM `permissions` WHERE `code` = 'branches.write');

INSERT INTO `permissions` (`id`, `module`, `action`, `code`, `description`)
SELECT UUID(), 'users', 'read', 'users.read', 'Read users'
WHERE NOT EXISTS (SELECT 1 FROM `permissions` WHERE `code` = 'users.read');

INSERT INTO `permissions` (`id`, `module`, `action`, `code`, `description`)
SELECT UUID(), 'users', 'write', 'users.write', 'Manage users'
WHERE NOT EXISTS (SELECT 1 FROM `permissions` WHERE `code` = 'users.write');

INSERT INTO `permissions` (`id`, `module`, `action`, `code`, `description`)
SELECT UUID(), 'roles', 'read', 'roles.read', 'Read roles and permissions'
WHERE NOT EXISTS (SELECT 1 FROM `permissions` WHERE `code` = 'roles.read');

INSERT INTO `permissions` (`id`, `module`, `action`, `code`, `description`)
SELECT UUID(), 'roles', 'write', 'roles.write', 'Manage roles and user role assignments'
WHERE NOT EXISTS (SELECT 1 FROM `permissions` WHERE `code` = 'roles.write');

INSERT INTO `permissions` (`id`, `module`, `action`, `code`, `description`)
SELECT UUID(), 'audit', 'read', 'audit.read', 'Read audit logs'
WHERE NOT EXISTS (SELECT 1 FROM `permissions` WHERE `code` = 'audit.read');

INSERT INTO `permissions` (`id`, `module`, `action`, `code`, `description`)
SELECT UUID(), 'system_settings', 'read', 'system_settings.read', 'Read organization system settings'
WHERE NOT EXISTS (SELECT 1 FROM `permissions` WHERE `code` = 'system_settings.read');

INSERT INTO `permissions` (`id`, `module`, `action`, `code`, `description`)
SELECT UUID(), 'system_settings', 'write', 'system_settings.write', 'Manage organization system settings'
WHERE NOT EXISTS (SELECT 1 FROM `permissions` WHERE `code` = 'system_settings.write');

INSERT INTO `roles` (`id`, `organization_id`, `code`, `name`, `description`, `is_system`)
SELECT UUID(), NULL, 'ADMIN', 'Administrator', 'Full access to all modules', 1
WHERE NOT EXISTS (
  SELECT 1 FROM `roles`
  WHERE `code` = 'ADMIN' AND `organization_id` IS NULL AND `is_system` = 1 AND `deleted_at` IS NULL
);

INSERT INTO `roles` (`id`, `organization_id`, `code`, `name`, `description`, `is_system`)
SELECT UUID(), NULL, 'SALES', 'Sales', 'CRM, quotations and sales orders', 1
WHERE NOT EXISTS (
  SELECT 1 FROM `roles`
  WHERE `code` = 'SALES' AND `organization_id` IS NULL AND `is_system` = 1 AND `deleted_at` IS NULL
);

INSERT INTO `roles` (`id`, `organization_id`, `code`, `name`, `description`, `is_system`)
SELECT UUID(), NULL, 'PROCUREMENT', 'Procurement', 'Suppliers, sourcing and purchase orders', 1
WHERE NOT EXISTS (
  SELECT 1 FROM `roles`
  WHERE `code` = 'PROCUREMENT' AND `organization_id` IS NULL AND `is_system` = 1 AND `deleted_at` IS NULL
);

INSERT INTO `roles` (`id`, `organization_id`, `code`, `name`, `description`, `is_system`)
SELECT UUID(), NULL, 'LOGISTICS', 'Logistics', 'Shipments, inventory and deliveries', 1
WHERE NOT EXISTS (
  SELECT 1 FROM `roles`
  WHERE `code` = 'LOGISTICS' AND `organization_id` IS NULL AND `is_system` = 1 AND `deleted_at` IS NULL
);

INSERT INTO `roles` (`id`, `organization_id`, `code`, `name`, `description`, `is_system`)
SELECT UUID(), NULL, 'TECHNICAL', 'Technical', 'Projects, tickets and field work', 1
WHERE NOT EXISTS (
  SELECT 1 FROM `roles`
  WHERE `code` = 'TECHNICAL' AND `organization_id` IS NULL AND `is_system` = 1 AND `deleted_at` IS NULL
);

INSERT INTO `roles` (`id`, `organization_id`, `code`, `name`, `description`, `is_system`)
SELECT UUID(), NULL, 'FINANCE', 'Finance', 'Invoicing and ledger', 1
WHERE NOT EXISTS (
  SELECT 1 FROM `roles`
  WHERE `code` = 'FINANCE' AND `organization_id` IS NULL AND `is_system` = 1 AND `deleted_at` IS NULL
);

-- Assign all permissions currently present to ADMIN (idempotent insert-ignore)
INSERT IGNORE INTO `role_permissions` (`role_id`, `permission_id`)
SELECT r.id, p.id
FROM `roles` r
CROSS JOIN `permissions` p
WHERE r.code = 'ADMIN'
  AND r.organization_id IS NULL
  AND r.is_system = 1
  AND r.deleted_at IS NULL;
