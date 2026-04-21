# Copilot instructions – Kudo app (Slack)

## Résumé du projet
- Application de reconnaissance/kudos pour Slack, inspirée de HeyTaco.
- Les utilisateurs donnent des kudos à leurs collègues en mentionnant `@user` avec un emoji "monnaie" (⚡ par défaut, mais configurable).
- L’app stocke les kudos, applique un quota quotidien, affiche un leaderboard et une vue perso des kudos reçus/donnés.
- Stack : backend en Go, frontend en TypeScript/React + Tailwind CSS, intégration Slack (events + slash commands).

## Tech stack & structure
- Backend :
  - Langage : Go.
  - Rôle : API HTTP + gestion des webhooks / events Slack.
  - Responsabilités : authentification Slack OAuth, parsing des messages, application des quotas, CRUD kudos, endpoints pour le frontend.
  - Tests : utiliser `testing` standard et éventuellement `httptest` pour les handlers.
- Frontend :
  - Langage : TypeScript + React.
  - Styling : Tailwind CSS.
  - Rôle : dashboard web (Home, Leaderboard, Settings).
  - Tests : privilégier Testing Library + Vitest/Jest si configuré.
- Slack :
  - Utiliser les conventions officielles (events API, slash commands, app manifest).
  - Respecter les scopes minimaux nécessaires (lecture messages, chat:write, user info).

## Guidelines de code
- Go :
  - Préférer un code simple, lisible, avec des fonctions courtes.
  - Gérer les erreurs explicitement, pas de panics dans le code métier.
  - Structurer le code par domaine (ex: `slack/`, `kudos/`, `workspace/`) plutôt que par couches techniques seulement.
- React/TS :
  - Composants fonctionnels, hooks uniquement.
  - Typage strict en TypeScript (éviter `any`).
  - Extraire les composants réutilisables (cards, tables, layout).
  - Utiliser Tailwind de façon utilitaire (pas de CSS custom si inutile).
- Tests :
  - Pour chaque nouvelle feature significative côté Go, ajouter au minimum des tests de handler et de logique métier.
  - Pour le frontend, au moins un test de rendu pour les pages clés (Home, Leaderboard).

## Construction & exécution
- Backend :
  - Build : `go build ./...`
  - Tests : `go test ./...`
  - Lancer l’API : `go run ./cmd/api` (ou adapter selon la structure du repo).
- Frontend :
  - Install : `pnpm install` (ou `npm install` / `yarn install` selon le projet).
  - Dev : `pnpm dev`
  - Build : `pnpm build`
  - Tests : `pnpm test`

Toujours :
- S’assurer que `go test ./...` et les tests frontend passent avant de proposer des changements.
- S’assurer que les commandes existantes dans le repo (scripts npm, Makefile, etc.) continuent de fonctionner.

## Layout projet (à adapter une fois le squelette créé)
- `/backend` : code Go (API + intégration Slack).
- `/frontend` : app React + Tailwind.
- `/deploy` : fichiers infra/CI/CD si présents.
- `/docs` : documentation additionnelle.

## Style des features
- Quand on implémente une nouvelle user story :
  - Respecter le vocabulaire : “kudo(s)”, “monnaie”, “quotas”, “leaderboard”.
  - Préserver les invariants métier : un kudo ne peut pas être donné à soi-même, respect du quota quotidien.
  - Préférer une implémentation simple qui fonctionne bien plutôt qu’une abstraction prématurée.

## Ce que Copilot doit faire
- Pour du nouveau code :
  - Proposer des handlers Go complets avec tests de base.
  - Générer des composants React avec types explicites et classes Tailwind raisonnables.
- Pour des refactors :
  - Garder la logique métier équivalente.
  - Ne pas introduire de dépendances externes sans nécessité.

## Ce que Copilot doit éviter
- Ne pas inventer des services externes ou des modules qui n’existent pas dans le repo.
- Ne pas changer la stack (pas de migration vers un autre framework sans demande explicite).
- Ne pas ajouter de fonctionnalités non demandées (pas de système de rewards boutique tant que non prévu).
