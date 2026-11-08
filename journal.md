# Journal de travail — Projet 2 : Portail de demandes de services internes

> Projet 2 du stage Full Stack Arrowstack. Journal daté, même approche que le projet 1.

## 2026-11-08

- Cadrage du projet : rédaction des exigences (`docs/exigences.md`) à partir du scénario
  « Employee Service Request System » du cahier des charges.
- Décision de partir sur un nouveau dépôt séparé (`employee-service-portal`), le portail
  de soumission demandant un lien par projet.
- Réutilisation de la stack validée au projet 1 : Express + Prisma + PostgreSQL + JWT +
  zod + Docker (voir D1).

### Prochaines étapes prévues

- Créer la base `service_requests` et initialiser Prisma.
- Adapter le squelette du backend (auth, middlewares, validation) du projet 1.
