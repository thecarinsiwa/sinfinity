# Module 4 — Fournisseurs et Sourcing

Fournisseurs internationaux / locaux, catalogues, offres et évaluations.

## Tables

### `suppliers`

Fournisseurs (Chine, Dubaï, Europe, locaux).

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `organization_id` | FK | Organisation |
| `code` | VARCHAR | Code fournisseur |
| `name` | VARCHAR | Raison sociale |
| `category_id` | FK → supplier_categories | Catégorie |
| `country_id` | FK → countries | Pays |
| `email` / `phone` / `website` | VARCHAR | Coordonnées |
| `tax_id` | VARCHAR | Identifiant fiscal |
| `rating` | DECIMAL | Note globale |
| `status` | ENUM | active / inactive / blacklisted |
| `preferred` | BOOLEAN | Fournisseur préféré |

---

### `supplier_contacts`

Personnes de contact chez les fournisseurs.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `supplier_id` | FK → suppliers | Fournisseur |
| `first_name` / `last_name` | VARCHAR | Nom |
| `title` | VARCHAR | Fonction |
| `email` / `phone` | VARCHAR | Coordonnées |
| `is_primary` | BOOLEAN | Contact principal |

---

### `supplier_addresses`

Adresses des fournisseurs.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `supplier_id` | FK → suppliers | Fournisseur |
| `type` | ENUM | hq / warehouse / factory / billing |
| `line1` / `line2` | VARCHAR | Adresse |
| `city_id` | FK → cities | Ville |
| `country_id` | FK → countries | Pays |
| `is_default` | BOOLEAN | Par défaut |

---

### `supplier_categories`

Catégories de fournisseurs (électronique, câblage, etc.).

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `organization_id` | FK | Organisation |
| `code` | VARCHAR | Code |
| `name` | VARCHAR | Libellé |

---

### `supplier_products`

Produits proposés par chaque fournisseur (avec prix et délai).

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `supplier_id` | FK → suppliers | Fournisseur |
| `product_id` | FK → products | Produit catalogue |
| `supplier_sku` | VARCHAR | Réf. fournisseur |
| `unit_price` | DECIMAL | Prix |
| `currency_id` | FK → currencies | Devise |
| `moq` | DECIMAL | Quantité min. commande |
| `lead_time_days` | INTEGER | Délai (jours) |
| `is_available` | BOOLEAN | Disponibilité |

---

### `supplier_quotes`

Offres reçues des fournisseurs (hors demande de procurement formalisée).

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `organization_id` | FK | Organisation |
| `supplier_id` | FK → suppliers | Fournisseur |
| `quote_number` | VARCHAR | N° offre |
| `quote_date` | DATE | Date |
| `valid_until` | DATE | Validité |
| `currency_id` | FK → currencies | Devise |
| `status` | ENUM | draft / received / selected / rejected / expired |
| `notes` | TEXT | Remarques |

---

### `supplier_quote_items`

Détails des offres fournisseurs (produit, prix, quantité).

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `supplier_quote_id` | FK → supplier_quotes | Offre |
| `product_id` | FK → products | Produit |
| `description` | TEXT | Description |
| `quantity` | DECIMAL | Quantité |
| `unit_price` | DECIMAL | Prix unitaire |
| `lead_time_days` | INTEGER | Délai |
| `line_total` | DECIMAL | Total |

---

### `supplier_evaluations`

Évaluation des fournisseurs (qualité, délai, prix).

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `supplier_id` | FK → suppliers | Fournisseur |
| `evaluated_by` | FK → users | Évaluateur |
| `evaluated_at` | DATE | Date |
| `quality_score` | INTEGER | Note qualité (1–5) |
| `delivery_score` | INTEGER | Note délai |
| `price_score` | INTEGER | Note prix |
| `overall_score` | DECIMAL | Score global |
| `comments` | TEXT | Commentaires |

---

### `supplier_documents`

Documents fournisseurs (certificats, catalogues).

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `supplier_id` | FK → suppliers | Fournisseur |
| `document_id` | FK → documents | Document |
| `doc_kind` | VARCHAR | certificate / catalog / contract… |
| `expires_at` | DATE | Expiration éventuelle |

---

### `supplier_payment_terms`

Conditions de paiement par fournisseur.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `supplier_id` | FK → suppliers | Fournisseur |
| `payment_term_id` | FK → payment_terms | Condition |
| `is_default` | BOOLEAN | Par défaut |
| `notes` | TEXT | Précisions (TT, LC…) |

---

### `supplier_histories`

Historique des transactions avec chaque fournisseur.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `supplier_id` | FK → suppliers | Fournisseur |
| `event_type` | VARCHAR | quote / po / payment / evaluation… |
| `entity_type` / `entity_id` | VARCHAR / UUID | Référence métier |
| `summary` | TEXT | Résumé |
| `amount` | DECIMAL | Montant éventuel |
| `currency_id` | FK → currencies | Devise |
| `occurred_at` | TIMESTAMP | Date événement |

## Notes

- Distinguer `supplier_quotes` (offres libres) et `procurement_quotes` (réponses à une demande de sourcing).
- Les évaluations alimentent le `rating` du fournisseur.
