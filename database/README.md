# Base de données Sinfinity

Documentation de conception du modèle de données pour la plateforme Sinfinity — ERP / CRM orienté sourcing, importation RDC, logistique et déploiement technique.

## Objectif

Couvrir le cycle complet :

**Prospect → Opportunité → Devis → Commande → Sourcing → Achat → Import → Stock → Livraison → Installation → Maintenance → Facturation**

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

**Total estimé : ~143 tables**

## Conventions de conception

### Clés et audit

Chaque table métier inclut en principe :

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID / BIGINT | Clé primaire |
| `organization_id` | FK | Isolation multi-tenant |
| `created_at` | TIMESTAMP | Date de création |
| `updated_at` | TIMESTAMP | Dernière modification |
| `created_by` | FK → users | Auteur |
| `updated_by` | FK → users | Dernier modificateur |
| `deleted_at` | TIMESTAMP NULL | Soft delete (si applicable) |

### Multi-tenant

Toutes les données opérationnelles sont scopées par `organization_id`. Les tables de référentiel global (`currencies`, `countries`, etc.) peuvent être partagées ou scopées selon le besoin.

### Statuts

Les workflows (devis, commandes, expéditions, tickets…) utilisent des référentiels de statut ou des enums contrôlés, avec historisation dans des tables `*_status_history` lorsque le suivi est critique.

### Polymorphisme documentaire

Les documents, commentaires et notifications se lient aux entités via `(entity_type, entity_id)` ou via `document_links`.

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

- [dictionnaire-donnees.md](./dictionnaire-donnees.md) — index consolidé (rôle de chaque table)
- [modules/](./modules/) — description détaillée par domaine (colonnes, relations)
