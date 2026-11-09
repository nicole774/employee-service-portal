# Cas de test — Portail de demandes internes

> Les tests que je vais faire pour valider le projet. Comme au projet 1, je les fais à la main
> et je range les captures dans `docs/preuves/`.

## CT-01 - Connexion et rôles

| | |
|---|---|
| Étapes | Connexion avec un compte de chaque rôle (EMPLOYEE, AGENT, ADMIN) |
| Attendu | JWT retourné, `/api/auth/me` renvoie le bon rôle |
| Preuve | à faire |

## CT-02 - Protection des rôles

| | |
|---|---|
| Étapes | EMPLOYEE tente de créer un compte (POST /api/admin/users) ; EMPLOYEE accède au dashboard |
| Attendu | 403 dans les deux cas |
| Preuve | à faire |

## CT-03 - Création d'une demande avec SLA

| | |
|---|---|
| Étapes | EMPLOYEE crée une demande URGENT |
| Attendu | Demande créée en OPEN, échéance dueAt = création + 4h, visible dans ses demandes |
| Preuve | à faire |

## CT-04 - Visibilité des demandes

| | |
|---|---|
| Étapes | EMPLOYEE B tente d'ouvrir la demande de l'EMPLOYEE A ; un AGENT IT liste ses demandes (les RH n'apparaissent pas) |
| Attendu | 404 pour B ; l'agent IT ne voit que les demandes IT |
| Preuve | à faire |

## CT-05 - Routage et cycle de statut

| | |
|---|---|
| Étapes | ADMIN assigne une demande IT à un agent IT ; l'agent passe OPEN → IN_PROGRESS → RESOLVED ; tentative OPEN → CLOSED directe |
| Attendu | Assignation OK, statuts suivis, transition invalide refusée (400) |
| Preuve | à faire |

## CT-06 - Commentaires

| | |
|---|---|
| Étapes | Le demandeur et l'agent commentent la demande |
| Attendu | Fil visible par les deux, dans l'ordre chronologique |
| Preuve | à faire |

## CT-07 - Détection du retard SLA

| | |
|---|---|
| Étapes | Créer (via le seed ou l'API) une demande URGENT avec une date de création passée de plus de 4h, non résolue |
| Attendu | Elle apparaît « en retard » dans le dashboard, et le taux de SLA ne la compte pas comme respectée |
| Preuve | à faire |

## CT-08 - Dashboard admin

| | |
|---|---|
| Étapes | Vérifier les volumes par statut et la charge par équipe contre les données réelles |
| Attendu | Les chiffres correspondent au contenu de la base |
| Preuve | à faire |

## CT-09 - Journal d'audit

| | |
|---|---|
| Étapes | Refaire les actions ci-dessus, puis consulter le journal en ADMIN |
| Attendu | CREATE_REQUEST, ASSIGN_REQUEST, UPDATE_STATUS, COMMENT visibles avec auteur et date |
| Preuve | à faire |

## CT-10 - Docker

| | |
|---|---|
| Étapes | `docker compose up -d --build`, parcours complet sur la base Docker neuve |
| Attendu | Les 3 conteneurs tournent, seed chargé, parcours conforme |
| Preuve | à faire |
