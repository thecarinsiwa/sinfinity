# @sinfinity/api

API REST NestJS de Sinfinity (port **4000**). Les clients Web, Admin et POS partagent ce backend.

## Démarrage

Depuis la racine du monorepo (`Node.js ≥ 22`, `pnpm ≥ 10`) :

```bash
pnpm install
cp apps/api/.env.example apps/api/.env   # renseigner DATABASE_URL et les secrets JWT
pnpm --filter @sinfinity/api dev
```

MySQL 8 local et `DATABASE_URL` : [docs/database.md](./docs/database.md).

## Swagger

Hors préfixe `/api/v1`.

| | URL |
|---|-----|
| UI interactive | http://localhost:4000/docs ou http://localhost:4000/api/docs |
| OpenAPI JSON | http://localhost:4000/docs-json ou http://localhost:4000/api/docs-json |

Le bouton **Authorize** accepte un JWT Bearer (`access-token`). Il n’est pas requis pour les routes publiques (`GET /api/v1/ping`, `GET /api/v1/health`).

Les modules métier (CRM, devis, stock, etc.) ne sont pas encore documentés ici.

## Scripts

```bash
pnpm --filter @sinfinity/api test
pnpm --filter @sinfinity/api test:e2e
pnpm --filter @sinfinity/api build
pnpm --filter @sinfinity/api db:introspect   # après un changement de DDL SQL
```
