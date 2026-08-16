# Module 1 — Organisation et Sécurité

Modules transversaux : multi-tenant, utilisateurs, rôles, audit et paramètres système.

## Tables

### `organizations`

Entreprise / organisation propriétaire du système (tenant racine).

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `name` | VARCHAR | Raison sociale |
| `legal_name` | VARCHAR | Nom légal |
| `tax_id` | VARCHAR | NIF / numéro fiscal |
| `email` | VARCHAR | Email principal |
| `phone` | VARCHAR | Téléphone |
| `website` | VARCHAR | Site web |
| `logo_url` | VARCHAR | Logo |
| `default_currency_id` | FK → currencies | Devise par défaut |
| `country_id` | FK → countries | Pays |
| `is_active` | BOOLEAN | Actif |
| `created_at` / `updated_at` | TIMESTAMP | Audit |

**Relations :** 1 → N `branches`, `users`, `system_settings`

---

### `branches`

Agences, bureaux ou points de stockage rattachés à une organisation.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `organization_id` | FK | Organisation |
| `code` | VARCHAR | Code agence |
| `name` | VARCHAR | Nom |
| `type` | ENUM | office / warehouse / mixed |
| `address` | TEXT | Adresse |
| `city_id` | FK → cities | Ville |
| `phone` | VARCHAR | Téléphone |
| `manager_user_id` | FK → users | Responsable |
| `is_active` | BOOLEAN | Actif |

---

### `users`

Utilisateurs du système.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `organization_id` | FK | Organisation |
| `branch_id` | FK → branches | Agence par défaut |
| `email` | VARCHAR UNIQUE | Email de connexion |
| `password_hash` | VARCHAR | Mot de passe hashé |
| `first_name` | VARCHAR | Prénom |
| `last_name` | VARCHAR | Nom |
| `phone` | VARCHAR | Téléphone |
| `avatar_url` | VARCHAR | Avatar |
| `is_active` | BOOLEAN | Compte actif |
| `last_login_at` | TIMESTAMP | Dernière connexion |
| `email_verified_at` | TIMESTAMP | Email vérifié |

---

### `roles`

Rôles métier : Admin, Commercial, Procurement, Logistique, Technique, Finance.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `organization_id` | FK NULL | NULL = rôle système global |
| `code` | VARCHAR | Code (ADMIN, SALES…) |
| `name` | VARCHAR | Libellé |
| `description` | TEXT | Description |
| `is_system` | BOOLEAN | Rôle non supprimable |

---

### `permissions`

Permissions système (CRUD / actions sur chaque module).

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `module` | VARCHAR | Module concerné |
| `action` | VARCHAR | create / read / update / delete / approve… |
| `code` | VARCHAR UNIQUE | Ex. : `quotations.approve` |
| `description` | TEXT | Description |

---

### `role_permissions`

Association rôles ↔ permissions.

| Colonne | Type | Description |
|---------|------|-------------|
| `role_id` | FK → roles | Rôle |
| `permission_id` | FK → permissions | Permission |
| PK | (`role_id`, `permission_id`) | Clé composite |

---

### `user_roles`

Association utilisateurs ↔ rôles.

| Colonne | Type | Description |
|---------|------|-------------|
| `user_id` | FK → users | Utilisateur |
| `role_id` | FK → roles | Rôle |
| `branch_id` | FK → branches NULL | Portée éventuelle par agence |
| `assigned_at` | TIMESTAMP | Date d'affectation |
| `assigned_by` | FK → users | Qui a affecté |

---

### `user_sessions`

Sessions actives / historique de sessions.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `user_id` | FK → users | Utilisateur |
| `token_hash` | VARCHAR | Hash du token |
| `ip_address` | VARCHAR | Adresse IP |
| `user_agent` | TEXT | Navigateur / appareil |
| `started_at` | TIMESTAMP | Début |
| `expires_at` | TIMESTAMP | Expiration |
| `revoked_at` | TIMESTAMP NULL | Révocation |

---

### `audit_logs`

Historique complet des actions (qui a fait quoi et quand).

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | BIGINT PK | Identifiant |
| `organization_id` | FK | Organisation |
| `user_id` | FK → users | Acteur |
| `action` | VARCHAR | create / update / delete / login… |
| `entity_type` | VARCHAR | Table / entité |
| `entity_id` | UUID | Identifiant entité |
| `old_values` | JSONB | Avant |
| `new_values` | JSONB | Après |
| `ip_address` | VARCHAR | IP |
| `created_at` | TIMESTAMP | Horodatage |

---

### `login_logs`

Suivi des connexions (IP, date, succès/échec).

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | BIGINT PK | Identifiant |
| `user_id` | FK NULL | Utilisateur (si connu) |
| `email_attempted` | VARCHAR | Email saisi |
| `success` | BOOLEAN | Succès / échec |
| `failure_reason` | VARCHAR | Motif d'échec |
| `ip_address` | VARCHAR | IP |
| `user_agent` | TEXT | Client |
| `created_at` | TIMESTAMP | Horodatage |

---

### `system_settings`

Paramètres généraux (nom société, devise par défaut, etc.).

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `organization_id` | FK | Organisation |
| `key` | VARCHAR | Clé paramètre |
| `value` | JSONB / TEXT | Valeur |
| `description` | TEXT | Description |
| UNIQUE | (`organization_id`, `key`) | Unicité |

## Notes de conception

- RBAC via `roles` → `permissions` ; un utilisateur peut avoir plusieurs rôles.
- `audit_logs` et `login_logs` sont append-only (pas de soft delete).
- Isolation stricte des données par `organization_id`.
