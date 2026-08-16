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

| Layer | Technology | Role |
|-------|------------|------|
| Web frontend | **Next.js** | Business UI for desktop and tablet browsers |
| Backend API | **NestJS** | Domain services, auth, workflows, integrations |
| Mobile | **PWA** | Installable progressive web app for field and on-the-go use |
| Data model | See [`database/`](./database/) | Conceptual schema (~143 tables across 18 modules) |

```text
┌─────────────────┐     ┌─────────────────┐
│  Next.js Web    │     │  PWA (Mobile)   │
│  Admin / Ops UI │     │  Field / Sales  │
└────────┬────────┘     └────────┬────────┘
         │      HTTPS / REST     │
         └──────────┬────────────┘
                    ▼
            ┌───────────────┐
            │  NestJS API   │
            │  Auth · RBAC  │
            │  Domains      │
            └───────┬───────┘
                    ▼
            ┌───────────────┐
            │   Database    │
            └───────────────┘
```

- **Next.js** delivers the main web application (dashboards, CRM, procurement, finance, settings).
- **NestJS** exposes a modular API aligned with business domains (customers, quotations, purchases, shipments, inventory, etc.), with organization-scoped multi-tenancy, roles, and audit trails.
- **PWA** reuses the same backend so sales, technicians, and logistics teams can work from phones/tablets (offline-capable UX where relevant: deliveries, interventions, proofs of delivery).

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
- **One API, multiple clients** — Next.js web app and PWA share the NestJS backend

## Repository layout

```text
sinfinity/
├── apps/                 # Application packages (web, api, …)
├── database/             # Data model documentation (design phase)
│   ├── README.md
│   ├── dictionnaire-donnees.md
│   └── modules/          # Per-domain table & column descriptions
└── README.md             # This file
```

## Status

Design phase: business data model documented. Application scaffolding (Next.js / NestJS / PWA) to follow.

## License

Proprietary — all rights reserved.
