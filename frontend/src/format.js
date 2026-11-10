// Aides de formatage communes aux pages.
export function formatDate(value) {
  return new Date(value).toLocaleDateString('fr-FR')
}

export function formatDateTime(value) {
  return new Date(value).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
}

// Durée restante avant l'échéance (ou dépassement), lisible : « 2 h restantes », « 3 h de retard »
export function slaLabel(dueAt, overdue) {
  const diffMs = new Date(dueAt) - new Date()
  const hours = Math.round(Math.abs(diffMs) / 3600000)
  const minutes = Math.round((Math.abs(diffMs) % 3600000) / 60000)
  const duration = hours > 0 ? `${hours} h` : `${minutes} min`
  return overdue ? `${duration} de retard` : `${duration} restantes`
}

export const STATUS_LABELS = {
  OPEN: 'Ouverte',
  IN_PROGRESS: 'En cours',
  RESOLVED: 'Résolue',
  CLOSED: 'Clôturée',
  REJECTED: 'Refusée',
}

export const PRIORITY_LABELS = {
  URGENT: 'Urgente',
  HIGH: 'Haute',
  NORMAL: 'Normale',
  LOW: 'Basse',
}

export const CATEGORY_LABELS = {
  IT: 'Informatique',
  HR: 'RH',
  FACILITY: 'Locaux',
}

// Délais de service affichés à l'utilisateur : même source de vérité que le backend
export const SLA_HOURS = { URGENT: 4, HIGH: 8, NORMAL: 24, LOW: 72 }
