# Module 17 — Communication et Tâches

Activités, rendez-vous, tâches internes, notifications et commentaires.

## Tables

### `activities`

Activités commerciales (vue transverse ; peut chevaucher `sales_activities`).

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `organization_id` | FK | Organisation |
| `activity_type_id` | FK → activity_types NULL | Type |
| `subject` | VARCHAR | Objet |
| `description` | TEXT | Détail |
| `entity_type` / `entity_id` | VARCHAR / UUID | Entité liée |
| `owner_user_id` | FK → users | Responsable |
| `due_at` | TIMESTAMP | Échéance |
| `completed_at` | TIMESTAMP | Fin |
| `status` | ENUM | planned / done / cancelled |

> **Note conception :** si une seule table d'activités suffit, fusionner avec `sales_activities` du module CRM.

---

### `appointments`

Rendez-vous (physiques ou en ligne).

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `organization_id` | FK | Organisation |
| `title` | VARCHAR | Titre |
| `description` | TEXT | Description |
| `start_at` / `end_at` | TIMESTAMP | Créneau |
| `location` | VARCHAR | Lieu / URL meeting |
| `meeting_type` | ENUM | in_person / online / phone |
| `organizer_id` | FK → users | Organisateur |
| `customer_id` | FK → customers NULL | Client |
| `status` | ENUM | scheduled / completed / cancelled / no_show |

---

### `tasks`

Tâches internes (à faire).

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `organization_id` | FK | Organisation |
| `title` | VARCHAR | Titre |
| `description` | TEXT | Description |
| `assignee_id` | FK → users | Assigné |
| `created_by` | FK → users | Créateur |
| `priority` | ENUM | low / medium / high |
| `status` | ENUM | todo / in_progress / done / cancelled |
| `due_at` | TIMESTAMP | Échéance |
| `entity_type` / `entity_id` | VARCHAR / UUID | Contexte métier |
| `completed_at` | TIMESTAMP | Fin |

---

### `notifications`

Notifications système (email, in-app).

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `organization_id` | FK | Organisation |
| `user_id` | FK → users | Destinataire |
| `channel` | ENUM | in_app / email / sms |
| `title` | VARCHAR | Titre |
| `body` | TEXT | Contenu |
| `entity_type` / `entity_id` | VARCHAR / UUID | Lien métier |
| `is_read` | BOOLEAN | Lu |
| `sent_at` | TIMESTAMP | Envoi |
| `read_at` | TIMESTAMP | Lecture |

---

### `comments`

Commentaires sur n'importe quelle entité (commande, ticket, etc.).

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `organization_id` | FK | Organisation |
| `entity_type` | VARCHAR | Type entité |
| `entity_id` | UUID | Identifiant |
| `author_id` | FK → users | Auteur |
| `body` | TEXT | Contenu |
| `parent_comment_id` | FK → comments NULL | Réponse |
| `created_at` / `updated_at` | TIMESTAMP | Audit |

## Notes

- Les champs polymorphes (`entity_type`, `entity_id`) permettent un fil de discussion et des notifs sur tout objet métier.
- Index recommandé : (`entity_type`, `entity_id`, `created_at`).
