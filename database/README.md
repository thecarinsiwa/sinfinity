# Base de données Sinfinity

Documentation de conception du modèle de données pour la plateforme Sinfinity — ERP / CRM orienté sourcing, importation RDC, logistique et déploiement technique.

## Objectif

Couvrir le cycle complet :

**Prospect → Opportunité → Devis → Commande → Sourcing → Achat → Import → Stock → Livraison → Installation → Maintenance → Facturation**

## Script SQL (source de vérité DDL)

Fichier unique MySQL 8 (~142 tables) :

- [`sql/sinfinity_schema.sql`](./sql/sinfinity_schema.sql)

```bash
mysql -u root -p < database/sql/sinfinity_schema.sql
```

Conventions : [`conventions.md`](./conventions.md)

## Modules

| # | Module | Fichier | Tables |
|---|--------|---------|--------|
| 1 | Organisation et Sécurité | [01_organisation_securite.md](./modules/01_organisation_securite.md) | 11 |
| 2 | CRM et Clients | [02_crm_clients.md](./modules/02_crm_clients.md) | 11 |
| 3 | Catalogue Produits et Services | [03_catalogue.md](./modules/03_catalogue.md) | 12 |
| 4 | Fournisseurs et Sourcing | [04_fournisseurs.md](./modules/04_fournisseurs.md) | 11 |
| 5 | Demandes de Sourcing | [05_procurement.md](./modules/05_procurement.md) | 6 |
| 6 | Devis Commerciaux | [06_quotations.md](./modules/06_quotations.md) | 6 |
| 7 | Commandes Clients | [07_sales_orders.md](./modules/07_sales_orders.md) | 5 |
| 8 | Achats Fournisseurs | [08_purchase_orders.md](./modules/08_purchase_orders.md) | 5 |
| 9 | Coût Rendu en RDC | [09_landed_costs.md](./modules/09_landed_costs.md) | 8 |
| 10 | Logistique et Importation | [10_logistique.md](./modules/10_logistique.md) | 9 |
| 11 | Entrepôts et Stock | [11_stock.md](./modules/11_stock.md) | 9 |
| 12 | Livraison | [12_delivery.md](./modules/12_delivery.md) | 5 |
| 13 | Projets et Installation | [13_projets.md](./modules/13_projets.md) | 8 |
| 14 | Maintenance et Support | [14_maintenance.md](./modules/14_maintenance.md) | 9 |
| 15 | Facturation et Finances | [15_finances.md](./modules/15_finances.md) | 9 |
| 16 | Gestion Documentaire | [16_documents.md](./modules/16_documents.md) | 6 |
| 17 | Communication et Tâches | [17_communication.md](./modules/17_communication.md) | 5 |
| 18 | Paramétrage global | [18_settings.md](./modules/18_settings.md) | 8 |

## Conventions de conception

### Clés et audit

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | `CHAR(36)` UUID | Clé primaire |
| `organization_id` | FK | Isolation multi-tenant |
| `created_at` / `updated_at` | `DATETIME(3)` | Audit |
| `created_by` / `updated_by` | FK → users | Auteur |
| `deleted_at` | `DATETIME(3)` NULL | Soft delete (si applicable) |

### Multi-tenant

Données opérationnelles scopées par `organization_id`. Référentiels globaux (`currencies`, `countries`, etc.) partagés.

### Statuts

Workflows via enums ou tables référentiel + `*_status_history` quand le suivi est critique.

### Polymorphisme documentaire

Documents / commentaires / notifications via `(entity_type, entity_id)` ou `document_links`.

## Flux métier principaux

```text
leads → opportunities → quotations → sales_orders
                                      ↓
                    procurement_requests → purchase_orders
                                      ↓
                         shipments → landed_costs → inventory
                                      ↓
                              deliveries → projects / installations
                                      ↓
                         invoices → payments / maintenance
```

## Fichiers

- [sql/sinfinity_schema.sql](./sql/sinfinity_schema.sql) — DDL MySQL complet
- [dictionnaire-donnees.md](./dictionnaire-donnees.md) — index des tables
- [modules/](./modules/) — description détaillée par domaine
- [conventions.md](./conventions.md) — règles MySQL 8
