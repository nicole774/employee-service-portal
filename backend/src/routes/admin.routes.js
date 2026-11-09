const express = require('express');
const bcrypt = require('bcrypt');
const prisma = require('../lib/prisma');
const { logActivity } = require('../lib/logActivity');
const { authenticate, requireRole } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { createUserSchema } = require('../schemas/user.schemas');
const { isOverdue } = require('../lib/sla');
const router = express.Router();

// Tout ce qui suit est réservé à l'ADMIN
router.use(authenticate, requireRole('ADMIN'));

// GET /api/admin/dashboard — indicateurs de pilotage (exigence F9)
router.get('/dashboard', async (req, res) => {
  // 1. Volumes par statut
  const byStatus = await prisma.request.groupBy({ by: ['status'], _count: { _all: true } });

  // 2. Charge par équipe : demandes ouvertes ou en cours, par catégorie
  const byTeam = await prisma.request.groupBy({
    by: ['category'],
    where: { status: { in: ['OPEN', 'IN_PROGRESS'] } },
    _count: { _all: true },
  });

  // 3. Taux de respect des SLA : parmi les demandes résolues ou clôturées,
  //    celles dont la résolution est arrivée avant l'échéance.
  //    Prisma ne sait pas comparer deux colonnes entre elles (resolvedAt vs dueAt),
  //    donc on récupère les dates et on calcule en JS.
  const resolved = await prisma.request.findMany({
    where: { resolvedAt: { not: null } },
    select: { dueAt: true, resolvedAt: true },
  });
  const inTime = resolved.filter((r) => r.resolvedAt <= r.dueAt).length;

  // 4. Les demandes actuellement en retard
  const now = new Date();
  const overdueRequests = await prisma.request.findMany({
    where: { status: { in: ['OPEN', 'IN_PROGRESS'] }, dueAt: { lt: now } },
    include: { createdBy: { select: { id: true, name: true } }, assignedTo: { select: { id: true, name: true, team: true } } },
    orderBy: { dueAt: 'asc' },
    take: 20,
  });

  res.json({
    byStatus: byStatus.map((s) => ({ status: s.status, count: s._count._all })),
    byTeam: byTeam.map((t) => ({ team: t.category, count: t._count._all })),
    sla: {
      resolved: resolved.length,
      resolvedInTime: inTime,
      rate: resolved.length === 0 ? null : Math.round((inTime / resolved.length) * 100),
    },
    overdue: overdueRequests.map((r) => ({ ...r, overdue: isOverdue(r, now) })),
  });
});

// GET /api/admin/users — liste des comptes
router.get('/users', async (req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true, team: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });
  res.json(users);
});

// POST /api/admin/users — créer un compte (EMPLOYEE ou AGENT, exigence F1)
router.post('/users', validate(createUserSchema), async (req, res) => {
  const { email, password, name, role, team } = req.body;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: 'Cet email est déjà utilisé' });
  }

  const user = await prisma.user.create({
    data: { email, name, role, team, passwordHash: await bcrypt.hash(password, 10) },
    select: { id: true, email: true, name: true, role: true, team: true },
  });

  await logActivity(prisma, req.user.id, 'CREATE_USER', 'user', user.id, { role, team });

  res.status(201).json(user);
});

// GET /api/admin/audit-logs — journal d'activité (exigence F10, CT-09)
// Filtres : ?userId=&action=&email=&page=&limit=
router.get('/audit-logs', async (req, res) => {
  const where = {};

  if (req.query.userId) {
    const userId = parseInt(req.query.userId);
    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({ error: 'userId invalide' });
    }
    where.userId = userId;
  }
  if (req.query.action) {
    where.action = String(req.query.action);
  }
  if (req.query.email) {
    where.user = { email: { contains: String(req.query.email), mode: 'insensitive' } };
  }

  const limit = Math.min(100, parseInt(req.query.limit) || 50);
  const page = Math.max(1, parseInt(req.query.page) || 1);

  const logs = await prisma.activityLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit,
    include: { user: { select: { id: true, email: true, name: true } } },
  });

  res.json(logs);
});

module.exports = router;
