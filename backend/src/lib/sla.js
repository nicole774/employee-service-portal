// Délais de service (SLA) par priorité, en heures.
// Source unique de vérité : le seed et les routes l'importent tous les deux.
const SLA_HOURS = {
  URGENT: 4,
  HIGH: 8,
  NORMAL: 24,
  LOW: 72,
};

// Calcule l'échéance d'une demande : date de création + délai de sa priorité
function computeDueAt(priority, createdAt = new Date()) {
  const hours = SLA_HOURS[priority];
  if (!hours) {
    throw new Error(`Priorité inconnue : ${priority}`);
  }
  return new Date(createdAt.getTime() + hours * 3600 * 1000);
}

// Une demande est « en retard » si elle n'est pas terminée et que l'échéance est passée.
// Le retard est TOUJOURS calculé à la volée, jamais stocké : même si la base tourne
// plusieurs jours, l'indicateur ne peut pas diverger de la réalité (décision à documenter).
function isOverdue(request, now = new Date()) {
  const finished = ['RESOLVED', 'CLOSED', 'REJECTED'].includes(request.status);
  return !finished && request.dueAt < now;
}

module.exports = { SLA_HOURS, computeDueAt, isOverdue };
