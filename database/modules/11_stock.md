# Module 11 — Entrepôts et Gestion de Stock

Stock physique, mouvements, lots et numéros de série.

## Tables

### `warehouses`

Entrepôts (physiques).

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `organization_id` | FK | Organisation |
| `branch_id` | FK → branches NULL | Agence |
| `code` | VARCHAR | Code |
| `name` | VARCHAR | Nom |
| `address` | TEXT | Adresse |
| `city_id` | FK → cities | Ville |
| `manager_user_id` | FK → users | Responsable |
| `is_active` | BOOLEAN | Actif |

---

### `warehouse_locations`

Emplacements (allée, rangée, étagère).

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `warehouse_id` | FK → warehouses | Entrepôt |
| `code` | VARCHAR | Ex. : A-01-03 |
| `aisle` | VARCHAR | Allée |
| `rack` | VARCHAR | Rangée |
| `shelf` | VARCHAR | Étagère |
| `is_active` | BOOLEAN | Actif |

---

### `inventory`

Stock actuel (quantité disponible par produit / emplacement).

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `organization_id` | FK | Organisation |
| `warehouse_id` | FK → warehouses | Entrepôt |
| `location_id` | FK → warehouse_locations NULL | Emplacement |
| `product_id` | FK → products | Produit |
| `batch_id` | FK → inventory_batches NULL | Lot |
| `quantity_on_hand` | DECIMAL | Quantité physique |
| `quantity_reserved` | DECIMAL | Quantité réservée |
| `quantity_available` | DECIMAL | Disponible (calculé ou stocké) |
| UNIQUE | (warehouse, location, product, batch) | Unicité stock |

---

### `inventory_movements`

Entrées et sorties de stock (traçabilité complète).

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `organization_id` | FK | Organisation |
| `product_id` | FK → products | Produit |
| `warehouse_id` | FK → warehouses | Entrepôt |
| `location_id` | FK NULL | Emplacement |
| `movement_type` | ENUM | in / out / transfer / adjustment / reserve / unreserve |
| `quantity` | DECIMAL | Quantité (+/-) |
| `reference_type` | VARCHAR | receipt / delivery / transfer… |
| `reference_id` | UUID | Document source |
| `moved_at` | TIMESTAMP | Date |
| `moved_by` | FK → users | Auteur |
| `notes` | TEXT | Remarques |

---

### `stock_transfers`

Transferts entre entrepôts.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `organization_id` | FK | Organisation |
| `transfer_number` | VARCHAR | N° transfert |
| `from_warehouse_id` | FK → warehouses | Origine |
| `to_warehouse_id` | FK → warehouses | Destination |
| `status` | ENUM | draft / in_transit / completed / cancelled |
| `transferred_at` | TIMESTAMP | Date |
| `requested_by` / `approved_by` | FK → users | Acteurs |

---

### `stock_adjustments`

Corrections de stock (pertes, cassures, inventaire).

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `organization_id` | FK | Organisation |
| `warehouse_id` | FK → warehouses | Entrepôt |
| `product_id` | FK → products | Produit |
| `quantity_before` | DECIMAL | Avant |
| `quantity_after` | DECIMAL | Après |
| `reason` | ENUM | loss / damage / count / other |
| `adjusted_by` | FK → users | Auteur |
| `adjusted_at` | TIMESTAMP | Date |
| `notes` | TEXT | Commentaire |

---

### `stock_reservations`

Stock réservé pour des commandes en cours.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `inventory_id` | FK → inventory | Ligne stock |
| `sales_order_id` | FK → sales_orders | Commande |
| `sales_order_item_id` | FK | Ligne commande |
| `quantity` | DECIMAL | Quantité réservée |
| `status` | ENUM | active / released / fulfilled |
| `reserved_at` | TIMESTAMP | Date |
| `expires_at` | TIMESTAMP NULL | Expiration |

---

### `inventory_batches`

Gestion par lots (date de fabrication, péremption).

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `organization_id` | FK | Organisation |
| `product_id` | FK → products | Produit |
| `batch_number` | VARCHAR | N° lot |
| `manufactured_at` | DATE | Fabrication |
| `expires_at` | DATE | Péremption |
| `supplier_id` | FK → suppliers NULL | Origine |

---

### `serial_numbers`

Numéros de série (suivi individuel des équipements).

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `organization_id` | FK | Organisation |
| `product_id` | FK → products | Produit |
| `serial_number` | VARCHAR UNIQUE | N° de série |
| `batch_id` | FK → inventory_batches NULL | Lot |
| `warehouse_id` | FK → warehouses NULL | Emplacement actuel |
| `status` | ENUM | in_stock / reserved / shipped / installed / returned / scrapped |
| `purchase_order_item_id` | FK NULL | Origine achat |
| `sales_order_item_id` | FK NULL | Vente liée |

## Règles

- Toute variation de `inventory` passe par `inventory_movements`.
- `quantity_available = quantity_on_hand - quantity_reserved`.
