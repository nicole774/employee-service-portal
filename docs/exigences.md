# Document d'exigences — Portail de demandes de services internes

## 1. Contexte et scénario

Une entreprise fait tourner ses demandes internes (informatique, RH, locaux) par
email, par message ou en passant la tête au bureau : les demandes se perdent, personne
ne sait qui traite quoi, et rien ne mesure si les services répondent dans les temps.
Nous développons un portail interne où chaque employé crée une demande, celle-ci est
routée vers la bonne équipe, un délai de service (SLA) est suivi, et des tableaux de
bord montrent l'état du service.

## 2. Parties prenantes et rôles

| Rôle | Description | Peut faire |
|---|---|---|
| **EMPLOYEE** | Tout salarié de l'entreprise | Créer des demandes, voir et commenter les siennes |
| **AGENT** | Membre d'une équipe de traitement (IT, RH, FACILITY) | Voir les demandes de son équipe, se les assigner, les traiter, changer leur statut, commenter |
| **ADMIN** | Responsable du service | Tout voir, router les demandes non assignées vers un agent, consulter les tableaux de bord et le journal d'audit |

**Partie prenante principale** : le responsable du service (ADMIN), qui obtient une
visibilité sur la charge et les délais ; bénéficiaires : les employés, qui savent où
en est leur demande, et les agents, qui ont une file claire.

## 3. Problème métier et bénéfice attendu

- **Problème** : demandes dispersées → perte de temps, demandes oubliées, aucun
  indicateur de qualité de service.
- **Décision permise par l'outil** : l'admin voit la charge par équipe et le pourcentage
  de demandes résolues dans les délais, et peut rééquilibrer.
- **Bénéfice mesurable** : chaque demande a une échéance (SLA) dès sa création ; le
  tableau de bord affiche le taux de respect des SLA et la liste des retards.

## 4. Périmètre (scope)

