// Vérifie req.body avec un schéma zod ; en cas d'erreur, répond 400 avec la liste des problèmes
function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        error: 'Données invalides',
        details: result.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }

    // On remplace le body par la version validée (ex. : nom sans espaces autour)
    req.body = result.data;
    next();
  };
}

module.exports = validate;
