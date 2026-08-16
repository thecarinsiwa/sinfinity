# Module 6 — Devis Commerciaux (Quotations)

Devis clients, versions, conditions et validations internes.

## Tables

### `quotations`

Devis clients.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `organization_id` | FK | Organisation |
| `quote_number` | VARCHAR | N° devis |
| `customer_id` | FK → customers | Client |
| `opportunity_id` | FK → opportunities NULL | Opportunité |
| `status_id` | FK → quotation_statuses | Statut |
| `version` | INTEGER | N° version courante |
| `issue_date` | DATE | Date émission |
| `valid_until` | DATE | Validité |
| `currency_id` | FK → currencies | Devise |
| `exchange_rate` | DECIMAL | Taux appliqué |
| `subtotal` | DECIMAL | Sous-total HT |
| `tax_amount` | DECIMAL | Taxes |
| `total_amount` | DECIMAL | Total TTC |
| `owner_user_id` | FK → users | Commercial |
| `notes` | TEXT | Notes client |

---

### `quotation_items`

Lignes de produits / services du devis.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `quotation_id` | FK → quotations | Devis |
| `line_number` | INTEGER | Ordre |
| `product_id` | FK → products NULL | Produit |
| `service_id` | FK → services NULL | Service |
| `description` | TEXT | Description affichée |
| `quantity` | DECIMAL | Quantité |
| `unit_id` | FK → units | Unité |
| `unit_price` | DECIMAL | Prix unitaire |
| `discount_percent` | DECIMAL | Remise % |
| `tax_id` | FK → taxes | Taxe |
| `line_total` | DECIMAL | Total ligne |

---

### `quotation_versions`

Historique des versions du devis (modifications successives).

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `quotation_id` | FK → quotations | Devis |
| `version_number` | INTEGER | N° version |
| `snapshot` | JSONB | Copie complète du devis |
| `changed_by` | FK → users | Auteur |
| `change_reason` | TEXT | Motif |
| `created_at` | TIMESTAMP | Date |

---

### `quotation_terms`

Conditions commerciales (paiement, livraison, garantie).

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `quotation_id` | FK → quotations | Devis |
| `payment_term_id` | FK → payment_terms | Paiement |
| `shipping_term_id` | FK → shipping_terms | Incoterm / livraison |
| `warranty_text` | TEXT | Garantie |
| `delivery_lead_time_days` | INTEGER | Délai livraison |
| `additional_terms` | TEXT | Autres conditions |

---

### `quotation_approvals`

Validations internes du devis.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `quotation_id` | FK → quotations | Devis |
| `approver_id` | FK → users | Validateur |
| `status` | ENUM | pending / approved / rejected |
| `decision_at` | TIMESTAMP | Date |
| `comments` | TEXT | Commentaire |

---

### `quotation_statuses`

Référentiel des statuts (DRAFT, SENT, ACCEPTED, REJECTED, EXPIRED).

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `code` | VARCHAR UNIQUE | DRAFT, SENT, ACCEPTED… |
| `name` | VARCHAR | Libellé |
| `is_final` | BOOLEAN | Statut terminal |
| `sort_order` | INTEGER | Ordre workflow |

## Flux

```text
opportunity → quotation (DRAFT)
  → approval interne
  → SENT au client
  → ACCEPTED → sales_order
```
