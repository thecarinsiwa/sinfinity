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

## Documentation

- Roadmap Admin : [`docs/ROADMAP.md`](./docs/ROADMAP.md)
- API / Swagger : [http://localhost:4000/docs](http://localhost:4000/docs) (quand l’API tourne)
- Conventions Next de cette app : [`AGENTS.md`](./AGENTS.md)
