const express = require('express');
const prisma = require('../lib/prisma');
const { logActivity } = require('../lib/logActivity');
const { authenticate, requireRole } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { createRequestSchema, statusSchema, assignSchema, commentSchema } = require('../schemas/request.schemas');
const { computeDueAt, isOverdue } = require('../lib/sla');
const router = express.Router();

// Toutes les routes demandes exigent d'être connecté
router.use(authenticate);

// Renvoie la demande « habillée » : flag de retard + noms lisibles
function withMeta(request) {
  return { ...request, overdue: isOverdue(request) };
}

const REQUEST_INCLUDE = {
  createdBy: { select: { id: true, name: true, email: true } },
  assignedTo: { select: { id: true, name: true, team: true } },
  comments: { include: { author: { select: { id: true, name: true, role: true, team: true } } }, orderBy: { createdAt: 'asc' } },
};

// Détermine qui peut voir une demande : le créateur, un agent de l'équipe concernée, un admin
function canSee(request, user) {
  if (user.role === 'ADMIN') return true;
  if (user.role === 'EMPLOYEE') return request.createdById === user.id;
  // AGENT : même équipe que la catégorie de la demande
  return request.category === user.team;
}

// POST /api/requests — créer une demande (EMPLOYEE uniquement)
router.post('/', requireRole('EMPLOYEE'), validate(createRequestSchema), async (req, res) => {
  const { title, description, category, priority } = req.body;

  const request = await prisma.request.create({
    data: {
      title,
      description,
      category,
      priority,
      // L'échéance SLA est calculée ici, pas saisie par le client : le client
      // ne peut pas décider lui-même de son délai de traitement
      dueAt: computeDueAt(priority),
      createdById: req.user.id,
    },
  });

  await logActivity(prisma, req.user.id, 'CREATE_REQUEST', 'request', request.id, {
    category,
    priority,
  });

  res.status(201).json(withMeta(request));
});

