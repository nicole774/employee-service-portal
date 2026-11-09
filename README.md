# Portail de demandes de services internes

C'est mon deuxième projet de stage Full Stack chez Arrowstack.

L'idée : un portail interne où les employés déposent leurs demandes (informatique, RH,
locaux). Chaque demande part vers la bonne équipe, reçoit une échéance (SLA) selon sa
priorité, et l'admin a un tableau de bord pour voir la charge des équipes et si les
délais sont tenus.

## Technologies

- Backend : Node.js, Express 5, Prisma 6, PostgreSQL
- Authentification : JWT + bcrypt
- Validation : zod
- Frontend : React + Vite
- Déploiement : Docker Compose

J'ai repris la même stack que pour le projet 1, c'est un choix assumé ; j'explique
pourquoi dans [docs/decisions.md](docs/decisions.md).

## Organisation du dépôt

```
backend/     l'API REST
  prisma/    schéma, migrations, seed
  src/       routes, middlewares, schémas de validation, utilitaires (SLA, audit)
frontend/    l'interface React (pas encore commencée)
docs/        exigences, décisions, cas de test
journal.md   mon journal de travail
```

## Lancer le backend

Prérequis : Node.js et un PostgreSQL local.

```bash
cd backend
npm install
cp .env.example .env        # puis renseigner DATABASE_URL et JWT_SECRET
npx prisma migrate dev
npx prisma db seed
npm run dev
```

L'API tourne sur `http://localhost:4000`. Le seed crée 6 comptes de test (un admin,
un agent par équipe, deux employés) ; les identifiants sont dans `prisma/seed.js`.

Attention : si le backend du projet 1 tourne encore, il occupe aussi le port 4000.
Il faut l'arrêter avant (je me suis fait avoir, voir le journal du 9 novembre).

## Lancer le frontend

Pas encore fait.

## Lancer avec Docker

Pas encore fait.

## Documentation

- [Exigences](docs/exigences.md) : rôles, fonctionnalités, modèle de données, routes, critères d'acceptation
- [Décisions techniques](docs/decisions.md)
- [Cas de test](docs/cas-de-test.md)
- [Journal de travail](journal.md)
