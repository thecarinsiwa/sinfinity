# Seeds SQL

| Fichier | Contenu |
|---------|---------|
| [`01_rbac.sql`](./01_rbac.sql) | Permissions Phase 2 + rôles système (ADMIN…) — bootstrap partiel |
| [`02_settings.sql`](./02_settings.sql) | Devises, pays, villes, unités, Incoterms, payment terms, TVA RDC |

**Recommandé :** seed Nest idempotent :

```bash
pnpm --filter @sinfinity/api seed:rbac
pnpm --filter @sinfinity/api seed:settings
pnpm --filter @sinfinity/api seed:dev   # org + agences + utilisateurs de test (dev/test only)
```

En développement, `POST /api/v1/settings/seed` (permission `settings.write`) relance le même upsert Settings.

Le SQL ci-dessus convient pour un bootstrap minimal. Relancer les commandes Nest après pour synchroniser catalogues et matrices de rôles.
