const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const { logActivity } = require('../lib/logActivity');
const { authenticate } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { loginSchema } = require('../schemas/auth.schemas');
const router = express.Router();

// POST /api/auth/login — vérifie les identifiants et renvoie un JWT.
// Pas de /register : c'est un portail interne, les comptes sont créés par l'ADMIN
// (voir exigences §4 et décision D1).
router.post('/login', validate(loginSchema), async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });

  // Même message que l'email soit inconnu ou le mot de passe faux :
  // on ne révèle pas quels emails ont un compte (même logique que le projet 1)
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
  }

  // Le rôle et l'équipe voyagent dans le token : les routes pourront
  // vérifier l'équipe de l'agent sans retourner chercher en base
  const token = jwt.sign(
    { userId: user.id, role: user.role, team: user.team },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

  await logActivity(prisma, user.id, 'LOGIN', 'user', user.id);

  res.json({ token });
});

// GET /api/auth/me — renvoie l'utilisateur connecté
router.get('/me', authenticate, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, email: true, name: true, role: true, team: true },
  });
  res.json(user);
});

module.exports = router;
