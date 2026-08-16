# Module 2 — CRM et Gestion des Clients

Clients, prospects, activités commerciales et opportunités.

## Tables

### `customers`

Clients particuliers ou organisations (institutions, ONG, entreprises).

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `organization_id` | FK | Organisation |
| `category_id` | FK → customer_categories | Catégorie |
| `code` | VARCHAR | Code client |
| `type` | ENUM | individual / organization |
| `name` | VARCHAR | Nom / raison sociale |
| `legal_name` | VARCHAR | Nom légal |
| `tax_id` | VARCHAR | NIF |
| `email` | VARCHAR | Email |
| `phone` | VARCHAR | Téléphone |
| `website` | VARCHAR | Site web |
| `owner_user_id` | FK → users | Commercial responsable |
| `status` | ENUM | active / inactive / blocked |
| `converted_from_lead_id` | FK → leads NULL | Origine prospect |

---

### `customer_contacts`

Personnes de contact chez les clients.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `customer_id` | FK → customers | Client |
| `first_name` | VARCHAR | Prénom |
| `last_name` | VARCHAR | Nom |
| `title` | VARCHAR | Fonction |
| `email` | VARCHAR | Email |
| `phone` | VARCHAR | Téléphone |
| `is_primary` | BOOLEAN | Contact principal |
| `is_decision_maker` | BOOLEAN | Décideur |

---

### `customer_addresses`

Adresses de facturation / livraison.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `customer_id` | FK → customers | Client |
| `type` | ENUM | billing / shipping / both |
| `label` | VARCHAR | Libellé (Siège, Campus…) |
| `line1` / `line2` | VARCHAR | Adresse |
| `city_id` | FK → cities | Ville |
| `country_id` | FK → countries | Pays |
| `postal_code` | VARCHAR | Code postal |
| `is_default` | BOOLEAN | Adresse par défaut |

---

### `customer_categories`

Catégories : Université, ONG, Entreprise, Particulier, etc.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `organization_id` | FK | Organisation |
| `code` | VARCHAR | Code |
| `name` | VARCHAR | Libellé |
| `description` | TEXT | Description |

---

### `customer_notes`

Notes et informations complémentaires.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `customer_id` | FK → customers | Client |
| `author_id` | FK → users | Auteur |
| `note` | TEXT | Contenu |
| `is_pinned` | BOOLEAN | Épinglée |
| `created_at` | TIMESTAMP | Date |

---

### `leads`

Prospects (source : LinkedIn, site web, prospection directe).

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `organization_id` | FK | Organisation |
| `source_id` | FK → lead_sources | Source |
| `company_name` | VARCHAR | Organisation prospect |
| `contact_name` | VARCHAR | Contact |
| `email` / `phone` | VARCHAR | Coordonnées |
| `status` | ENUM | new / contacted / qualified / converted / lost |
| `owner_user_id` | FK → users | Commercial |
| `estimated_value` | DECIMAL | Potentiel |
| `currency_id` | FK → currencies | Devise |
| `converted_customer_id` | FK → customers NULL | Client créé |

---

### `lead_sources`

Référentiel des sources de prospects.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `organization_id` | FK | Organisation |
| `code` | VARCHAR | LINKEDIN, WEBSITE, DIRECT… |
| `name` | VARCHAR | Libellé |

---

### `sales_activities`

Appels, e-mails, réunions, visites effectuées.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `organization_id` | FK | Organisation |
| `activity_type_id` | FK → activity_types | Type |
| `subject` | VARCHAR | Objet |
| `description` | TEXT | Détail |
| `related_type` | VARCHAR | lead / customer / opportunity |
| `related_id` | UUID | Entité liée |
| `user_id` | FK → users | Commercial |
| `scheduled_at` | TIMESTAMP | Planifié |
| `completed_at` | TIMESTAMP | Réalisé |
| `outcome` | VARCHAR | Résultat |

---

### `activity_types`

Types d'activités (Appel, Email, Réunion, Visite).

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `code` | VARCHAR | CALL, EMAIL, MEETING, VISIT |
| `name` | VARCHAR | Libellé |
| `icon` | VARCHAR | Icône UI |

---

### `opportunities`

Opportunités commerciales.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `organization_id` | FK | Organisation |
| `customer_id` | FK → customers | Client |
| `lead_id` | FK → leads NULL | Prospect d'origine |
| `name` | VARCHAR | Titre |
| `stage` | ENUM | qualification / proposal / negotiation / won / lost |
| `probability` | INTEGER | % de réussite |
| `expected_close_date` | DATE | Clôture prévue |
| `amount` | DECIMAL | Montant estimé |
| `currency_id` | FK → currencies | Devise |
| `owner_user_id` | FK → users | Responsable |

---

### `opportunity_items`

Produits / services liés à une opportunité.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `opportunity_id` | FK → opportunities | Opportunité |
| `product_id` | FK → products NULL | Produit |
| `service_id` | FK → services NULL | Service |
| `description` | TEXT | Description ligne |
| `quantity` | DECIMAL | Quantité |
| `unit_price` | DECIMAL | Prix unitaire |
| `line_total` | DECIMAL | Total ligne |

## Flux

```text
lead → (qualification) → customer + opportunity → quotation
```