// GET /api/requests — EMPLOYEE : les siennes / AGENT : son équipe / ADMIN : toutes
// Filtres optionnels : ?status=&category=&overdue=true&page=&limit=
router.get('/', async (req, res) => {
  const where = {};

  if (req.user.role === 'EMPLOYEE') {
    where.createdById = req.user.id;
  } else if (req.user.role === 'AGENT') {
    where.category = req.user.team;
  }

  if (req.query.status) {
    where.status = String(req.query.status);
  }
  if (req.query.category && req.user.role === 'ADMIN') {
    where.category = String(req.query.category);
  }

  // ?overdue=true : uniquement les demandes non terminées dont l'échéance est passée
  if (req.query.overdue === 'true') {
    where.dueAt = { lt: new Date() };
    where.status = { in: ['OPEN', 'IN_PROGRESS'] };
  }

  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 20);

  const [requests, total] = await prisma.$transaction([
    prisma.request.findMany({
      where,
      include: { createdBy: { select: { id: true, name: true } }, assignedTo: { select: { id: true, name: true, team: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.request.count({ where }),
  ]);

  res.json({
    data: requests.map(withMeta),
    meta: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

// GET /api/requests/:id — détail avec le fil de commentaires
router.get('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Identifiant invalide' });
  }

  const request = await prisma.request.findUnique({ where: { id }, include: REQUEST_INCLUDE });

  // Même logique que le projet 1 (D6) : introuvable pour qui n'a pas le droit,
  // pour ne pas confirmer l'existence d'une demande à un tiers
  if (!request || !canSee(request, req.user)) {
    return res.status(404).json({ error: 'Demande introuvable' });
  }

  res.json(withMeta(request));
});

// PATCH /api/requests/:id/assign — routage de la demande
// ADMIN : assigne à n'importe quel agent de la bonne équipe
// AGENT : s'auto-assigne, uniquement si la demande est de son équipe
router.patch('/:id/assign', requireRole('ADMIN', 'AGENT'), validate(assignSchema), async (req, res) => {
  const id = parseInt(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Identifiant invalide' });
  }

  const request = await prisma.request.findUnique({ where: { id } });
  if (!request) {
    return res.status(404).json({ error: 'Demande introuvable' });
  }

  // Pour un AGENT : auto-assignation forcée, et seulement sur une demande de son équipe
  let targetId;
  if (req.user.role === 'AGENT') {
    if (request.category !== req.user.team) {
      return res.status(403).json({ error: 'Cette demande ne concerne pas votre équipe' });
    }
    targetId = req.user.id;
  } else {
    // ADMIN : doit désigner un agent de l'équipe correspondant à la catégorie
    targetId = req.body.assignedToId;
    if (!targetId) {
      return res.status(400).json({ error: 'assignedToId est obligatoire' });
    }
    const agent = await prisma.user.findUnique({ where: { id: targetId } });
    if (!agent || agent.role !== 'AGENT' || agent.team !== request.category) {
      return res.status(400).json({
        error: `L'assigné doit être un AGENT de l'équipe ${request.category}`,
      });
    }
  }

  // Refuser de réassigner une demande déjà prise (évite les conflits entre admins)
  if (request.assignedToId && request.assignedToId !== targetId) {
    return res.status(409).json({ error: 'Cette demande est déjà assignée' });
  }

  const updated = await prisma.request.update({
    where: { id },
    data: { assignedToId: targetId },
    include: REQUEST_INCLUDE,
  });

  await logActivity(prisma, req.user.id, 'ASSIGN_REQUEST', 'request', id, {
    assignedToId: targetId,
  });

  res.json(withMeta(updated));
});

// Transitions de statut autorisées : le cycle de vie est contrôlé côté API
// OPEN → IN_PROGRESS | REJECTED ; IN_PROGRESS → RESOLVED | REJECTED ; RESOLVED → CLOSED
const ALLOWED_TRANSITIONS = {
  OPEN: ['IN_PROGRESS', 'REJECTED'],
  IN_PROGRESS: ['RESOLVED', 'REJECTED'],
  RESOLVED: ['CLOSED'],
  CLOSED: [],
  REJECTED: [],
};

// PATCH /api/requests/:id/status — changer le statut (AGENT de l'équipe ou ADMIN)
router.patch('/:id/status', requireRole('ADMIN', 'AGENT'), validate(statusSchema), async (req, res) => {
  const id = parseInt(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Identifiant invalide' });
  }

  const request = await prisma.request.findUnique({ where: { id } });
  if (!request) {
    return res.status(404).json({ error: 'Demande introuvable' });
  }
  if (req.user.role === 'AGENT' && request.category !== req.user.team) {
    return res.status(403).json({ error: 'Cette demande ne concerne pas votre équipe' });
  }

  const next = req.body.status;
  if (!ALLOWED_TRANSITIONS[request.status].includes(next)) {
    return res.status(400).json({
      error: `Transition impossible : ${request.status} → ${next}`,
      allowed: ALLOWED_TRANSITIONS[request.status],
    });
  }

  // Dates d'étape : resolvedAt fige le moment de la résolution (comparé au dueAt
  // pour le SLA), closedAt celui de la clôture
  const data = { status: next };
  if (next === 'RESOLVED') data.resolvedAt = new Date();
  if (next === 'CLOSED') data.closedAt = new Date();

  const updated = await prisma.request.update({ where: { id }, data, include: REQUEST_INCLUDE });

  await logActivity(prisma, req.user.id, 'UPDATE_REQUEST_STATUS', 'request', id, {
    from: request.status,
    to: next,
  });

  res.json(withMeta(updated));
});

// POST /api/requests/:id/comments — commenter (créateur, agent de l'équipe, admin)
router.post('/:id/comments', validate(commentSchema), async (req, res) => {
  const id = parseInt(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Identifiant invalide' });
  }

  const request = await prisma.request.findUnique({ where: { id } });
  if (!request || !canSee(request, req.user)) {
    return res.status(404).json({ error: 'Demande introuvable' });
  }

  const comment = await prisma.comment.create({
    data: { requestId: id, authorId: req.user.id, body: req.body.body },
    include: { author: { select: { id: true, name: true, role: true, team: true } } },
  });

  await logActivity(prisma, req.user.id, 'COMMENT_REQUEST', 'request', id);

  res.status(201).json(comment);
});

// GET /api/requests/:id/comments — le fil de commentaires
router.get('/:id/comments', async (req, res) => {
  const id = parseInt(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Identifiant invalide' });
  }

  const request = await prisma.request.findUnique({ where: { id } });
  if (!request || !canSee(request, req.user)) {
    return res.status(404).json({ error: 'Demande introuvable' });
  }

  const comments = await prisma.comment.findMany({
    where: { requestId: id },
    include: { author: { select: { id: true, name: true, role: true, team: true } } },
    orderBy: { createdAt: 'asc' },
  });

  res.json(comments);
});

module.exports = router;
