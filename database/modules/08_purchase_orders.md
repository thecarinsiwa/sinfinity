# Module 8 — Achats Fournisseurs (Purchase Orders)

Commandes d'achat, paiements fournisseurs et réceptions.

## Tables

### `purchase_orders`

Commandes passées aux fournisseurs.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `organization_id` | FK | Organisation |
| `po_number` | VARCHAR | N° BC |
| `supplier_id` | FK → suppliers | Fournisseur |
| `procurement_request_id` | FK NULL | Demande sourcing |
| `procurement_quote_id` | FK NULL | Offre retenue |
| `status` | ENUM | draft / sent / confirmed / partial / received / closed / cancelled |
| `order_date` | DATE | Date commande |
| `expected_date` | DATE | Réception prévue |
| `currency_id` | FK → currencies | Devise |
| `shipping_term_id` | FK → shipping_terms | Incoterm |
| `payment_term_id` | FK → payment_terms | Conditions paiement |
| `subtotal` / `tax_amount` / `total_amount` | DECIMAL | Montants |
| `buyer_user_id` | FK → users | Acheteur |

---

### `purchase_order_items`

Produits achetés.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `purchase_order_id` | FK → purchase_orders | BC |
| `product_id` | FK → products | Produit |
| `description` | TEXT | Description |
| `quantity` | DECIMAL | Quantité commandée |
| `quantity_received` | DECIMAL | Quantité reçue |
| `unit_price` | DECIMAL | Prix unitaire |
| `line_total` | DECIMAL | Total ligne |

---

### `purchase_order_payments`

Paiements effectués aux fournisseurs.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `purchase_order_id` | FK → purchase_orders | BC |
| `amount` | DECIMAL | Montant |
| `currency_id` | FK → currencies | Devise |
| `payment_method_id` | FK → payment_methods | Mode |
| `paid_at` | TIMESTAMP | Date |
| `reference` | VARCHAR | Référence |
| `notes` | TEXT | Remarques |

---

### `purchase_order_status_history`

Historique des statuts.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `purchase_order_id` | FK → purchase_orders | BC |
| `from_status` | VARCHAR | Ancien |
| `to_status` | VARCHAR | Nouveau |
| `changed_by` | FK → users | Auteur |
| `changed_at` | TIMESTAMP | Date |
| `notes` | TEXT | Commentaire |

---

### `purchase_receipts`

Réceptions de marchandises (bons de réception).

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `organization_id` | FK | Organisation |
| `purchase_order_id` | FK → purchase_orders | BC |
| `receipt_number` | VARCHAR | N° BR |
| `warehouse_id` | FK → warehouses | Entrepôt |
| `received_at` | TIMESTAMP | Date réception |
| `received_by` | FK → users | Réceptionnaire |
| `shipment_id` | FK → shipments NULL | Expédition liée |
| `notes` | TEXT | Remarques |
| `status` | ENUM | draft / confirmed |

## Notes

- La confirmation d'un `purchase_receipt` génère des `inventory_movements` (entrée).
- Les coûts d'achat alimentent `landed_costs` et `accounts_payable`.
