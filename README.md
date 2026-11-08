# Portail de demandes de services internes

Projet 2 de mon stage Full Stack chez Arrowstack.

Un portail interne où les employés créent des demandes (IT, RH, locaux), les demandes
sont routées vers la bonne équipe, un délai de service (SLA) est suivi à partir de la
priorité, et des tableaux de bord montrent la charge des équipes et le taux de respect
des délais.

## Technologies

- Backend : Node.js, Express 5, Prisma 6, PostgreSQL
- Authentification : JWT et bcrypt
- Validation : zod
- Frontend : React + Vite
- Déploiement : Docker Compose

Les raisons de ces choix sont dans [docs/decisions.md](docs/decisions.md). La stack est
la même que celle du projet 1, volontairement réutilisée.

## Organisation du dépôt

```
backend/     API REST
  prisma/    schéma, migrations, seed
  src/       routes, middlewares, schémas de validation
frontend/    interface React
docs/        exigences, décisions, cas de test
journal.md   journal de travail
```

## Lancer le backend

À compléter (même démarche que le projet 1 : `.env`, `prisma migrate dev`, seed, `npm run dev`).

## Lancer le frontend

À compléter.

## Lancer avec Docker

À compléter.

## Documentation

- [Exigences](docs/exigences.md) : rôles, fonctionnalités, modèle de données, routes, critères d'acceptation
- [Décisions techniques](docs/decisions.md)
- [Cas de test](docs/cas-de-test.md)
- [Journal de travail](journal.md)
