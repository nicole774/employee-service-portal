# Journal des décisions techniques

## D1 - Réutiliser la stack du projet 1 (2026-11-08)

Le projet 2 demande la même famille d'outils (React, API REST, PostgreSQL, accès par
rôles, Docker). Je repars donc sur exactement les mêmes choix que le projet 1 :
Express, Prisma, JWT + bcrypt, zod, Docker Compose, avec la même organisation de
dossiers et les mêmes middlewares.

Raison : avec cinq jours pour livrer, l'enjeu du projet 2 n'est pas la stack mais la
logique métier (routage des demandes, SLA, tableaux de bord). Réutiliser ce qui est
déjà validé me permet de consacrer tout le temps au nouveau.

Ce qui est volontairement différent : les comptes ne sont pas créés par inscription —
c'est un portail interne, l'ADMIN crée les comptes. Il n'y a donc pas de route
`/register` publique.

## (Entrées suivantes : calcul du SLA, transitions de statut, structure du dashboard…)
