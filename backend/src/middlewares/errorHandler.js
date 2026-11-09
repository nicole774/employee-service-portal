// Dernier middleware : reçoit toutes les erreurs non gérées des routes
function errorHandler(err, req, res, next) {
  // Erreur métier volontaire (ex. : stock insuffisant) : le message est fait pour le client
  if (err.statusCode) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  // Erreurs Prisma connues → réponses claires
  if (err.code === 'P2002') {
    return res.status(409).json({ error: 'Cette valeur existe déjà (champ unique)' });
  }
  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Ressource introuvable' });
  }
  if (err.code === 'P2003') {
    return res.status(409).json({ error: 'Action impossible : cet élément est utilisé ailleurs' });
  }

  // JSON mal formé envoyé par le client
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'JSON invalide' });
  }

  // Erreur inattendue : on la garde dans les logs, mais on ne montre aucun détail technique au client
  console.error(err);
  res.status(500).json({ error: 'Erreur interne du serveur' });
}

module.exports = errorHandler;
