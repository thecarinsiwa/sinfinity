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

## Convention CRUD (pages plein écran)

Create / edit ne passent **plus** par des modales (sauf confirms d’archivage). Pattern cible documenté dans [`docs/ROADMAP.md`](./docs/ROADMAP.md) :

| Opération | Route |
|-----------|-------|
| Liste | `/domaine/ressource` |
| Créer | `/domaine/ressource/nouveau` |
| Éditer | `/domaine/ressource/[id]/edit` |

Exemple : `/parametres/pays`, `/parametres/pays/nouveau`, `/parametres/pays/[id]/edit`.  
Exception : fiche organisation singleton `/organisation`. Lecture seule (audit, explorer docs) : drawers OK.

## Accueil (dashboard)

La route `/` affiche un **tableau de bord** en lectures API uniquement (baseline livrée — polish UX / i18n ci-dessous) :

| Indicateur | Source |
|------------|--------|
| Utilisateurs actifs | `GET /users?page=1&pageSize=1&isActive=true` → `meta.total` |
| Agences actives | `GET /branches?page=1&pageSize=1&isActive=true` → `meta.total` |
| Dernière connexion | session (`/auth/me` → `lastLoginAt`) |
| Santé Nest | `GET /health` (sans auth) |

Raccourcis : Organisation, Utilisateurs, Paramètres, Audit (+ Agences, Rôles, Santé). Aucun endpoint d’agrégation dédié.

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

## Seeds settings (dev only)

