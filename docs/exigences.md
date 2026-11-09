# Exigences — Portail de demandes de services internes

## 1. Contexte

Dans beaucoup d'entreprises, les demandes internes (un PC qui ne marche plus, une
question RH, une clim en panne) passent par email, par message ou directement au
bureau de quelqu'un. Résultat : des demandes se perdent, on ne sait pas qui s'en
occupe, et personne ne peut dire si les équipes répondent dans des délais corrects.

Le portail règle ça : l'employé crée sa demande, elle part vers la bonne équipe, une
échéance (SLA) est fixée, et l'admin suit tout depuis un tableau de bord.

## 2. Les rôles

| Rôle | Qui | Ce qu'il peut faire |
|---|---|---|
| **EMPLOYEE** | N'importe quel salarié | Créer des demandes, voir et commenter les siennes |
| **AGENT** | Membre d'une équipe (IT, RH ou FACILITY) | Voir les demandes de son équipe, se les assigner, changer leur statut, commenter |
| **ADMIN** | Le responsable du service | Tout voir, assigner les demandes à un agent, consulter le tableau de bord et le journal d'audit |

Celui qui y gagne le plus, c'est l'admin : il voit enfin la charge de chaque équipe et
les retards. Mais les employés savent aussi où en est leur demande, et les agents ont
une file de travail claire.

## 3. Le problème et ce que l'outil apporte

- **Problème** : des demandes éparpillées, donc du temps perdu, des oublis, et aucun
  moyen de mesurer la qualité du service.
- **Ce que l'admin peut décider grâce à l'outil** : en voyant la charge par équipe et
  le pourcentage de demandes traitées à temps, il peut redistribuer le travail.
- **Ce qu'on peut mesurer** : chaque demande a une échéance dès sa création, et le
  tableau de bord affiche le taux de respect des SLA et la liste des retards.

## 4. Périmètre

**Ce que je fais :**
- Connexion JWT avec 3 rôles (EMPLOYEE, AGENT, ADMIN)
- Demandes classées par catégorie (IT, HR, FACILITY) et par priorité (URGENT, HIGH, NORMAL, LOW)
- Statuts : OPEN → IN_PROGRESS → RESOLVED → CLOSED, ou REJECTED
- Assignation à un agent de l'équipe qui correspond à la catégorie
- SLA : échéance calculée à la création selon la priorité, détection des retards
- Commentaires sur chaque demande
- Tableau de bord : volumes par statut, charge par équipe, taux de respect des SLA
- Journal d'audit des actions importantes
- API REST documentée et lancement avec Docker

**Ce que je ne fais pas :**
- Les notifications par email (tout se voit dans le portail)
- Les pièces jointes
- Une application mobile ou un chat en temps réel
- L'inscription libre : c'est l'ADMIN qui crée les comptes (voir D1)

## 5. Exigences fonctionnelles

| # | Exigence | Priorité |
|---|---|---|
| F1 | Les comptes sont créés par l'ADMIN ; connexion par JWT avec 3 rôles | Haute |
| F2 | Les routes sont protégées selon le rôle | Haute |
| F3 | Créer une demande avec titre, description, catégorie et priorité ; l'échéance est calculée automatiquement | Haute |
| F4 | Un employé ne voit que ses demandes, un agent celles de son équipe, l'admin toutes | Haute |
| F5 | L'ADMIN assigne une demande à un agent de la bonne équipe ; un agent peut se l'assigner lui-même | Haute |
| F6 | Les changements de statut suivent un cycle précis ; les autres sont refusés | Haute |
| F7 | Commentaires entre le demandeur et les agents | Moyenne |
| F8 | Chaque demande a une échéance `dueAt` selon sa priorité (URGENT 4h, HIGH 8h, NORMAL 24h, LOW 72h) et est marquée « en retard » si elle n'est pas résolue à temps | Haute |
| F9 | Tableau de bord ADMIN : volumes par statut, charge par équipe, taux de respect des SLA, liste des retards | Haute |
| F10 | Journal d'audit : création, assignation, changement de statut, commentaire | Haute |
| F11 | Toutes les entrées sont validées, avec des messages d'erreur compréhensibles | Haute |

## 6. Exigences non fonctionnelles

