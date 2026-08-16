# Module 18 — Paramétrage global (Settings)

Référentiels transverses : devises, taxes, géographie, conditions commerciales et logistiques.

## Tables

### `currencies`

Devises (USD, CDF, CNY, EUR).

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `code` | CHAR(3) UNIQUE | ISO 4217 |
| `name` | VARCHAR | Libellé |
| `symbol` | VARCHAR | Symbole |
| `decimal_places` | INTEGER | Décimales |
| `is_active` | BOOLEAN | Actif |

---

### `exchange_rates`

Taux de change historiques.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `from_currency_id` | FK → currencies | Devise source |
| `to_currency_id` | FK → currencies | Devise cible |
| `rate` | DECIMAL | Taux |
| `rate_date` | DATE | Date de validité |
| `source` | VARCHAR | Source (manuel, API…) |
| UNIQUE | (`from`, `to`, `rate_date`) | Unicité journalière |

---

### `taxes`

Taxes (TVA, droits de douane).

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `organization_id` | FK NULL | Portée org / global |
| `code` | VARCHAR | TVA16, DUTY… |
| `name` | VARCHAR | Libellé |
| `rate` | DECIMAL | Taux % |
| `tax_type` | ENUM | vat / customs / withholding / other |
| `country_id` | FK → countries NULL | Pays d'application |
| `is_active` | BOOLEAN | Actif |

---

### `units`

Unités de mesure (pièce, kg, carton).

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `code` | VARCHAR UNIQUE | PCS, KG, BOX, M |
| `name` | VARCHAR | Libellé |
| `symbol` | VARCHAR | Symbole |
| `unit_type` | ENUM | count / weight / length / volume |

> Peut servir de source unique pour `product_units`.

---

### `countries`

Pays.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `code` | CHAR(2) UNIQUE | ISO 3166-1 alpha-2 |
| `code3` | CHAR(3) | ISO alpha-3 |
| `name` | VARCHAR | Nom |
| `phone_code` | VARCHAR | Indicatif |

---

### `cities`

Villes.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `country_id` | FK → countries | Pays |
| `name` | VARCHAR | Nom |
| `region` | VARCHAR | Province / région |
| UNIQUE | (`country_id`, `name`, `region`) | Unicité relative |

---

### `payment_terms`

Conditions de paiement (30 jours, 60 jours, à la livraison).

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `organization_id` | FK NULL | Portée |
| `code` | VARCHAR | NET30, NET60, COD… |
| `name` | VARCHAR | Libellé |
| `days_due` | INTEGER | Jours net |
| `description` | TEXT | Détail |

---

### `shipping_terms`

Conditions logistiques (FOB, CIF, EXW).

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `code` | VARCHAR UNIQUE | FOB, CIF, EXW, DDP, DDU… |
| `name` | VARCHAR | Libellé |
| `description` | TEXT | Responsabilités acheteur / vendeur |
| `incoterm_version` | VARCHAR | Ex. : Incoterms 2020 |

## Notes

- Les devises et taux de change sont critiques pour le sourcing multi-pays (CNY / USD / EUR / CDF).
- Préférer des référentiels seedés (pays, devises, incoterms) plutôt que saisie libre.
- `system_settings` (module 1) pointe vers ces tables pour les valeurs par défaut de l'organisation.
