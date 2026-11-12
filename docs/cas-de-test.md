# Cas de test — Portail de demandes internes

> Les tests que j'ai faits pour valider le projet, les 11 et 12 novembre 2026, sur la
> version Docker (API sur `localhost:4100`, interface sur `localhost:8080`).
> Côté backend, j'ai appelé l'API directement avec `curl`, pour prouver que la sécurité
> est bien vérifiée par le serveur. Les captures sont dans `docs/preuves/`.
> Le parcours dans l'interface est montré dans la vidéo de démonstration.

**Résultat : 10 cas sur 10 conformes.**

## CT-01 - Connexion et rôles

| | |
|---|---|
| Étapes | Connexion avec un compte de chaque rôle (EMPLOYEE, AGENT, ADMIN), puis `GET /api/auth/me` avec chaque token |
| Attendu | JWT retourné, `/api/auth/me` renvoie le bon rôle |
| Résultat | ✅ Conforme. Les 3 connexions renvoient un token ; `/me` renvoie `EMPLOYEE` (sans équipe), `AGENT` (équipe `IT`) et `ADMIN` (sans équipe). |
| Preuve | [CT-01-connexion-api.png](preuves/CT-01-connexion-api.png) |

## CT-02 - Protection des rôles

| | |
|---|---|
| Étapes | EMPLOYEE ouvre le dashboard (`GET /api/admin/dashboard`) ; EMPLOYEE tente de créer un compte ADMIN (`POST /api/admin/users`) ; requête sans token |
| Attendu | 403 dans les deux premiers cas, 401 sans token |
| Résultat | ✅ Conforme : 403, 403 et 401. Aucun compte créé. Dans l'interface, un employé qui tape `/admin` est renvoyé sur sa liste de demandes. |
| Preuve | [CT-02-protection-roles-api.png](preuves/CT-02-protection-roles-api.png) |

## CT-03 - Création d'une demande avec SLA

