# Module 12 — Livraison (Delivery)

Livraisons clients, suivi, confirmations et preuves de livraison.

## Tables

### `deliveries`

Livraisons vers les clients.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `organization_id` | FK | Organisation |
| `delivery_number` | VARCHAR | N° livraison |
| `sales_order_id` | FK → sales_orders | Commande |
| `customer_id` | FK → customers | Client |
| `warehouse_id` | FK → warehouses | Entrepôt de sortie |
| `delivery_address_id` | FK NULL | Adresse (customer ou temporaire) |
| `scheduled_at` | TIMESTAMP | Planifiée |
| `delivered_at` | TIMESTAMP | Réalisée |
| `driver_user_id` | FK → users NULL | Chauffeur / livreur |
| `status` | ENUM | planned / in_transit / delivered / failed / cancelled |
| `notes` | TEXT | Remarques |

---

### `delivery_items`

Produits livrés.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `delivery_id` | FK → deliveries | Livraison |
| `sales_order_item_id` | FK | Ligne commande |
| `product_id` | FK → products | Produit |
| `quantity` | DECIMAL | Quantité livrée |
| `serial_number_ids` | JSONB / table liaison | N° de série livrés |

---

### `delivery_tracking`

Suivi des livraisons (position GPS, statut).

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `delivery_id` | FK → deliveries | Livraison |
| `status` | VARCHAR | Statut étape |
| `latitude` / `longitude` | DECIMAL | Position GPS |
| `location_label` | VARCHAR | Lieu textuel |
| `recorded_at` | TIMESTAMP | Horodatage |
| `notes` | TEXT | Remarques |

---

### `delivery_confirmations`

Confirmation de réception par le client.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `delivery_id` | FK → deliveries | Livraison |
| `confirmed_by_name` | VARCHAR | Nom signataire |
| `confirmed_at` | TIMESTAMP | Date |
| `status` | ENUM | accepted / accepted_with_remarks / rejected |
| `remarks` | TEXT | Observations client |

---

### `proof_of_delivery`

Preuve de livraison (signature, photo).

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `delivery_id` | FK → deliveries | Livraison |
| `confirmation_id` | FK → delivery_confirmations NULL | Confirmation |
| `document_id` | FK → documents | Fichier (photo / PDF) |
| `proof_type` | ENUM | signature / photo / document |
| `captured_at` | TIMESTAMP | Date capture |

## Flux

```text
sales_order → stock_reservation → delivery → inventory_movements (out)
  → delivery_confirmation + proof_of_delivery
```
