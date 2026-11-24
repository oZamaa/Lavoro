# JobTrack

Suivi de candidatures en tableau Kanban. 100 % gratuit, open source, dockerisé. Toutes les
données restent sur ta machine (un fichier SQLite).

## Fonctionnalités

- Tableau Kanban avec glisser-déposer (souris, clavier, écran tactile) et colonnes par défaut :
  A postuler · Deja postule · Entretien · Offre · Refuse · Archive
- Création, édition et suppression (avec confirmation) dans un panneau latéral, avec historique
  des changements de colonne
- Recherche, filtres (ville, contrat, source), tri, compteurs par colonne
- Rappels de relance : pastille « À relancer » dès que la date de relance est atteinte
- Page de statistiques (par statut, par semaine, prochaines relances)
- Thème clair / sombre (suit le réglage du système au premier lancement, puis mémorisé)
- Export / import CSV et JSON (« Sauvegarde »)

## Démarrage rapide (production)

Prérequis : [Docker Desktop](https://www.docker.com/products/docker-desktop/) lancé.

```powershell
Copy-Item .env.example .env
docker compose up -d --build
```

Puis ouvre <http://localhost:3000>.

Commandes utiles :

```powershell
docker compose logs -f app     # journaux
docker compose down            # arrêt (les données sont conservées)
docker compose ps              # état, y compris le healthcheck
```

Sous macOS / Linux : `cp .env.example .env` à la place de `Copy-Item`.

## Développement

Rechargement à chaud dans Docker (Node 20, aucune installation globale nécessaire) :

```powershell
docker compose -f docker-compose.dev.yml up
```

Avec Node 20+ installé en local :

```powershell
npm install
npm run dev          # http://localhost:3000
npm run lint         # ESLint
npm run typecheck    # TypeScript strict
npm run format       # Prettier
npm test             # Vitest
```

Pour lancer les tests dans Docker, une fois les dépendances installées par un premier `docker compose -f docker-compose.dev.yml up` : `docker compose -f docker-compose.dev.yml run --rm app npm test`.

### Base de données et migrations

SQLite (via better-sqlite3) avec Drizzle ORM. Les migrations sont appliquées automatiquement au
démarrage de l'appli, et les colonnes par défaut sont créées si la base est vide.

Après une modification de `src/db/schema.ts` :

```powershell
npm run db:generate   # crée une migration SQL dans src/db/migrations
```

## Tes données

- Fichier : `./data/jobtrack.db` (monté dans le conteneur sur `/app/data`).
- La base utilise le mode WAL : pour copier le fichier à la main, arrête d'abord l'appli ou copie
  aussi `jobtrack.db-wal` et `jobtrack.db-shm`.
- Le plus simple : bouton **Sauvegarde** dans l'appli.
  - JSON : tout (colonnes, historique, dates). Idéal pour restaurer.
  - CSV : s'ouvre dans Excel / LibreOffice. Colonnes : `column, company, title, city, url, source,
contract, remote, salary, appliedAt, followUpAt, contactName, contactEmail, notes`
    (`company` et `title` obligatoires, dates au format AAAA-MM-JJ, `remote` = yes / no / hybrid).
  - Import « Ajouter » : ajoute aux candidatures existantes (pas de détection de doublons). L’import ne crée jamais de colonne : une colonne inconnue dans le fichier (faute de frappe…) le fait refuser avec un message précis (lignes concernées, suggestion).
    Import « Remplacer » : supprime d'abord toutes les candidatures. Un import est tout ou rien :
    une ligne invalide annule tout et indique la ligne en cause.

## API

| Route                                    | Rôle                                          |
| ---------------------------------------- | --------------------------------------------- |
| `GET/POST /api/applications`             | Lister / créer                                |
| `GET/PATCH/DELETE /api/applications/:id` | Lire (avec historique) / modifier / supprimer |
| `POST /api/applications/:id/move`        | Déplacer `{ columnId, position? }`            |
| `GET/POST /api/columns`                  | Lister / créer                                |
| `PATCH/DELETE /api/columns/:id`          | Renommer ou réordonner / supprimer (si vide)  |
| `GET /api/export?format=json\|csv`       | Télécharger une sauvegarde                    |
| `POST /api/import`                       | Importer `{ format, mode, content }`          |
| `GET /api/health`                        | Santé de l'appli et de la base                |

Toutes les entrées sont validées avec Zod ; les erreurs sont renvoyées en JSON (400, 404, 409).
Il n'y a pas d'authentification : n'expose pas le port 3000 sur Internet.

## Configuration

Variables dans `.env` (voir `.env.example`) :

| Variable        | Défaut                  | Rôle                   |
| --------------- | ----------------------- | ---------------------- |
| `PORT`          | `3000`                  | Port interne           |
| `DATABASE_PATH` | `/app/data/jobtrack.db` | Emplacement de la base |

## Stack

Next.js (App Router) · TypeScript strict · Tailwind CSS · Radix UI · dnd-kit · next-themes ·
Drizzle ORM + SQLite (better-sqlite3) · Zod · Vitest · ESLint + Prettier.
Toutes les dépendances sont open source (MIT / Apache-2.0 / ISC).

## Accessibilité

Navigation clavier complète (poignée « Déplacer » sur chaque carte : Espace ou Entrée pour
soulever, flèches pour déplacer, Échap pour annuler), annonces pour lecteurs d'écran en français,
focus visible, lien d'évitement, contraste AA dans les deux thèmes, `prefers-reduced-motion`
respecté.

## Pistes (v2)

Lecture de la boîte mail en IMAP (lecture seule, règles par mots-clés) pour créer et déplacer
automatiquement les cartes ; comptes utilisateurs.
