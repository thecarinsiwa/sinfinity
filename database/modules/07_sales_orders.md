# Module 7 — Commandes Clients (Sales Orders)

Commandes clients, lignes, paiements et documents associés.

## Tables

### `sales_orders`

Commandes clients.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `organization_id` | FK | Organisation |
| `order_number` | VARCHAR | N° commande |
| `customer_id` | FK → customers | Client |
| `quotation_id` | FK → quotations NULL | Devis d'origine |
| `branch_id` | FK → branches | Agence |
| `status` | ENUM | pending / confirmed / in_progress / partially_delivered / delivered / cancelled |
| `order_date` | DATE | Date commande |
| `requested_delivery_date` | DATE | Livraison souhaitée |
| `currency_id` | FK → currencies | Devise |
| `subtotal` / `tax_amount` / `total_amount` | DECIMAL | Montants |
| `billing_address_id` | FK → customer_addresses | Facturation |
| `shipping_address_id` | FK → customer_addresses | Livraison |
| `owner_user_id` | FK → users | Commercial |

---

### `sales_order_items`

Produits / services commandés.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `sales_order_id` | FK → sales_orders | Commande |
| `product_id` | FK → products NULL | Produit |
| `service_id` | FK → services NULL | Service |
| `description` | TEXT | Description |
| `quantity` | DECIMAL | Quantité commandée |
| `quantity_delivered` | DECIMAL | Quantité livrée |
| `unit_price` | DECIMAL | Prix unitaire |
| `tax_id` | FK → taxes | Taxe |
| `line_total` | DECIMAL | Total ligne |

---

### `sales_order_status_history`

Historique des statuts (En attente, En cours, Livré, etc.).

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `sales_order_id` | FK → sales_orders | Commande |
| `from_status` | VARCHAR | Ancien statut |
| `to_status` | VARCHAR | Nouveau statut |
| `changed_by` | FK → users | Auteur |
| `changed_at` | TIMESTAMP | Date |
| `notes` | TEXT | Commentaire |

---

### `sales_order_payments`

Paiements liés à la commande (acompte, solde).

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `sales_order_id` | FK → sales_orders | Commande |
| `payment_id` | FK → payments NULL | Paiement finance |
| `payment_type` | ENUM | deposit / partial / balance |
| `amount` | DECIMAL | Montant |
| `currency_id` | FK → currencies | Devise |
| `paid_at` | TIMESTAMP | Date |
| `reference` | VARCHAR | Réf. bancaire / Mobile Money |

---

### `sales_order_documents`

Documents associés (BC client, contrat).

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `sales_order_id` | FK → sales_orders | Commande |
| `document_id` | FK → documents | Document |
| `doc_kind` | VARCHAR | purchase_order / contract / other |

## Notes

- Une commande acceptée peut déclencher `procurement_requests` et/ou `stock_reservations`.
- Les montants encaissés alimentent aussi `payments` / `accounts_receivable`.
