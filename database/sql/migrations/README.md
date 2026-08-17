# Migrations SQL — Sinfinity

Évolutions de schéma **uniquement en SQL MySQL 8**. Drizzle, Prisma et tout générateur ORM n’écrivent **rien** dans ce dossier.

## Rôles des fichiers

| Fichier | Rôle |
|---------|------|
| [`../sinfinity_schema.sql`](../sinfinity_schema.sql) | **Baseline** (source de vérité). Install greenfield : base vide → ce script seul. |
| `NNN_description.sql` (ici) | **Incrémental**. Bases déjà créées à partir d’une baseline antérieure. |

Une migration ne remplace pas la baseline : **toute évolution se reflète aussi dans `sinfinity_schema.sql`**, pour qu’une install neuve et une base migrée convergent.

## Nommage

```text
001_add_customers_credit_limit.sql
002_idx_invoices_due_date.sql
```

- Préfixe numérique à 3 chiffres, croissant, sans trou volontaire.
- Suffixe `snake_case` court (verbe + objet).
- Un souci = un fichier (`ALTER`, index, nouvelle table, etc.).
- Extension `.sql` uniquement. Pas de TypeScript, pas de dump Drizzle.

## Règles

1. SQL MySQL 8 uniquement (`utf8mb4` / `utf8mb4_unicode_ci`, InnoDB).
2. Respecter [`../../conventions.md`](../../conventions.md) (UUID `CHAR(36)`, `DECIMAL`, pas de `FLOAT` pour l’argent, `organization_id`, soft delete).
3. Scripts **additifs et relisables** : `ADD COLUMN` / `CREATE TABLE IF NOT EXISTS` / index nommés (`idx_…`, `uq_…`, `fk_…`). Éviter les `DROP` destructifs sauf migration dédiée, documentée.
4. Vérifier l’ordre des FK avant d’appliquer.
5. **Interdit** : `drizzle-kit generate`, `drizzle-kit push`, `drizzle-kit migrate`, Prisma, tout fichier généré dans `apps/api/src/database/schema/*.sql`.
6. Après application : régénérer le mapping TS avec `pnpm --filter @sinfinity/api db:introspect` (introspection seulement, le DDL ne change pas).

## Application (base existante)

Depuis la racine du dépôt, dans l’ordre numérique :

```bash
mysql -u root -p sinfinity < database/sql/migrations/001_exemple.sql
```

Install neuve (pas de migrations à rejouer) :

```bash
mysql -u root -p < database/sql/sinfinity_schema.sql
```

Le client MySQL 8 local est requis (pas de Docker dans ce projet).
