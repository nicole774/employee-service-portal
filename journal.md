# Journal de travail — Projet 2 : portail de demandes internes

Comme pour le projet 1, je note ici chaque jour ce que j'ai fait.

## 8 novembre 2026

- J'ai cadré le projet et écrit les exigences (`docs/exigences.md`) à partir du
  scénario « Employee Service Request System » du cahier des charges.
- J'ai créé un nouveau dépôt (`employee-service-portal`) au lieu de continuer dans
  celui du projet 1, parce que le portail de rendu demande un lien par projet.
- Je garde la même stack que pour le projet 1 : Express, Prisma, PostgreSQL, JWT, zod
  et Docker (voir D1).

Pour la suite : créer la base `service_requests`, initialiser Prisma et reprendre le
squelette du backend du projet 1 (auth, middlewares, validation).

## 9 novembre 2026

- Base `service_requests` créée, dépendances installées, première migration (4 tables)
  et seed. Le seed crée 6 comptes (1 admin, 1 agent par équipe, 2 employés) et 5
  demandes, dont 2 que j'ai mises en retard exprès pour tester les indicateurs.
- Auth : pas de `/register`, c'est l'ADMIN qui crée les comptes (D1). J'ai ajouté
  l'équipe de l'agent dans le JWT.
- J'ai écrit `src/lib/sla.js` : l'échéance est calculée à la création selon la
  priorité, et le retard est recalculé à chaque fois au lieu d'être stocké (D2, D3).
- Routes des demandes : création (EMPLOYEE), liste filtrée selon le rôle (ses demandes,
  celles de son équipe, ou toutes), assignation (l'ADMIN choisit un agent de la bonne
  équipe, l'agent peut se l'assigner), changements de statut contrôlés par le tableau
  `ALLOWED_TRANSITIONS` (D4), et commentaires.
- Routes admin : tableau de bord (volumes par statut, charge par équipe, taux de
  respect des SLA, liste des retards), création de comptes (un AGENT doit avoir une
  équipe) et journal d'audit avec filtres. Pour le taux de SLA, je compare `resolvedAt`
  et `dueAt` en JS, parce que Prisma ne sait pas comparer deux colonnes (D5).
- J'ai eu deux bugs pendant les tests :
  1. Le login échouait alors que les identifiants étaient bons. En fait, **deux
     serveurs tournaient sur le port 4000** : mon backend du projet 1 était encore
     lancé et c'est lui qui répondait, avec la mauvaise base. J'ai arrêté les deux et
     relancé. Ce que j'en retiens : quand quelque chose paraît impossible, vérifier
     d'abord qui répond vraiment.
  2. L'agent IT n'avait pas accès à une demande IT. Le middleware `authenticate`,
     repris du projet 1, ne mettait que `id` et `role` dans `req.user`, pas le `team`
     que j'avais ajouté au JWT. Une ligne à corriger.
- J'ai testé tout le parcours avec curl : création avec échéance à +4h pour une demande
  URGENT, visibilité selon le rôle (403 sur le tableau de bord pour un employé, 403
  pour un agent IT sur une demande RH), assignation, chaîne complète OPEN →
  IN_PROGRESS → RESOLVED (avec `resolvedAt` rempli) → CLOSED, transition invalide
  refusée avec la liste des statuts possibles, commentaires dans l'ordre, tableau de
  bord cohérent avec la base (les demandes du seed créées 17h avant sont bien en
  retard), et journal d'audit rempli.

Prochaine étape : le frontend (en reprenant des composants du projet 1, avec les pages
connexion, mes demandes, nouvelle demande, détail et admin), puis Docker et les preuves.