Sur [Paramètres](http://localhost:3001/parametres), un bandeau **Seeds settings
(dev)** propose « Charger les seeds settings » si :

- `NODE_ENV=development` (le bandeau est masqué en production)
- l’utilisateur a `settings.write`

L’action appelle `POST /api/v1/settings/seed` (upsert idempotent : devises,
pays, villes, unités, Incoterms, conditions de paiement, taxes). L’API refuse
l’appel hors `NODE_ENV=development`.

Équivalent CLI :

```bash
pnpm --filter @sinfinity/api seed:settings
```

Voir aussi [`apps/api/docs/database.md`](../api/docs/database.md) et
[`database/sql/seeds/02_settings.sql`](../../database/sql/seeds/02_settings.sql).

## Santé API

[http://localhost:3001/system/health](http://localhost:3001/system/health) appelle
`GET /health` via le client HTTP Admin (utile pour valider CORS et la connectivité).

## Gouvernance

Menu latéral **Gouvernance** (filtrée par permissions) :

| Route Admin | Permission | API Nest | Rôle |
|-------------|------------|----------|------|
| [`/systeme`](http://localhost:3001/systeme) | `system_settings.read` / `.write` | `GET/PUT /system-settings`, `GET/PUT /system-settings/:key` | Éditeur clé / JSON (parse client avant PUT). Lien vers santé API. |
| [`/audit`](http://localhost:3001/audit) | `audit.read` | `GET /audit-logs` | Table paginée + filtres ; tiroir détail `oldValues` / `newValues` (lecture seule, pas de delete). |
| [`/audit/connexions`](http://localhost:3001/audit/connexions) | `audit.read` | `GET /login-logs` | Tentatives de connexion (succès/échec, IP, user-agent). Filtres email / statut / dates. |

Les journaux d’audit et de connexion sont **append-only** côté API.

## Documents

Menu **Documents** (`documents.read`) — hub puis sous-routes :

| Route Admin | Permission | API Nest | Rôle |
|-------------|------------|----------|------|
| [`/documents`](http://localhost:3001/documents) | `documents.read` | — | Hub Types + Explorer. |
| [`/documents/types`](http://localhost:3001/documents/types) | `documents.read` / `.write` | `GET/POST/PATCH/DELETE /document-types` | CRUD configuration (code, nom, MIME). Cible : pages `/nouveau` + `/[id]/edit` (voir roadmap). Types système non supprimables ; édition système réservée super-admin. |
| [`/documents/explorer`](http://localhost:3001/documents/explorer) | `documents.read` | `GET /documents` | Liste support lecture seule. Filtres : type, statut, `entityType`, `entityId`, search. Pas d’upload / download. |

`GET /documents` accepte `entityType` / `entityId` (via `document_links` ; `entityId` exige `entityType`).

## Catalogue

Menu **Catalogue** (`catalog.read`) — hub puis sous-routes. Permissions écriture :
`catalog.write` (pas de code `products.write` côté API).

| Route Admin | Permission | API Nest | Rôle |
|-------------|------------|----------|------|
| [`/catalogue`](http://localhost:3001/catalogue) | `catalog.read` | — | Hub Marques / Catégories / Produits. |
| [`/catalogue/marques`](http://localhost:3001/catalogue/marques) | `catalog.read` / `.write` | `GET/POST/PATCH/DELETE /product-brands` | CRUD marques (nom, logo URL, site). Soft-delete. Cible pages `/nouveau` + `/[id]/edit`. |
| [`/catalogue/categories`](http://localhost:3001/catalogue/categories) | `catalog.read` / `.write` | `/product-categories` (+ `GET …/tree`) | Catégories produits (arbre `parentId`) — **stub** ; livraison roadmap phase 5 en pages. |
| [`/catalogue/categories-services`](http://localhost:3001/catalogue/categories-services) | `catalog.read` / `.write` | `/service-categories` | Catégories services (liste plate) — **stub** ; idem phase 5. |
| [`/catalogue/produits`](http://localhost:3001/catalogue/produits) | `catalog.read` / `.write` | `GET/POST/PATCH/DELETE /products` | CRUD **allégé** : SKU, nom, marque, catégorie, unité (`GET /product-units`), `isActive`. Soft-delete. |

### Frontière Admin vs Web

| Admin | Web |
|-------|-----|
| Bootstrap référentiel (marques, catégories, produit minimal) | Fiche produit opérationnelle complète |
| SKU / nom / brand / category / unit / actif | Specs techniques, images avancées, pricing riche, sous-catégories / modèles |
| Sélection d’unités en lecture seule | Usage métier catalogue (commandes, stock, etc.) |

L’Admin ne remplace pas le module Catalogue Web : il débloque un catalogue vide et maintient les référentiels.

## Tableau de bord, UX & i18n (baseline)

Livré. Suite du chantier (pages CRUD, design, users/rôles) : [`docs/ROADMAP.md`](./docs/ROADMAP.md) phases 1–7.

| Volet | Contenu |
|-------|---------|
| **Accueil** | Dashboard `/` — compteurs, raccourcis, santé API (voir [Accueil](#accueil-dashboard)) |
| **Erreurs** | `not-found`, `error`, `/forbidden` — chrome partagé `ErrorPageShell` |
| **UX listes** | EmptyState, confirms d’archivage, focus Modal/Drawer, labels filtres |
| **i18n** | `next-intl` sans préfixe d’URL, cookie, sélecteur, messages fr/en/es |

### Pages d’erreur

| Route / fichier | Code | Actions |
|-----------------|------|---------|
| `src/app/not-found.tsx` | 404 | Tableau de bord, Connexion |
| `src/app/error.tsx` | erreur client | Réessayer, Tableau de bord, Connexion |
| `/forbidden` | 403 | Déconnexion, Tableau de bord, Santé API |

Layout commun : `src/components/layout/error-page-shell.tsx` (EmptyState + code). Textes via clés `errors.*`.

### UX listes

Polish transversal (sans nouvelle feature métier) :

- **EmptyState** sur chaque liste vide — copy unifiée (« Créez… ou ajustez les filtres / la recherche »)
- **Confirmations** d’archivage via `Modal` (jamais `window.confirm`) ; soft-delete en langage utilisateur ; suppression définitive des types de documents inchangée
- **Focus** Modal / Drawer (`useDialogA11y`) : focus initial, piège Tab, restauration à la fermeture, Escape ; backdrop hors tabulation
- Bouton **Filtrer** hors du `<label>` (évite le focus parasite sur le champ)

### i18n (fr / en / es)

Lib : **`next-intl`** (App Router Next 16). **Pas de préfixe de locale dans l’URL** — les routes métier restent `/parametres`, `/organisation`, etc. La locale est lue depuis un cookie.

| Élément | Détail |
|---------|--------|
| Locales | `fr` (défaut), `en`, `es` — `src/i18n/config.ts` |
| Cookie | `sinfinity_locale` (1 an, `SameSite=Lax`) — écrit par `setLocaleAction` |
| Messages | `apps/admin/messages/{fr,en,es}.json` |
| Request config | `src/i18n/request.ts` + plugin `next-intl` dans `next.config.ts` |
| Typage | `src/i18n/global.d.ts` (messages FR comme source de vérité TypeScript) |
| `<html lang>` | `getLocale()` dans `src/app/layout.tsx` |
| Provider | `NextIntlClientProvider` dans le layout racine |
| Sélecteur | `LocaleSwitcher` — topbar (session) + page login |

#### Namespaces messages

| Namespace | Périmètre |
|-----------|-----------|
| `common`, `pagination` | Actions partagées, statuts, chargement, pagination |
| `nav`, `topbar`, `loginPage`, `metadata` | Shell, login, titres app |
| `errors`, `stubs`, `dashboard` | Erreurs, stubs, accueil |
| `settings.*` | Hub / seed / pays…incoterms |
| `organisation.*` | Fiche org + agences |
| `catalogue.*` | Hub, marques, produits, stubs catégories |
| `documents.*` | Hub, types, explorer, statuts, entity types |
| `audit.*` | Journaux + connexions |
| `systeme.*`, `health.*` | System settings + page santé |
| `locale` | Libellés du sélecteur de langue |

#### Usage dans le code

```tsx
// Client
const t = useTranslations("settings.countries");
const tc = useTranslations("common");

// Serveur (page / metadata)
const t = await getTranslations("settings.countries");
```

Changer de langue : `setLocaleAction(locale)` puis `router.refresh()` (déjà dans `LocaleSwitcher`).

Régénération optionnelle du chrome messages (script de bootstrap) :

```bash
node apps/admin/scripts/build-chrome-messages.mjs
```

Préférer éditer directement `messages/*.json` pour les ajouts courants, en gardant les **mêmes clés** dans fr, en et es.

#### Hors scope i18n

- Données métier API (noms d’organisation, codes ISO, libellés stockés en base)
- Messages d’erreur bruts renvoyés par Nest (`ApiError.message`)
- Showcase `/dev/ui` (dev only)

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

- Roadmap Admin (baseline + phases pages CRUD / design) : [`docs/ROADMAP.md`](./docs/ROADMAP.md)
- API / Swagger : [http://localhost:4000/docs](http://localhost:4000/docs) (quand l’API tourne)
- Conventions Next de cette app : [`AGENTS.md`](./AGENTS.md)