- **Sécurité** : mots de passe hashés avec bcrypt, JWT qui expirent, aucun secret dans le dépôt.
- **Intégrité** : clés étrangères en base, transitions de statut vérifiées par l'API.
- **Reproductibilité** : un `docker-compose.yml` et un README pour tout lancer, comme au projet 1.
- **Traçabilité** : des commits propres et un journal de travail daté.

## 7. Modèle de données (4 tables)

| Table | Colonnes principales | Contraintes |
|---|---|---|
| `users` | id, email, passwordHash, name, role, team | email unique ; role ∈ {EMPLOYEE, AGENT, ADMIN} ; team obligatoire pour un AGENT |
| `requests` | id, title, description, category, priority, status, createdById, assignedToId, createdAt, dueAt, resolvedAt, closedAt | category ∈ {IT, HR, FACILITY} ; priority ∈ {URGENT, HIGH, NORMAL, LOW} ; status ∈ {OPEN, IN_PROGRESS, RESOLVED, CLOSED, REJECTED} |
| `comments` | id, requestId, authorId, body, createdAt | body non vide ; rattaché à une demande existante |
| `activity_logs` | id, userId, action, entity, entityId, details, createdAt | index sur createdAt et userId |

La règle principale : `dueAt` = `createdAt` + le délai de la priorité. Une demande est
en retard si son statut n'est pas RESOLVED, CLOSED ou REJECTED et que l'échéance est
dépassée. Ce retard n'est pas stocké, il est recalculé à chaque fois (voir D3).

## 8. Routes de l'API

### Authentification
| Méthode | Route | Description |
|---|---|---|
| POST | `/api/auth/login` | Renvoie un JWT (pas d'inscription, voir D1) |
| GET | `/api/auth/me` | Profil de l'utilisateur connecté |

### Demandes
| Méthode | Route | Accès |
|---|---|---|
| POST | `/api/requests` | EMPLOYEE |
| GET | `/api/requests` | EMPLOYEE (les siennes), AGENT (son équipe), ADMIN (toutes) ; filtres statut, catégorie, retard |
| GET | `/api/requests/:id` | Le créateur, un agent de l'équipe, l'ADMIN |
| PATCH | `/api/requests/:id/assign` | ADMIN (choisit un agent), AGENT (s'assigne lui-même, si c'est son équipe) |
| PATCH | `/api/requests/:id/status` | AGENT de l'équipe, ADMIN |
| POST | `/api/requests/:id/comments` | Le créateur, un agent de l'équipe, l'ADMIN |
| GET | `/api/requests/:id/comments` | Le créateur, un agent de l'équipe, l'ADMIN |

### Administration
| Méthode | Route | Accès |
|---|---|---|
| GET | `/api/admin/dashboard` | ADMIN |
| GET | `/api/admin/users` | ADMIN |
| POST | `/api/admin/users` | ADMIN (créer un EMPLOYEE ou un AGENT) |
| GET | `/api/admin/audit-logs` | ADMIN (avec filtres) |

## 9. Critères d'acceptation

- [ ] Quand un EMPLOYEE crée une demande, son échéance est calculée selon la priorité (CT-03).
- [ ] Un EMPLOYEE ne voit que ses demandes, et un AGENT IT ne voit pas celles des RH (CT-04).
- [ ] L'ADMIN assigne une demande IT à un agent IT, qui la passe en IN_PROGRESS puis RESOLVED (CT-05).
- [ ] Passer directement de OPEN à CLOSED est refusé avec un message clair (CT-05).
- [ ] Une demande URGENT non résolue après 4h apparaît en retard dans le tableau de bord (CT-07).
- [ ] Le tableau de bord affiche le taux de respect des SLA et la charge par équipe (CT-08).
- [ ] Création, assignation, changement de statut et commentaire apparaissent dans le journal d'audit (CT-09).
- [ ] Le mentor peut lancer tout le projet avec `docker compose up --build` en suivant le README (CT-10).

## 10. Comment je saurai que c'est réussi

1. On passe de la création d'une demande à son assignation en moins d'une minute.
2. Toutes les routes protégées renvoient 401 ou 403 sans token ou avec le mauvais rôle (CT-02).
3. Le taux de SLA affiché correspond bien au calcul, vérifié sur des demandes mises en retard exprès dans le seed.
4. Toutes les actions importantes sont dans le journal d'audit.