**Dans le périmètre :**
- Authentification JWT avec 3 rôles (EMPLOYEE, AGENT, ADMIN)
- Demandes catégorisées (IT, HR, FACILITY) avec priorité (URGENT, HIGH, NORMAL, LOW)
- Statuts : OPEN → IN_PROGRESS → RESOLVED → CLOSED (ou REJECTED par l'agent/admin)
- Routage : assignation à un agent de l'équipe correspondant à la catégorie
- SLA : échéance calculée à la création selon la priorité ; détection des retards
- Fil de commentaires sur chaque demande
- Tableaux de bord : volumes par statut, charge par équipe, taux de respect des SLA
- Journal d'audit des actions significatives
- API REST documentée, prête pour Docker

**Hors périmètre (explicitement exclu) :**
- Notifications par email (l'activité est visible dans le portail)
- Pièces jointes sur les demandes
- Application mobile, chat en temps réel
- Création de comptes par les employés : les comptes sont créés par l'ADMIN
  (c'est un portail interne, on ne s'inscrit pas tout seul)

## 5. Exigences fonctionnelles

| # | Exigence | Priorité |
|---|---|---|
| F1 | Comptes créés par l'ADMIN ; connexion JWT avec 3 rôles | Haute |
| F2 | Routes protégées par rôle (EMPLOYEE / AGENT / ADMIN) | Haute |
| F3 | Créer une demande : titre, description, catégorie, priorité — l'échéance SLA est calculée automatiquement | Haute |
| F4 | Le demandeur ne voit que SES demandes ; un agent voit celles de SON équipe ; l'admin voit tout | Haute |
| F5 | Routage : l'ADMIN assigne une demande non assignée à un agent de l'équipe correspondant à sa catégorie ; un agent peut s'auto-assigner | Haute |
| F6 | Cycle de statut contrôlé : OPEN → IN_PROGRESS → RESOLVED → CLOSED ; transitions invalides refusées | Haute |
| F7 | Fil de commentaires (demandeur et agents concernés) | Moyenne |
| F8 | SLA : chaque demande a une échéance (`dueAt`) selon sa priorité (URGENT 4h, HIGH 8h, NORMAL 24h, LOW 72h) ; indicateur « en retard » si non résolue après l'échéance | Haute |
| F9 | Tableau de bord ADMIN : volumes par statut, charge par équipe, taux de respect des SLA, liste des retards | Haute |
| F10 | Journal d'audit : création, assignation, changement de statut, commentaires | Haute |
| F11 | Validation de toutes les entrées avec messages d'erreur clairs | Haute |

## 6. Exigences non fonctionnelles

- **Sécurité** : mots de passe hashés bcrypt, JWT avec expiration, secrets hors du dépôt.
- **Intégrité** : clés étrangères, transitions de statut contrôlées côté API.
- **Reproductibilité** : `docker-compose.yml` + README, même approche que le projet 1.
- **Traçabilité** : historique Git propre, journal de travail daté.

## 7. Modèle de données (4 tables)

| Table | Colonnes principales | Contraintes clés |
|---|---|---|
| `users` | id, email, passwordHash, name, role, team | email unique ; role ∈ {EMPLOYEE, AGENT, ADMIN} ; team renseignée pour les AGENT |
| `requests` | id, title, description, category, priority, status, createdById, assignedToId, createdAt, dueAt, resolvedAt, closedAt | category ∈ {IT, HR, FACILITY} ; priority ∈ {URGENT, HIGH, NORMAL, LOW} ; status ∈ {OPEN, IN_PROGRESS, RESOLVED, CLOSED, REJECTED} |
| `comments` | id, requestId, authorId, body, createdAt | body non vide ; lié à une demande existante |
| `activity_logs` | id, userId, action, entity, entityId, details, createdAt | index sur createdAt et userId |

Règle métier clé : `dueAt` = `createdAt` + délai de SLA de la priorité. La demande est
« en retard » si `status` ∉ {RESOLVED, CLOSED, REJECTED} et `now` > `dueAt` (calculée
à la volée, pas stockée, pour ne jamais diverger).

## 8. Endpoints de l'API REST

### Authentification (public)
| Méthode | Route | Description |
|---|---|---|
| POST | `/api/auth/login` | Retourne un JWT (pas d'inscription : comptes créés par l'ADMIN) |
| GET | `/api/auth/me` | Profil de l'utilisateur connecté |

### Demandes
| Méthode | Route | Accès |
|---|---|---|
| POST | `/api/requests` | EMPLOYEE (création, échéance SLA calculée) |
| GET | `/api/requests` | EMPLOYEE (les siennes) / AGENT (son équipe) / ADMIN (toutes) — filtres statut, catégorie, retard |
| GET | `/api/requests/:id` | Créateur / agent de l'équipe / ADMIN |
| PATCH | `/api/requests/:id/assign` | ADMIN (assigne un agent) ; AGENT (s'auto-assigne si de son équipe) |
| PATCH | `/api/requests/:id/status` | AGENT (son équipe) / ADMIN — transitions contrôlées |
| POST | `/api/requests/:id/comments` | Créateur / agent concerné / ADMIN |
| GET | `/api/requests/:id/comments` | Créateur / agent concerné / ADMIN |

### Administration
| Méthode | Route | Accès |
|---|---|---|
| GET | `/api/admin/dashboard` | ADMIN : volumes par statut, charge par équipe, taux de SLA respecté, retards |
| GET | `/api/admin/users` | ADMIN : liste des comptes |
| POST | `/api/admin/users` | ADMIN : créer un compte (EMPLOYEE ou AGENT) |
| GET | `/api/admin/audit-logs` | ADMIN : journal d'activité (filtres) |

## 9. Critères d'acceptation

- [ ] Un EMPLOYEE crée une demande : elle a une échéance SLA calculée selon la priorité.
- [ ] Un EMPLOYEE ne voit que ses demandes ; un AGENT IT ne voit pas les demandes RH (CT-02/CT-08).
- [ ] L'ADMIN route une demande IT vers un agent IT ; l'agent la passe en IN_PROGRESS puis RESOLVED.
- [ ] Une transition invalide (OPEN → CLOSED direct) est refusée avec un message clair.
- [ ] Une demande URGENT non résolue au bout de 4h apparaît « en retard » dans le dashboard.
- [ ] Le dashboard affiche le taux de respect des SLA et la charge par équipe.
- [ ] Les actions (création, assignation, statut, commentaire) sont dans le journal d'audit.
- [ ] Le mentor lance le projet complet avec `docker compose up --build` en suivant le README.

## 10. Métriques de succès

1. Une demande passe de la création à l'assignation en moins d'une minute (flux simple et clair).
2. 100 % des routes renvoient 401/403 sans token ou sans le bon rôle (CT-02).
3. Le taux de SLA affiché correspond au calcul réel vérifié sur des jeux de données de test (demandes en retard créées volontairement).
4. 100 % des actions significatives sont dans le journal d'audit.
