const { z } = require('zod');

// Pas de registerSchema : les comptes sont créés par l'ADMIN via /api/admin/users
const loginSchema = z.object({
  email: z.email('Email invalide'),
  password: z.string().min(1, 'Mot de passe obligatoire'),
});

module.exports = { loginSchema };
