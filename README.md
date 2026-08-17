# Sinfinity

Sinfinity is a multi-tenant web platform for companies that sell, source, import, deliver, install, and maintain technology products and services — with a strong focus on international procurement and landed-cost operations into the DRC.

It covers the full commercial and operational lifecycle:

**Lead → Opportunity → Quotation → Sales Order → Procurement → Purchase → Import → Inventory → Delivery → Installation → Maintenance → Invoicing**

## Product overview

Sinfinity combines CRM, catalog management, supplier sourcing, purchase orders, logistics/import tracking, warehouse inventory, project delivery, after-sales support, and finance in one system.

Typical use cases include:

- Managing B2B clients (universities, NGOs, enterprises) and sales pipelines
- Quoting products and related services (installation, configuration, maintenance)
- Sourcing from suppliers in China, Dubai, Europe, and local markets
- Comparing supplier offers and approving purchases
- Tracking international shipments, customs, and DRC landed costs
- Controlling stock, serial numbers, deliveries, and proof of delivery
- Running technical projects, installations, commissioning, and warranties
- Invoicing customers and monitoring receivables/payables

## Architecture

| App | Package | Technology | Port (dev) | Role |
|-----|---------|------------|------------|------|
| Web | `@sinfinity/web` | **Next.js** | 3000 | Main business UI |
| Admin | `@sinfinity/admin` | **Next.js** | 3001 | Administration console |
| POS | `@sinfinity/pos` | **Next.js** | 3002 | Point of sale |
| API | `@sinfinity/api` | **NestJS** | 4000 | Domain services, auth, workflows |
| Data model | — | See [`database/`](./database/) | — | Conceptual schema (~143 tables across 18 modules) |

```text
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  Next.js Web │  │ Next.js Admin│  │  Next.js POS │
│   :3000      │  │    :3001     │  │    :3002     │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                 │
       └─────────────────┼─────────────────┘
                         │ HTTPS / REST
                         ▼
                 ┌───────────────┐
                 │  NestJS API   │
                 │     :4000     │
                 └───────┬───────┘
                         ▼
                 ┌───────────────┐
                 │   Database    │
                 └───────────────┘
```

- **Web / Admin / POS** are separate Next.js frontends that share the NestJS backend.
- **NestJS** exposes a modular API aligned with business domains (customers, quotations, purchases, shipments, inventory, etc.), with organization-scoped multi-tenancy, roles, and audit trails.

## Functional modules

| Area | Capabilities |
|------|----------------|
| Organization & security | Organizations, branches, users, roles, permissions, sessions, audit & login logs |
| CRM | Customers, contacts, leads, activities, opportunities |
| Catalog | Products, brands, models, specs, images, services |
| Suppliers & sourcing | Supplier master data, quotes, evaluations, payment terms |
| Procurement | Internal sourcing requests, quote comparison, approvals |
| Sales | Quotations (versioned), sales orders, payments, documents |
| Purchasing | Purchase orders, receipts, supplier payments |
| Landed cost (DRC) | Shipping, customs, local transport, inspection, handling, other costs |
| Logistics & import | Shipments, carriers, tracking, customs declarations, import docs |
| Inventory | Warehouses, locations, movements, transfers, batches, serial numbers |
| Delivery | Deliveries, GPS/status tracking, confirmations, proof of delivery |
| Projects & install | Projects, installations, tasks, technicians, commissioning tests |
| Maintenance & support | Tickets, contracts, schedules, interventions, warranties & claims |
| Finance | Invoices, payments, expenses, refunds, AR/AP |
| Documents | Generic documents, versions, polymorphic links, framework contracts |
| Collaboration | Activities, appointments, tasks, notifications, comments |
| Settings | Currencies, FX rates, taxes, units, countries/cities, payment & shipping terms |

Detailed table-level design (French design-phase data dictionary): [`database/README.md`](./database/README.md) and [`database/dictionnaire-donnees.md`](./database/dictionnaire-donnees.md).

## Design principles

- **Multi-tenant** — operational data is scoped by `organization_id`
- **RBAC** — Admin, Sales, Procurement, Logistics, Technical, Finance (and custom roles)
- **Auditability** — who did what, when (audit logs + status histories on critical workflows)
- **End-to-end traceability** — from opportunity line items through serial numbers to installed equipment and warranties
- **Import-aware costing** — landed cost breakdown tailored to DRC import operations
- **One API, multiple clients** — Web, Admin, and POS share the NestJS backend

## Repository layout

Monorepo managed with **pnpm** workspaces from the project root.

```text
sinfinity/
├── apps/
│   ├── web/              # Next.js — business UI (:3000)
│   ├── admin/            # Next.js — admin console (:3001)
│   ├── pos/              # Next.js — point of sale (:3002)
│   └── api/              # NestJS — REST API (:4000)
├── packages/             # Shared libraries
├── database/             # Data model + MySQL DDL (docs & SQL, not a workspace package)
│   ├── README.md
│   ├── conventions.md
│   ├── dictionnaire-donnees.md
│   ├── modules/
│   └── sql/
│       ├── sinfinity_schema.sql
│       └── migrations/
├── package.json
├── pnpm-workspace.yaml
└── README.md
```

## Getting started

Requires **Node.js ≥ 22** and **pnpm ≥ 10**.

```bash
# From the repository root
pnpm install
pnpm dev                 # all apps in parallel
pnpm dev:web             # web only
pnpm dev:admin
pnpm dev:pos
pnpm dev:api
```

Useful workspace commands:

| Command | Description |
|---------|-------------|
| `pnpm install` | Install all workspace dependencies |
| `pnpm dev` | Run `dev` in all apps |
| `pnpm build` | Build all packages |
| `pnpm --filter @sinfinity/<app> <script>` | Run a script in one app |

## Local database (MySQL 8)

Install MySQL 8 locally, then:

```bash
mysql -u root -p < database/sql/sinfinity_schema.sql
```

Point the API at that database with `DATABASE_URL` in `apps/api/.env` (copy `apps/api/.env.example`). Schema changes are SQL-first; Drizzle only introspects. See [`apps/api/docs/database.md`](./apps/api/docs/database.md) and [`database/conventions.md`](./database/conventions.md).

## Status

Data model documented; full MySQL DDL available in `database/sql/sinfinity_schema.sql`. Apps scaffolded under `apps/` (`web`, `admin`, `pos`, `api`).

## License

Proprietary — all rights reserved.
