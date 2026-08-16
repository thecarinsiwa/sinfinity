# Module 10 — Logistique et Importation

Expéditions internationales, transporteurs, douane et documents d'import.

## Tables

### `shipments`

Expéditions (conteneurs, colis).

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `organization_id` | FK | Organisation |
| `shipment_number` | VARCHAR | N° expédition |
| `purchase_order_id` | FK → purchase_orders NULL | BC lié |
| `carrier_id` | FK → carriers | Transporteur |
| `shipping_method_id` | FK → shipping_methods | Mode |
| `container_number` | VARCHAR | N° conteneur |
| `bl_number` | VARCHAR | Bill of Lading / AWB |
| `origin_country_id` | FK → countries | Origine |
| `destination_country_id` | FK → countries | Destination |
| `etd` / `eta` | DATE | Départ / arrivée estimés |
| `atd` / `ata` | DATE | Départ / arrivée réels |
| `status` | ENUM | booked / in_transit / arrived / cleared / delivered / cancelled |

---

### `shipment_items`

Produits expédiés dans une expédition.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `shipment_id` | FK → shipments | Expédition |
| `purchase_order_item_id` | FK NULL | Ligne BC |
| `product_id` | FK → products | Produit |
| `quantity` | DECIMAL | Quantité |
| `weight_kg` | DECIMAL | Poids |
| `volume_cbm` | DECIMAL | Volume |

---

### `shipping_methods`

Modes de transport (Mer, Air, Route).

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `code` | VARCHAR | SEA, AIR, ROAD, RAIL |
| `name` | VARCHAR | Libellé |
| `description` | TEXT | Description |

---

### `carriers`

Transporteurs (MSC, DHL, Maersk, etc.).

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `organization_id` | FK | Organisation |
| `name` | VARCHAR | Nom |
| `code` | VARCHAR | Code |
| `contact_email` / `contact_phone` | VARCHAR | Contact |
| `tracking_url_template` | VARCHAR | URL suivi |
| `is_active` | BOOLEAN | Actif |

---

### `shipment_tracking`

Suivi étape par étape (dates, localisations).

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `shipment_id` | FK → shipments | Expédition |
| `status` | VARCHAR | Statut étape |
| `location` | VARCHAR | Lieu |
| `event_at` | TIMESTAMP | Horodatage |
| `description` | TEXT | Détail |
| `source` | ENUM | manual / api / carrier |

---

### `customs_declarations`

Déclarations douanières.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `organization_id` | FK | Organisation |
| `shipment_id` | FK → shipments | Expédition |
| `declaration_number` | VARCHAR | N° déclaration |
| `regime` | VARCHAR | DDU, DDP, etc. |
| `declared_value` | DECIMAL | Valeur déclarée |
| `currency_id` | FK → currencies | Devise |
| `status` | ENUM | draft / submitted / cleared / rejected |
| `cleared_at` | TIMESTAMP | Date dédouanement |

---

### `customs_documents`

Documents douaniers (DDU, DDP, etc.).

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `customs_declaration_id` | FK | Déclaration |
| `document_id` | FK → documents | Fichier |
| `doc_kind` | VARCHAR | Type document douane |

---

### `import_documents`

Documents d'importation (BL, certificat d'origine).

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `shipment_id` | FK → shipments | Expédition |
| `document_id` | FK → documents | Fichier |
| `doc_kind` | VARCHAR | bl / awb / certificate_of_origin / packing_list / invoice |

---

### `delivery_addresses`

Destinations de livraison (adresses temporaires / ponctuelles).

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `organization_id` | FK | Organisation |
| `label` | VARCHAR | Libellé |
| `line1` / `line2` | VARCHAR | Adresse |
| `city_id` | FK → cities | Ville |
| `country_id` | FK → countries | Pays |
| `contact_name` / `contact_phone` | VARCHAR | Contact sur site |
| `customer_id` | FK → customers NULL | Client lié |
| `warehouse_id` | FK → warehouses NULL | Entrepôt lié |

## Notes

- Un `shipment` peut alimenter `landed_costs`, `purchase_receipts` et `customs_declarations`.
- `delivery_addresses` complète les adresses clients permanentes pour des destinations ad hoc.