| | |
|---|---|
| Étapes | EMPLOYEE crée une demande URGENT (#6 « Imprimante bloquée »), puis liste ses demandes |
| Attendu | Demande créée en OPEN, `dueAt` = création + 4h, visible dans ses demandes |
| Résultat | ✅ Conforme : 201, statut `OPEN`, échéance exactement 4h après la création, la #6 apparaît en tête de sa liste avec `overdue: false`. |
| Preuve | [CT-03-creation-sla-api.png](preuves/CT-03-creation-sla-api.png) |

Remarque : en envoyant des accents avec `curl` depuis le terminal Git Bash de VS Code,
le titre a été enregistré avec un caractère cassé (« bloqu�e »). Ça vient de l'encodage
du terminal, pas de l'API : l'interface envoie toujours de l'UTF-8. Solution pour le
terminal : `chcp.com 65001` avant les tests.

## CT-04 - Visibilité des demandes

| | |
|---|---|
| Étapes | Le deuxième employé ouvre la #6 de l'employé 1 ; l'agent IT liste ses demandes ; l'agent IT ouvre une demande RH (#5) |
| Attendu | 404 pour l'autre employé ; l'agent IT ne voit que les demandes IT |
| Résultat | ✅ Conforme : 404 pour l'autre employé, uniquement des catégories `IT` dans la liste de l'agent, 404 sur la demande RH. |
| Preuve | [CT-04-visibilite-api.png](preuves/CT-04-visibilite-api.png) |

Le 404 (plutôt qu'un 403) est voulu : il ne confirme pas à un tiers que la demande existe.

## CT-05 - Routage et cycle de statut

| | |
|---|---|
| Étapes | ADMIN assigne la #6 à l'agent IT ; l'agent la passe OPEN → IN_PROGRESS → RESOLVED ; tentative OPEN → CLOSED directe sur la #4 |
| Attendu | Assignation OK, statuts suivis, transition invalide refusée (400) |
| Résultat | ✅ Conforme : `assignedToId: 2`, puis `IN_PROGRESS`, puis `RESOLVED` avec `resolvedAt` rempli. La transition directe renvoie 400 « Transition impossible : OPEN → CLOSED » avec les statuts autorisés `["IN_PROGRESS","REJECTED"]`. |
| Preuve | [CT-05-routage-statuts-api.png](preuves/CT-05-routage-statuts-api.png) |

## CT-06 - Commentaires

| | |
|---|---|
| Étapes | L'agent puis le demandeur commentent la #6 ; lecture du fil ; le deuxième employé tente de commenter |
| Attendu | Fil visible par les deux, dans l'ordre chronologique |
| Résultat | ✅ Conforme : 201 pour les deux commentaires, fil affiché dans l'ordre (agent puis employé), 404 pour l'employé qui n'a pas accès à la demande. |
| Preuve | [CT-06-commentaires-api.png](preuves/CT-06-commentaires-api.png) |

## CT-07 - Détection du retard SLA

| | |
|---|---|
| Étapes | Consulter la liste des retards du dashboard, le filtre `?overdue=true` et le taux de SLA |
| Attendu | Les demandes non résolues dont l'échéance est passée apparaissent « en retard », et ne comptent pas comme respectées |
| Résultat | ✅ Conforme. Voir la remarque ci-dessous. Taux de SLA : `resolved: 1, resolvedInTime: 1, rate: 100` (la #6, résolue avant son échéance). |
| Preuve | [CT-07-retard-sla-api.png](preuves/CT-07-retard-sla-api.png), [CT-07-08-tableau-de-bord.png](preuves/CT-07-08-tableau-de-bord.png) |

Remarque : je m'attendais à une seule demande en retard (« Badge d'accès perdu »), et
j'en ai trouvé quatre. La base avait été remplie la veille, et les dates du seed sont
calculées par rapport au moment où il tourne : entre-temps, « Écran qui clignote »
(8h), « Attestation de salaire » et « Demande de télétravail » (24h) ont dépassé leur
échéance. C'est le bon comportement : le retard est recalculé à chaque requête (D3),
donc une demande passe en retard toute seule quand le temps passe. Sur une base neuve
(CT-10), on retrouve bien un seul retard.

## CT-08 - Dashboard admin

| | |
|---|---|
| Étapes | Comparer les volumes par statut et la charge par équipe de l'API avec un comptage SQL direct dans la base |
| Attendu | Les chiffres correspondent au contenu de la base |
| Résultat | ✅ Conforme. Statuts : 5 OPEN, 1 RESOLVED. Charge par équipe : IT 2, HR 2, FACILITY 1. Mêmes chiffres dans l'API, dans la base et dans l'interface. |
| Preuve | [CT-08-dashboard-api-vs-base.png](preuves/CT-08-dashboard-api-vs-base.png), [CT-07-08-tableau-de-bord.png](preuves/CT-07-08-tableau-de-bord.png) |

## CT-09 - Journal d'audit

| | |
|---|---|
| Étapes | Après les tests ci-dessus, consulter le journal en ADMIN, filtrer par action, et tenter d'y accéder en EMPLOYEE |
| Attendu | CREATE_REQUEST, ASSIGN_REQUEST, UPDATE_REQUEST_STATUS, COMMENT_REQUEST visibles avec auteur et date |
| Résultat | ✅ Conforme : 1 `CREATE_REQUEST`, 1 `ASSIGN_REQUEST`, 2 `UPDATE_REQUEST_STATUS` (avec `from`/`to` dans les détails), 2 `COMMENT_REQUEST`, plus les `LOGIN`. La transition refusée n'est pas journalisée (seules les actions réussies le sont). 403 pour l'employé. |
| Preuve | [CT-09-journal-audit-api.png](preuves/CT-09-journal-audit-api.png), [CT-09-journal-audit-interface.png](preuves/CT-09-journal-audit-interface.png) |

## CT-10 - Docker

| | |
|---|---|
| Étapes | `docker compose down -v`, puis `docker compose up -d --build` sur une base vide |
| Attendu | Les 3 conteneurs tournent, seed chargé, parcours conforme |
| Résultat | ✅ Conforme : `db` (healthy), `backend` et `frontend` démarrés ; migration appliquée et seed chargé automatiquement (6 utilisateurs, 5 demandes, 1 en retard) ; `/api/health` répond ; le tableau de bord affiche 5 demandes et 1 seul retard. |
| Preuve | [CT-10-docker-terminal.png](preuves/CT-10-docker-terminal.png), [CT-10-docker-tableau-de-bord.png](preuves/CT-10-docker-tableau-de-bord.png) |

Ce test a fait apparaître un défaut d'affichage : sur une base neuve, la jauge indiquait
« 0 % » alors qu'aucune demande n'était encore résolue (visible sur la capture). L'API
renvoyait bien `null`, c'est l'interface qui le transformait en 0. Corrigé : la jauge
affiche maintenant « — » avec « Aucune demande résolue pour le moment ».

## Capture supplémentaire

- [bonus-gestion-comptes.png](preuves/bonus-gestion-comptes.png) : la page de gestion
  des comptes de l'admin (création de comptes, F1).
