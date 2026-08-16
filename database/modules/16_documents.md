# Module 16 — Gestion Documentaire

Stockage de fichiers, versions, liaisons polymorphes et contrats cadres.

## Tables

### `documents`

Documents génériques (fichiers stockés).

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `organization_id` | FK | Organisation |
| `document_type_id` | FK → document_types | Type |
| `title` | VARCHAR | Titre |
| `file_name` | VARCHAR | Nom fichier |
| `file_url` | VARCHAR | URL / chemin stockage |
| `mime_type` | VARCHAR | Type MIME |
| `file_size` | BIGINT | Taille (octets) |
| `uploaded_by` | FK → users | Auteur |
| `checksum` | VARCHAR | Hash intégrité |
| `status` | ENUM | active / archived / deleted |

---

### `document_types`

Types de documents (Devis, Facture, BL, Contrat, etc.).

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `organization_id` | FK NULL | NULL = type système |
| `code` | VARCHAR | QUOTE, INVOICE, BL, CONTRACT… |
| `name` | VARCHAR | Libellé |
| `allowed_mime_types` | JSONB | Types autorisés |

---

### `document_versions`

Versions des documents.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `document_id` | FK → documents | Document |
| `version_number` | INTEGER | N° version |
| `file_url` | VARCHAR | Fichier versionné |
| `change_notes` | TEXT | Notes de changement |
| `created_by` | FK → users | Auteur |
| `created_at` | TIMESTAMP | Date |

---

### `document_links`

Liaison entre un document et une entité (client, commande, fournisseur).

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `document_id` | FK → documents | Document |
| `entity_type` | VARCHAR | customer / sales_order / supplier… |
| `entity_id` | UUID | Identifiant entité |
| `role` | VARCHAR | primary / attachment / evidence |
| UNIQUE | (`document_id`, `entity_type`, `entity_id`) | Unicité |

---

### `contracts`

Contrats cadres.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `organization_id` | FK | Organisation |
| `contract_number` | VARCHAR | N° contrat |
| `customer_id` | FK → customers NULL | Client |
| `supplier_id` | FK → suppliers NULL | Fournisseur |
| `title` | VARCHAR | Titre |
| `start_date` / `end_date` | DATE | Période |
| `status` | ENUM | draft / active / expired / terminated |
| `document_id` | FK → documents NULL | PDF signé |
| `total_value` | DECIMAL | Valeur |
| `currency_id` | FK → currencies | Devise |

---

### `contract_items`

Détails des contrats (produits, services, prix).

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `contract_id` | FK → contracts | Contrat |
| `product_id` / `service_id` | FK NULL | Article |
| `description` | TEXT | Description |
| `quantity` | DECIMAL | Quantité / volume |
| `unit_price` | DECIMAL | Prix négocié |
| `notes` | TEXT | Remarques |

## Notes

- `document_links` évite de dupliquer des FK document sur chaque table métier.
- Les tables `*_documents` spécifiques (fournisseurs, commandes…) peuvent coexister comme raccourcis métier.
