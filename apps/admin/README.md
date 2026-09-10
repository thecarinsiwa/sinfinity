# Sinfinity Admin

Console d’administration Next.js (`@sinfinity/admin`), port **3001**. Elle consomme l’API NestJS (`@sinfinity/api`, port **4000**).

## Prérequis

- Node.js ≥ 22
- pnpm ≥ 10
- API locale démarrée (pour les appels HTTP / health)

## Démarrage

Depuis la racine du monorepo :

```bash
pnpm install
pnpm --filter @sinfinity/admin dev
# ou
pnpm dev:admin
```

Ouvrir [http://localhost:3001](http://localhost:3001).

## Variables d’environnement

Copier l’exemple puis ajuster si besoin :

```bash
cp apps/admin/.env.example apps/admin/.env.local
```

| Variable | Description | Défaut (exemple) |
|----------|-------------|------------------|
| `NEXT_PUBLIC_API_URL` | Base URL de l’API (préfixe `/api/v1`) | `http://localhost:4000/api/v1` |

## Showcase UI (dev only)

En développement, les primitives `src/components/ui` sont visibles sur
[http://localhost:3001/dev/ui](http://localhost:3001/dev/ui).
La route renvoie 404 en production.

## Santé API

[http://localhost:3001/system/health](http://localhost:3001/system/health) appelle
`GET /health` via le client HTTP Admin (utile pour valider CORS et la connectivité).

## Auth BFF (cookies httpOnly)

Les tokens Nest ne sont **pas** exposés au JavaScript navigateur. Les route handlers
posant les cookies `sinfinity_access` / `sinfinity_refresh` :

| Route Admin | Rôle |
|-------------|------|
| `POST /api/auth/login` | `{ email, password }` → cookies |
| `POST /api/auth/logout` | révoque session Nest + clear cookies |
| `POST /api/auth/refresh` | rotation via cookie refresh |
| `GET /api/auth/session` | user + organisation (sans tokens) |
| `/api/backend/*` | proxy authentifié vers l’API Nest |

Le middleware redirige vers `/login` sans cookie de session. Les comptes sans
permission admin gate aboutissent sur `/forbidden`.

## Comptes de test (API locale)

Après `pnpm --filter @sinfinity/api seed:dev` :

| Email | Mot de passe | Rôle |
|-------|--------------|------|
| `admin@sinfinity.cd` | `local-dev-only-1` (ou `SEED_DEV_PASSWORD`) | ADMIN / super-admin |

Voir [`apps/api/docs/database.md`](../api/docs/database.md) pour la liste complète des rôles.

## Documentation

- Roadmap Admin : [`docs/ROADMAP.md`](./docs/ROADMAP.md)
- API / Swagger : [http://localhost:4000/docs](http://localhost:4000/docs) (quand l’API tourne)
- Conventions Next de cette app : [`AGENTS.md`](./AGENTS.md)
