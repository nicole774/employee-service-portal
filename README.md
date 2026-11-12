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
frontend/    l'interface React
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

Le backend doit tourner en même temps.

```bash
cd frontend
npm install
npm run dev
```

L'interface s'ouvre sur `http://localhost:5173`. Par défaut, elle appelle l'API sur
`http://localhost:4000/api` ; on peut changer cette adresse avec la variable
`VITE_API_URL`.

## Lancer avec Docker

Il suffit d'avoir Docker Desktop. Depuis la racine du projet :

```bash
docker compose up -d --build
```

Ça lance trois conteneurs : PostgreSQL, l'API et l'interface. Au démarrage, l'API
applique les migrations et charge le seed toute seule.

- Interface : `http://localhost:8080`
- API : `http://localhost:4100/api` (test rapide : `/api/health`)

J'ai choisi des ports différents de ceux du développement, pour pouvoir garder les
deux en même temps sans conflit.

Pour arrêter : `docker compose down`. Pour repartir d'une base vide :
`docker compose down -v` (supprime aussi les données).

## Tests

Les 10 cas de test (connexion, rôles, SLA, visibilité, statuts, commentaires, retards,
tableau de bord, journal d'audit, Docker) sont tous conformes. Le détail et les
captures sont dans [docs/cas-de-test.md](docs/cas-de-test.md).

**[Vidéo de démonstration](https://drive.google.com/file/d/12G0mrK6iNChhQ1PIImGRF4aHg4isd8-y/view?usp=sharing)** :
le parcours complet d'une demande, de sa création par un employé jusqu'à sa résolution
par l'agent, avec le routage par l'admin, le Kanban, les commentaires, le tableau de bord
et le journal d'audit.

## Améliorations possibles

- **Inscription avec validation par l'admin** : aujourd'hui, seul l'admin crée les
  comptes (voir D1). On pourrait laisser chacun s'inscrire, mais toujours en EMPLOYEE,
  avec un compte « en attente » que l'admin valide avant la première connexion.
- **Notifications par email** quand une demande change de statut ou reçoit un
  commentaire (exclues du périmètre pour l'instant).
- **Pièces jointes** sur les demandes (une capture d'écran d'erreur, par exemple).

## Documentation

- [Exigences](docs/exigences.md) : rôles, fonctionnalités, modèle de données, routes, critères d'acceptation
- [Décisions techniques](docs/decisions.md)
- [Cas de test](docs/cas-de-test.md)
- [Journal de travail](journal.md)
