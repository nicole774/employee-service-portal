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
  demandes. Pour tester le SLA, j'en ai daté deux dans le passé : « Badge d'accès
  perdu » (URGENT, créée 30h avant, donc en retard) et « Écran qui clignote » (HIGH,
  créée 2h avant, encore dans les temps).
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
  bord cohérent avec la base (la demande du badge, créée 30h avant, est bien
  détectée en retard), et journal d'audit rempli.

Prochaine étape : le frontend (en reprenant des composants du projet 1, avec les pages
connexion, mes demandes, nouvelle demande, détail et admin), puis Docker et les preuves.

## 10 novembre 2026

- Frontend terminé : une coque avec barre latérale, et des pages selon le rôle
  (mes demandes et nouvelle demande pour l'employé, Kanban pour l'agent, tableau de
  bord, comptes et journal pour l'admin).
- Relecture et corrections :
  - le Kanban demandait 100 demandes alors que l'API en renvoie 50 au maximum ; il
    charge maintenant toutes les pages ;
  - deux erreurs de lint (`setState` appelé directement dans un `useEffect`) : en les
    corrigeant, j'ai aussi évité qu'une ancienne réponse écrase une plus récente quand
    on change vite de filtre ;
  - des `<main>` imbriqués remplacés par des `<section>` ;
  - le titre de l'onglet était encore « B2B Commandes », copié du projet 1.
- Kanban : la colonne « Terminées » ne montre que les 3 plus récentes, avec un bouton
  pour voir les autres. Je n'ai pas fait de suppression : les demandes terminées
  comptent dans le taux de SLA et dans le journal d'audit.
- Ajout d'un `.gitattributes` pour fixer les fins de ligne (LF) dans tout le dépôt et
  ne plus avoir l'avertissement « LF will be replaced by CRLF ».
- Première Pull Request sur GitHub pour fusionner le frontend dans `main`. J'ai appris
  qu'après une fusion sur GitHub, il faut faire `git pull`, pas `git push`.
- Docker : un Dockerfile pour le backend, un pour le frontend (build Vite puis nginx),
  et un `docker-compose.yml` avec la base, l'API et l'interface. Les ports sont
  différents de ceux du dev (8080 et 4100) pour éviter le conflit de port du 9
  novembre. L'adresse de l'API est passée au build du frontend, parce que c'est le
  navigateur qui l'appelle, pas le conteneur. Testé : migrations et seed appliqués au
  démarrage, connexion et tableau de bord OK.

- En relisant, j'ai vu que le journal du 9 novembre parlait de 2 demandes en retard
  dans le seed, alors qu'il n'y en a qu'une (l'autre est datée dans le passé mais
  reste dans les temps). Journal corrigé. Le seed avait aussi sa propre copie des
  délais SLA, contrairement à D2 : il utilise maintenant `src/lib/sla.js`.

Prochaine étape : dérouler les cas de test CT-01 à CT-10 et ranger les captures dans
`docs/preuves/`.

## 11 et 12 novembre 2026

- Tests CT-01 à CT-10 déroulés sur la version Docker : **10 sur 10 conformes**.
  Résultats et captures dans `docs/cas-de-test.md` et `docs/preuves/`.
- Pour le backend, j'ai appelé l'API directement avec `curl`, pour prouver que la
  sécurité est vérifiée par le serveur et pas seulement cachée dans l'interface. Pour
  aller plus vite, je récupère le token directement dans une variable :
  `TOKEN=$(curl ... | sed ...)`. Une capture du terminal par test suffit.
- Pour le frontend, quelques captures seulement, et une vidéo de démonstration pour
  le parcours complet.
- Ce que les tests m'ont appris :
  - Docker Desktop s'est arrêté pendant les tests (« Docker Engine stopped
    unexpectedly ») à cause de WSL, sûrement après une mise à jour. Redémarrer Docker
    Desktop a suffi.
  - Les accents envoyés avec `curl` depuis Git Bash arrivaient cassés dans la base.
    C'est l'encodage du terminal, pas l'API : `chcp.com 65001` règle le problème.
  - CT-07 a montré quatre demandes en retard au lieu d'une, parce que la base avait
    été remplie la veille et que les délais avaient continué de courir. C'est le bon
    comportement (le retard est recalculé à chaque requête, D3), mais je ne l'avais
    pas anticipé dans le résultat attendu.
  - CT-10 a révélé un défaut : sur une base neuve, la jauge du tableau de bord
    affichait « 0 % » alors qu'aucune demande n'était résolue. L'API renvoyait `null`,
    c'est l'interface qui le changeait en 0. Corrigé : elle affiche « — ».
- J'ai envisagé de laisser chaque employé créer son compte. J'ai gardé la création par
  l'admin (D1) : c'est un portail interne, et une inscription libre permettrait à une
  personne extérieure d'entrer. L'idée est notée comme amélioration possible.

Prochaine étape : enregistrer la vidéo de démonstration et ajouter son lien au README.
