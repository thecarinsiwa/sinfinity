# Base de données — API Sinfinity

Comment pointer MySQL 8 local via variables discrètes (ou `DATABASE_URL` legacy), et comment Drizzle **introspecte** le DDL sans jamais le remplacer.

## Variables MySQL (préféré)

```text
DATABASE_HOST=127.0.0.1
DATABASE_PORT=3306
DATABASE_USER=root
DATABASE_PASSWORD=
DATABASE_NAME=sinfinity
```

Exemple : [`.env.example`](../.env.example). Le pool mysql2 utilise ces champs directement (mot de passe vide supporté). Une `DATABASE_URL` est dérivée automatiquement pour drizzle-kit.

| Partie | Valeur locale typique |
|--------|------------------------|
| Host | `127.0.0.1` (éviter `localhost` sous Windows si le socket n’est pas celui attendu) |
| Port | `3306` |
| User / mot de passe | Compte MySQL 8 local (`DATABASE_PASSWORD=` si root sans mot de passe) |
| Database | `sinfinity` (créée par le DDL) |

### Legacy `DATABASE_URL`

Toujours accepté si les `DATABASE_*` ne sont pas renseignés :

```text
DATABASE_URL=mysql://USER:PASSWORD@HOST:PORT/DATABASE
```

Mot de passe vide : `mysql://root@127.0.0.1:3306/sinfinity`. Caractères spéciaux : encoder en URL (`@` → `%40`, `#` → `%23`).

```bash
# Depuis apps/api
cp .env.example .env
# Éditer DATABASE_* , JWT_* , puis :
pnpm --filter @sinfinity/api dev
```

L’API écoute sur le port `4000` (`GET http://localhost:4000/api/v1`). Alias acceptés : `API_PORT` → `PORT`, `CORS_ORIGIN` → `CORS_ORIGINS`, `JWT_*_EXPIRES_IN` → `JWT_*_TTL`.

## Source de vérité vs mapping TypeScript

```text
database/sql/sinfinity_schema.sql     ← DDL (baseline, on écrit ici)
database/sql/migrations/*.sql         ← ALTER incrémentaux (SQL only)
        │
        │  mysql client (appliquer)
        ▼
     MySQL 8  (base sinfinity)
        │
        │  pnpm db:introspect
        ▼
apps/api/src/database/schema/*.ts     ← mapping Drizzle (on ne conçoit pas ici)
```

| Artefact | Rôle | On y écrit ? |
|----------|------|----------------|
| [`database/sql/sinfinity_schema.sql`](../../../database/sql/sinfinity_schema.sql) | Baseline DDL | Oui (install neuve + miroir de chaque évolution) |
| [`database/sql/migrations/`](../../../database/sql/migrations/) | Migrations pour bases déjà créées | Oui, SQL uniquement |
| [`src/database/schema/`](../src/database/schema/) | Types / tables Drizzle | Non à la main — régénéré par introspect |

Drizzle (mysql2) **lit** le schéma MySQL. Il ne le possède pas.

## Install locale (greenfield)

MySQL 8+ local, **sans Docker**. Depuis la racine du dépôt :

```bash
mysql -u root -p < database/sql/sinfinity_schema.sql
```

Cela crée la base `sinfinity` et les tables. Détail des règles : [`database/conventions.md`](../../../database/conventions.md). Migrations : [`database/sql/migrations/README.md`](../../../database/sql/migrations/README.md).

## Vérifier / synchroniser (`pnpm db:sync`)

Depuis la racine du monorepo (ou `apps/api`) :

```bash
pnpm db:sync              # rapport : serveur, base, tables vs baseline, migrations
pnpm db:sync -- --apply   # crée la DB si absente ; charge le baseline si base vide ;
                          # applique les migrations NNN_*.sql en attente
pnpm db:sync -- --json    # même rapport en JSON
```

Le script lit `apps/api/.env` (`DATABASE_*`). Il compare les `CREATE TABLE` de [`sinfinity_schema.sql`](../../../database/sql/sinfinity_schema.sql) à `INFORMATION_SCHEMA`, liste les fichiers `database/sql/migrations/NNN_*.sql`, et suit les migrations appliquées dans la table `schema_migrations` (créée au `--apply`).

Une base **partielle** (tables manquantes mais non vide) n’est **pas** auto-réparée : il faut une migration SQL incrémentale.

## Seeds RBAC

Permissions + rôles système :

```bash
pnpm --filter @sinfinity/api seed:rbac
pnpm --filter @sinfinity/api seed:settings
```

Référentiels (USD/CDF/CNY/EUR, pays CD/CN/AE/FR/BE, unités, Incoterms, TVA RDC) : aussi `database/sql/seeds/02_settings.sql`, ou `POST /api/v1/settings/seed` en `NODE_ENV=development`.

SQL bootstrap minimal (optionnel) : [`database/sql/seeds/01_rbac.sql`](../../../database/sql/seeds/01_rbac.sql).

## Seeds document types

Types système (`QUOTE`, `INVOICE`, `BL`, `CONTRACT`, …) :

```bash
pnpm --filter @sinfinity/api seed:document-types
```

## Stockage fichiers

Par défaut disque local (`STORAGE_DRIVER=local`, `STORAGE_LOCAL_ROOT=./storage/uploads`).
Le dossier `storage/` est gitignored. Interface `StorageService` prête pour un driver S3 ultérieur.

## Document links

`POST/DELETE /document-links` + `GET /document-links?entityType&entityId`.
`entity_type` et `role` sont validés contre une allowlist (`document-links.catalog.ts`).

## Contracts

`CRUD /contracts` + `/contracts/:id/items`. Statuts `draft|active|expired|terminated`.
`contract_number` unique par org. Permissions `contracts.read` / `contracts.write`.

## Workflow après un changement de schéma

Toujours dans cet ordre — **jamais l’inverse** :

1. Modifier le DDL (`sinfinity_schema.sql`) **et**, si la base existe déjà, ajouter `database/sql/migrations/NNN_….sql`.
2. Appliquer le SQL (`mysql … < …`).
3. Régénérer le mapping TS :

```bash
pnpm --filter @sinfinity/api db:introspect
```

La commande charge `DATABASE_*` (ou `DATABASE_URL`) depuis `.env` dans `apps/api`, écrit `schema.ts` / `relations.ts`, puis **supprime** le dump SQL et le journal `meta/` que drizzle-kit ajoute — pour ne pas créer une seconde source de vérité.

## Interdit

- Prisma (`schema.prisma`, migrations Prisma)
- `drizzle-kit generate`
- `drizzle-kit push`
- `drizzle-kit migrate`
- Éditer `schema.ts` / `relations.ts` comme si c’était le modèle métier
- Committer un `.sql` généré sous `apps/api/src/database/schema/`
