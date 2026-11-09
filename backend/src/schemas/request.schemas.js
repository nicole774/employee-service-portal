const { z } = require('zod');

const createRequestSchema = z.object({
  title: z.string().trim().min(3, 'Le titre doit contenir au moins 3 caractères').max(100),
  description: z.string().trim().min(5, 'La description doit contenir au moins 5 caractères').max(1000),
  category: z.enum(['IT', 'HR', 'FACILITY'], { message: 'Catégorie invalide (IT, HR ou FACILITY)' }),
  priority: z.enum(['URGENT', 'HIGH', 'NORMAL', 'LOW']).default('NORMAL'),
});

const statusSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED'], {
    message: 'Statut invalide',
  }),
});

// L'assignation par l'ADMIN vise un agent ; l'auto-assignation d'un agent n'a pas de corps
const assignSchema = z.object({
  assignedToId: z.coerce.number().int().positive('assignedToId invalide').optional(),
});

const commentSchema = z.object({
  body: z.string().trim().min(1, 'Le commentaire ne peut pas être vide').max(500),
});

module.exports = { createRequestSchema, statusSchema, assignSchema, commentSchema };
