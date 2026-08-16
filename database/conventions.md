# MySQL conventions — Sinfinity

Technical rules for the MySQL 8 schema. Conceptual design lives in [`modules/`](./modules/) and [`dictionnaire-donnees.md`](./dictionnaire-donnees.md).

**Source of truth for DDL:** [`sql/sinfinity_schema.sql`](./sql/sinfinity_schema.sql)

## Engine and charset

| Setting | Value |
|---------|--------|
| Engine | InnoDB |
| Charset | `utf8mb4` |
| Collation | `utf8mb4_unicode_ci` |
| Time zone (app) | UTC (`created_at` / `updated_at` stored in UTC) |

## Naming

| Element | Rule | Example |
|---------|------|---------|
| Tables | `snake_case`, plural | `sales_orders` |
| Columns | `snake_case` | `organization_id` |
| Primary key | `id` | |
| Foreign keys | `<table_singular>_id` | `customer_id` |
| Join tables | `<left>_<right>` plural nouns | `role_permissions` |
| Status history | `<entity>_status_history` | `sales_order_status_history` |
| Indexes | `idx_<table>_<cols>` | `idx_customers_organization_id` |
| Unique indexes | `uq_<table>_<cols>` | `uq_products_org_sku` |

## Primary keys

- Type: `CHAR(36)` (UUID string) with `DEFAULT (UUID())` in MySQL.
- Prefer generating UUID in the application when needed (e.g. UUID v7); MySQL `UUID()` is the SQL default.
- All tables use UUID primary keys, including append-only logs (`audit_logs`, `login_logs`).
- Join tables may use a composite primary key without a surrogate `id` (e.g. `role_permissions`).

## Multi-tenancy

- Operational tables include `organization_id CHAR(36) NOT NULL`.
- Global reference tables may omit it (`countries`, `currencies`, `shipping_terms`, system `permissions`).
- Org-scoped references may use `organization_id NULL` for system defaults (`roles`, `taxes`, `payment_terms`).
- Every tenant query must filter by `organization_id` (enforced in NestJS, not only in SQL).

Recommended composite indexes:

- `(organization_id, created_at)`
- `(organization_id, status)` when a status column exists
- Business uniqueness: `(organization_id, code)` / `(organization_id, order_number)` / `(organization_id, sku)`

## Audit columns

On business tables (unless append-only):

| Column | Type | Notes |
|--------|------|--------|
| `created_at` | `DATETIME(3)` | NOT NULL, default `CURRENT_TIMESTAMP(3)` |
| `updated_at` | `DATETIME(3)` | NOT NULL, on update |
| `created_by` | `CHAR(36) NULL` | FK → `users.id` when users exist |
| `updated_by` | `CHAR(36) NULL` | FK → `users.id` |
| `deleted_at` | `DATETIME(3) NULL` | Soft delete; omit on audit/log tables |

**No soft delete** on: `audit_logs`, `login_logs`, `*_status_history`, `inventory_movements`, `exchange_rates` history rows.

## Data types

| Domain | MySQL type | Notes |
|--------|------------|--------|
| Money / quantities | `DECIMAL(18,4)` | Never `FLOAT` / `DOUBLE` for money |
| Percentages | `DECIMAL(7,4)` | e.g. tax rate, discount |
| Short codes | `VARCHAR(32)`–`VARCHAR(64)` | SKU, status codes |
| Names / titles | `VARCHAR(255)` | |
| Long text | `TEXT` | descriptions, notes |
| Booleans | `TINYINT(1)` | |
| JSON | `JSON` | specs, snapshots, checklists |
| Enums | Prefer lookup tables for workflow statuses; MySQL `ENUM` OK for small closed sets | `quotation_statuses` table for quotes |
| Polymorphic ref | `entity_type VARCHAR(64)` + `entity_id CHAR(36)` | + composite index |

## Foreign keys

| Rule | Default |
|------|---------|
| `ON DELETE` | `RESTRICT` |
| `ON UPDATE` | `CASCADE` (or RESTRICT; keep consistent) |
| Child line items | `CASCADE` delete with parent (`quotation_items` → `quotations`) |
| Circular refs | Create table without FK first, add FK later (e.g. `branches.manager_user_id`) |

## Schema changes

- Edit [`sql/sinfinity_schema.sql`](./sql/sinfinity_schema.sql) for greenfield installs.
- For existing databases, add incremental scripts under `sql/migrations/` (e.g. `001_add_….sql`) and apply them manually with the MySQL client.
- Review indexes and FK order before applying.

## Seeds (later)

Idempotent SQL seeds recommended:

- Currencies: USD, CDF, CNY, EUR
- Core countries (CD, CN, AE, …)
- System roles + base permissions
- Base DRC VAT / tax rows as needed

## Apply schema (local MySQL)

Requires a local MySQL 8+ server (no Docker in this project).

```bash
mysql -u root -p < database/sql/sinfinity_schema.sql
```
