# Module 15 — Facturation et Finances

Factures, paiements, dépenses, créances et dettes.

## Tables

### `invoices`

Factures client.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `organization_id` | FK | Organisation |
| `invoice_number` | VARCHAR | N° facture |
| `customer_id` | FK → customers | Client |
| `sales_order_id` | FK → sales_orders NULL | Commande |
| `issue_date` | DATE | Date émission |
| `due_date` | DATE | Échéance |
| `currency_id` | FK → currencies | Devise |
| `subtotal` / `tax_amount` / `total_amount` | DECIMAL | Montants |
| `amount_paid` | DECIMAL | Déjà payé |
| `status` | ENUM | draft / issued / partially_paid / paid / overdue / cancelled |
| `notes` | TEXT | Notes |

---

### `invoice_items`

Lignes de facture.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `invoice_id` | FK → invoices | Facture |
| `product_id` / `service_id` | FK NULL | Article |
| `description` | TEXT | Description |
| `quantity` | DECIMAL | Quantité |
| `unit_price` | DECIMAL | Prix unitaire |
| `tax_id` | FK → taxes | Taxe |
| `line_total` | DECIMAL | Total ligne |

---

### `payments`

Paiements reçus des clients.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `organization_id` | FK | Organisation |
| `customer_id` | FK → customers | Client |
| `invoice_id` | FK → invoices NULL | Facture |
| `payment_method_id` | FK → payment_methods | Mode |
| `amount` | DECIMAL | Montant |
| `currency_id` | FK → currencies | Devise |
| `paid_at` | TIMESTAMP | Date |
| `reference` | VARCHAR | Réf. transaction |
| `status` | ENUM | pending / confirmed / failed / reversed |

---

### `payment_methods`

Modes de paiement (Cash, Banque, Mobile Money, Virement).

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `organization_id` | FK | Organisation |
| `code` | VARCHAR | CASH, BANK, MOBILE_MONEY, WIRE |
| `name` | VARCHAR | Libellé |
| `is_active` | BOOLEAN | Actif |

---

### `expenses`

Dépenses (frais généraux, douane, transport).

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `organization_id` | FK | Organisation |
| `category_id` | FK → expense_categories | Catégorie |
| `title` | VARCHAR | Libellé |
| `amount` | DECIMAL | Montant |
| `currency_id` | FK → currencies | Devise |
| `expense_date` | DATE | Date |
| `supplier_id` | FK → suppliers NULL | Fournisseur |
| `landed_cost_id` | FK NULL | Lien coût rendu |
| `paid_by` | FK → users | Déclarant |
| `status` | ENUM | draft / approved / paid / rejected |

---

### `expense_categories`

Catégories de dépenses.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `organization_id` | FK | Organisation |
| `code` | VARCHAR | Code |
| `name` | VARCHAR | Libellé |
| `parent_id` | FK NULL | Hiérarchie |

---

### `refunds`

Remboursements (avoir).

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `organization_id` | FK | Organisation |
| `invoice_id` | FK → invoices | Facture d'origine |
| `customer_id` | FK → customers | Client |
| `amount` | DECIMAL | Montant |
| `currency_id` | FK → currencies | Devise |
| `reason` | TEXT | Motif |
| `status` | ENUM | draft / issued / applied |
| `refunded_at` | TIMESTAMP | Date |

---

### `accounts_receivable`

Créances clients (suivi des impayés).

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `organization_id` | FK | Organisation |
| `customer_id` | FK → customers | Client |
| `invoice_id` | FK → invoices | Facture |
| `original_amount` | DECIMAL | Montant initial |
| `balance_due` | DECIMAL | Solde dû |
| `due_date` | DATE | Échéance |
| `aging_bucket` | VARCHAR | 0-30 / 31-60 / 61-90 / 90+ |
| `status` | ENUM | open / partial / closed / written_off |

---

### `accounts_payable`

Dettes fournisseurs (suivi des paiements).

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `organization_id` | FK | Organisation |
| `supplier_id` | FK → suppliers | Fournisseur |
| `purchase_order_id` | FK → purchase_orders NULL | BC |
| `original_amount` | DECIMAL | Montant initial |
| `balance_due` | DECIMAL | Solde dû |
| `due_date` | DATE | Échéance |
| `status` | ENUM | open / partial / paid / cancelled |

## Notes

- `payments` met à jour `invoices.amount_paid` et `accounts_receivable.balance_due`.
- Les frais d'import peuvent être à la fois dans `expenses` et ventilés via `landed_costs`.
