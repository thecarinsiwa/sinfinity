# Base de données — API Sinfinity

Comment pointer `DATABASE_URL` vers MySQL 8 local, et comment Drizzle **introspecte** le DDL sans jamais le remplacer.

## `DATABASE_URL`

Variable **obligatoire** au démarrage de `@sinfinity/api` (validation Zod). Le pool mysql2 est créé à partir de cette URL ; la connexion réelle n’a lieu qu’à la première requête.

Format :

```text
mysql://USER:PASSWORD@HOST:PORT/DATABASE
```

Exemple (voir [`.env.example`](../.env.example)) :

```text
DATABASE_URL=mysql://root:password@127.0.0.1:3306/sinfinity
```

| Partie | Valeur locale typique |
|--------|------------------------|
| User / mot de passe | Compte MySQL 8 local |
| Host | `127.0.0.1` (éviter `localhost` sous Windows si le socket n’est pas celui attendu) |
| Port | `3306` |
| Database | `sinfinity` (créée par le DDL) |

Mot de passe vide : `mysql://root@127.0.0.1:3306/sinfinity`. Caractères spéciaux dans le mot de passe : les encoder en URL (`@` → `%40`, `#` → `%23`, etc.).

```bash
# Depuis apps/api
cp .env.example .env
# Éditer DATABASE_URL, JWT_* , puis :
pnpm --filter @sinfinity/api dev
```

L’API écoute sur le port `4000` (`GET http://localhost:4000/api/v1`).

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

## Seeds RBAC

Permissions + rôles système :

```bash
pnpm --filter @sinfinity/api seed:rbac
```

SQL bootstrap minimal (optionnel) : [`database/sql/seeds/01_rbac.sql`](../../../database/sql/seeds/01_rbac.sql).

## Workflow après un changement de schéma

Toujours dans cet ordre — **jamais l’inverse** :

1. Modifier le DDL (`sinfinity_schema.sql`) **et**, si la base existe déjà, ajouter `database/sql/migrations/NNN_….sql`.
2. Appliquer le SQL (`mysql … < …`).
3. Régénérer le mapping TS :

```bash
pnpm --filter @sinfinity/api db:introspect
```

La commande charge `DATABASE_URL` (fichier `.env` dans `apps/api` ou variable d’environnement), écrit `schema.ts` / `relations.ts`, puis **supprime** le dump SQL et le journal `meta/` que drizzle-kit ajoute — pour ne pas créer une seconde source de vérité.

## Interdit

- Prisma (`schema.prisma`, migrations Prisma)
- `drizzle-kit generate`
- `drizzle-kit push`
- `drizzle-kit migrate`
- Éditer `schema.ts` / `relations.ts` comme si c’était le modèle métier
- Committer un `.sql` généré sous `apps/api/src/database/schema/`
