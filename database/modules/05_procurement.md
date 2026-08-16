# Module 5 — Demandes de Sourcing (Procurement Requests)

Demandes internes de recherche fournisseurs, offres et validations.

## Tables

### `procurement_requests`

Demande de sourcing créée par un commercial.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `organization_id` | FK | Organisation |
| `request_number` | VARCHAR | N° demande |
| `title` | VARCHAR | Titre |
| `requested_by` | FK → users | Demandeur (commercial) |
| `opportunity_id` | FK → opportunities NULL | Opportunité liée |
| `sales_order_id` | FK → sales_orders NULL | Commande liée |
| `needed_by` | DATE | Date besoin |
| `status` | ENUM | draft / open / quoted / compared / approved / closed / cancelled |
| `priority` | ENUM | low / medium / high / urgent |
| `notes` | TEXT | Remarques |

---

### `procurement_request_items`

Produits recherchés dans une demande.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `procurement_request_id` | FK | Demande |
| `product_id` | FK → products NULL | Produit connu |
| `description` | TEXT | Spécification recherchée |
| `quantity` | DECIMAL | Quantité |
| `unit_id` | FK → units | Unité |
| `target_unit_price` | DECIMAL | Prix cible |
| `currency_id` | FK → currencies | Devise |

---

### `procurement_quotes`

Réponses des fournisseurs à une demande.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `procurement_request_id` | FK | Demande |
| `supplier_id` | FK → suppliers | Fournisseur |
| `quote_number` | VARCHAR | N° offre |
| `quote_date` | DATE | Date |
| `valid_until` | DATE | Validité |
| `currency_id` | FK → currencies | Devise |
| `shipping_term_id` | FK → shipping_terms | Incoterm |
| `lead_time_days` | INTEGER | Délai global |
| `status` | ENUM | received / shortlisted / selected / rejected |
| `total_amount` | DECIMAL | Total |

---

### `procurement_quote_items`

Détails des offres reçues.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `procurement_quote_id` | FK | Offre |
| `procurement_request_item_id` | FK | Ligne demande |
| `product_id` | FK → products | Produit |
| `quantity` | DECIMAL | Quantité |
| `unit_price` | DECIMAL | Prix unitaire |
| `lead_time_days` | INTEGER | Délai |
| `notes` | TEXT | Remarques |
| `line_total` | DECIMAL | Total ligne |

---

### `procurement_comparisons`

Comparaison des offres fournisseurs (tableau comparatif).

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `procurement_request_id` | FK | Demande |
| `compared_by` | FK → users | Auteur |
| `compared_at` | TIMESTAMP | Date |
| `criteria` | JSONB | Critères (prix, délai, qualité…) |
| `scores` | JSONB | Scores par offre |
| `selected_quote_id` | FK → procurement_quotes NULL | Offre retenue |
| `recommendation` | TEXT | Recommandation |

---

### `procurement_approvals`

Validation interne de l'achat (par le responsable).

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `procurement_request_id` | FK | Demande |
| `procurement_quote_id` | FK NULL | Offre validée |
| `approver_id` | FK → users | Validateur |
| `status` | ENUM | pending / approved / rejected |
| `decision_at` | TIMESTAMP | Date décision |
| `comments` | TEXT | Commentaire |

## Flux

```text
commercial crée procurement_request
  → procurement reçoit procurement_quotes
  → procurement_comparisons
  → procurement_approvals
  → purchase_orders
```
