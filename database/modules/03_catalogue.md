# Module 3 — Catalogue Produits et Services

Référentiel produits, marques, spécifications et services associés.

## Tables

### `products`

Produits (référence, nom, description, prix de base).

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `organization_id` | FK | Organisation |
| `sku` | VARCHAR | Référence interne |
| `name` | VARCHAR | Nom commercial |
| `description` | TEXT | Description |
| `category_id` | FK → product_categories | Catégorie |
| `subcategory_id` | FK → product_subcategories | Sous-catégorie |
| `brand_id` | FK → product_brands | Marque |
| `model_id` | FK → product_models | Modèle |
| `unit_id` | FK → product_units | Unité de vente |
| `base_price` | DECIMAL | Prix de base |
| `currency_id` | FK → currencies | Devise |
| `cost_price` | DECIMAL | Coût indicatif |
| `is_serialized` | BOOLEAN | Suivi par n° de série |
| `is_active` | BOOLEAN | Actif |

---

### `product_categories`

Catégories principales (Informatique, Réseaux, Énergie).

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `organization_id` | FK | Organisation |
| `code` | VARCHAR | Code |
| `name` | VARCHAR | Libellé |
| `parent_id` | FK NULL | Hiérarchie optionnelle |
| `sort_order` | INTEGER | Ordre d'affichage |

---

### `product_subcategories`

Sous-catégories (Ordinateurs, Switches, UPS).

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `category_id` | FK → product_categories | Catégorie parente |
| `code` | VARCHAR | Code |
| `name` | VARCHAR | Libellé |

---

### `product_brands`

Marques (HP, Dell, Cisco, APC).

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `organization_id` | FK | Organisation |
| `name` | VARCHAR | Nom marque |
| `logo_url` | VARCHAR | Logo |
| `website` | VARCHAR | Site constructeur |

---

### `product_models`

Modèles / références constructeur.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `brand_id` | FK → product_brands | Marque |
| `name` | VARCHAR | Nom modèle |
| `manufacturer_sku` | VARCHAR | Réf. constructeur |
| `description` | TEXT | Description |

---

### `product_specifications`

Caractéristiques techniques dynamiques (clé / valeur).

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `product_id` | FK → products | Produit |
| `spec_key` | VARCHAR | Clé (RAM, Ports…) |
| `spec_value` | VARCHAR | Valeur |
| `unit` | VARCHAR | Unité (GB, ports…) |
| `sort_order` | INTEGER | Ordre |

---

### `product_images`

Images des produits.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `product_id` | FK → products | Produit |
| `url` | VARCHAR | URL fichier |
| `alt_text` | VARCHAR | Texte alternatif |
| `is_primary` | BOOLEAN | Image principale |
| `sort_order` | INTEGER | Ordre |

---

### `product_units`

Unités de vente (Pièce, Carton, Kg, Mètre).

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `code` | VARCHAR | PCS, BOX, KG, M |
| `name` | VARCHAR | Libellé |
| `symbol` | VARCHAR | Symbole |

> Peut référencer ou synchroniser la table globale `units` (module 18).

---

### `services`

Services (Installation, Maintenance, Configuration).

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `organization_id` | FK | Organisation |
| `code` | VARCHAR | Référence |
| `name` | VARCHAR | Nom |
| `description` | TEXT | Description |
| `category_id` | FK → service_categories | Catégorie |
| `base_price` | DECIMAL | Prix de base |
| `currency_id` | FK → currencies | Devise |
| `billing_type` | ENUM | fixed / hourly / per_unit |
| `is_active` | BOOLEAN | Actif |

---

### `service_categories`

Catégories de services.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `organization_id` | FK | Organisation |
| `code` | VARCHAR | Code |
| `name` | VARCHAR | Libellé |

---

### `product_services`

Association des services aux produits (ex. : un switch nécessite une installation).

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `product_id` | FK → products | Produit |
| `service_id` | FK → services | Service |
| `is_required` | BOOLEAN | Obligatoire à la vente |
| `default_quantity` | DECIMAL | Quantité suggérée |
| UNIQUE | (`product_id`, `service_id`) | Unicité |

## Notes

- Catalogue découplé des prix fournisseurs (`supplier_products`).
- `is_serialized` pilote l'usage de `serial_numbers` en stock / installation.
