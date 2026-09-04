# Seeds SQL

| Fichier | Contenu |
|---------|---------|
| [`01_rbac.sql`](./01_rbac.sql) | Permissions Phase 2 + rôles système (ADMIN…) — bootstrap partiel |

**Recommandé :** seed Nest idempotent (catalogue complet + mapping par rôle) :

```bash
pnpm --filter @sinfinity/api seed:rbac
```

Le SQL ci-dessus convient pour un bootstrap minimal (permissions cœur + rôles + ADMIN = toutes les perms déjà en base). Relancer `seed:rbac` après pour synchroniser le catalogue ROADMAP et les matrices SALES / PROCUREMENT / etc.
