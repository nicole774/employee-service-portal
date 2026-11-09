# Décisions techniques

Je note ici les choix que j'ai faits et pourquoi, au fur et à mesure.

## D1 - Garder la stack du projet 1 (8 novembre)

Le projet 2 utilise la même famille d'outils que le premier : React, une API REST,
PostgreSQL, des accès par rôle et Docker. J'ai donc repris exactement les mêmes choix
(Express, Prisma, JWT + bcrypt, zod, Docker Compose), avec la même organisation de
dossiers et les mêmes middlewares.

Pourquoi : j'ai cinq jours. Ce qui est nouveau ici, c'est la logique métier (routage,
SLA, tableau de bord), pas la stack. En réutilisant ce qui marche déjà, je peux passer
mon temps sur ce qui compte.

Une différence volontaire : pas d'inscription. C'est un outil interne, donc c'est
l'ADMIN qui crée les comptes et il n'y a pas de route `/register` publique.

## D2 - Les délais SLA sont dans le code, pas en base (9 novembre)

Les durées par priorité (URGENT 4h, HIGH 8h, NORMAL 24h, LOW 72h) sont dans
`src/lib/sla.js`. Le seed et les routes utilisent ce même fichier, donc il n'y a qu'un
seul endroit à modifier. Les mettre dans le schéma Prisma aurait demandé une migration
à chaque changement.

L'échéance `dueAt` est calculée une seule fois, à la création de la demande, puis
enregistrée.

## D3 - Le retard est calculé à la volée, jamais stocké (9 novembre)

Une demande est en retard si elle n'est pas terminée (ni RESOLVED, ni CLOSED, ni
REJECTED) et que son échéance est passée. Si je stockais un champ « en retard », il
faudrait une tâche pour le mettre à jour régulièrement, et il finirait par être faux.
En le calculant à chaque lecture, il est toujours juste.

## D4 - Transitions de statut définies dans un tableau (9 novembre)

Les changements de statut autorisés sont listés dans `ALLOWED_TRANSITIONS`
(OPEN → IN_PROGRESS → RESOLVED → CLOSED, et REJECTED possible en cours de route).
Toute autre transition est refusée avec un 400 qui indique les statuts possibles.
C'est plus lisible qu'une suite de `if`, et facile à modifier.

## D5 - Taux de respect des SLA calculé en JavaScript (9 novembre)

Pour savoir si une demande a été résolue à temps, il faut comparer deux colonnes
(`resolvedAt` et `dueAt`). Prisma ne sait pas faire ça dans un `where`, donc je
récupère les demandes résolues et je fais la comparaison en JS. Avec le volume d'un
portail interne, ça ne pose pas de problème de performance.
