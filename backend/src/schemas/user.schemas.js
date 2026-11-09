const { z } = require('zod');

// Création de compte par l'ADMIN. Pas d'ADMIN ici : on ne crée pas de second admin
// par l'API (le seed en crée un), et pas d'inscription publique (portail interne).
const createUserSchema = z
  .object({
    email: z.email('Email invalide'),
    password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
    name: z.string().trim().min(2, 'Le nom doit contenir au moins 2 caractères'),
    role: z.enum(['EMPLOYEE', 'AGENT'], { message: 'Rôle invalide (EMPLOYEE ou AGENT)' }),
    team: z.enum(['IT', 'HR', 'FACILITY']).optional(),
  })
  .refine((data) => data.role !== 'AGENT' || data.team !== undefined, {
    message: 'Un agent doit avoir une équipe (IT, HR ou FACILITY)',
    path: ['team'],
  });

module.exports = { createUserSchema };
