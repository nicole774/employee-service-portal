const prisma = require('./prisma');

// Enregistre une action dans le journal d'audit (exigence F9).
// On passe le client Prisma en paramètre : `prisma` en temps normal, `tx` à l'intérieur
// d'une transaction — comme ça, si la transaction est annulée, le log n'est pas écrit non plus.
async function logActivity(client, userId, action, entity, entityId, details) {
  return client.activityLog.create({
    data: { userId, action, entity, entityId, details },
  });
}

module.exports = { logActivity, prisma };
