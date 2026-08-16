# Module 13 — Projets, Installation et Déploiement

Projets techniques, installations, tâches et mise en service.

## Tables

### `projects`

Projets techniques (ex. : Déploiement réseau Université X).

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `organization_id` | FK | Organisation |
| `project_number` | VARCHAR | N° projet |
| `name` | VARCHAR | Nom |
| `customer_id` | FK → customers | Client |
| `sales_order_id` | FK → sales_orders NULL | Commande liée |
| `manager_user_id` | FK → users | Chef de projet |
| `start_date` / `end_date` | DATE | Planning |
| `status` | ENUM | planned / in_progress / on_hold / completed / cancelled |
| `site_address` | TEXT | Site d'intervention |
| `description` | TEXT | Description |

---

### `project_items`

Produits / services inclus dans le projet.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `project_id` | FK → projects | Projet |
| `product_id` | FK → products NULL | Produit |
| `service_id` | FK → services NULL | Service |
| `quantity` | DECIMAL | Quantité |
| `description` | TEXT | Détail |

---

### `installations`

Installations réalisées.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `project_id` | FK → projects | Projet |
| `name` | VARCHAR | Libellé installation |
| `site_location` | TEXT | Emplacement précis |
| `scheduled_at` | TIMESTAMP | Planifiée |
| `completed_at` | TIMESTAMP | Terminée |
| `status` | ENUM | planned / ongoing / completed / failed |
| `lead_technician_id` | FK → technicians | Responsable technique |

---

### `installation_items`

Équipements installés (liés à des numéros de série).

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `installation_id` | FK → installations | Installation |
| `product_id` | FK → products | Produit |
| `serial_number_id` | FK → serial_numbers NULL | N° de série |
| `quantity` | DECIMAL | Quantité (si non sérialisé) |
| `installed_at` | TIMESTAMP | Date installation |
| `notes` | TEXT | Remarques |

---

### `installation_tasks`

Tâches techniques à réaliser.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `installation_id` | FK → installations | Installation |
| `title` | VARCHAR | Titre |
| `description` | TEXT | Description |
| `technician_id` | FK → technicians NULL | Assigné |
| `status` | ENUM | todo / in_progress / done / blocked |
| `due_at` | TIMESTAMP | Échéance |
| `completed_at` | TIMESTAMP | Fin |

---

### `technicians`

Techniciens affectés aux tâches.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `organization_id` | FK | Organisation |
| `user_id` | FK → users NULL | Compte système lié |
| `first_name` / `last_name` | VARCHAR | Nom |
| `phone` / `email` | VARCHAR | Contact |
| `skills` | JSONB / TEXT | Compétences |
| `is_active` | BOOLEAN | Actif |

---

### `installation_reports`

Rapports d'installation (photos, commentaires).

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `installation_id` | FK → installations | Installation |
| `author_id` | FK → users / technicians | Auteur |
| `summary` | TEXT | Résumé |
| `findings` | TEXT | Constatations |
| `document_ids` | JSONB | Photos / pièces jointes |
| `reported_at` | TIMESTAMP | Date |

---

### `commissioning_tests`

Tests et mise en service (checklist, résultats).

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `installation_id` | FK → installations | Installation |
| `test_name` | VARCHAR | Nom du test |
| `checklist` | JSONB | Checklist |
| `result` | ENUM | pass / fail / partial |
| `performed_by` | FK → technicians | Exécutant |
| `performed_at` | TIMESTAMP | Date |
| `notes` | TEXT | Observations |

## Notes

- Passage de `serial_numbers.status` à `installed` lors de la validation des `installation_items`.
- Un projet peut démarrer une couverture `warranties` / `maintenance_contracts`.
