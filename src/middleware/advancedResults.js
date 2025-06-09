// Middleware pour gérer les résultats avancés (pagination, filtrage, tri)
const advancedResults = (model, populate) => async (req, res, next) => {
  let query;

  // Copie de req.query
  const reqQuery = { ...req.query };

  // Champs à exclure
  const removeFields = ['select', 'sort', 'page', 'limit'];

  // Supprimer les champs à exclure de reqQuery
  removeFields.forEach(param => delete reqQuery[param]);

  // Créer une chaîne de requête
  let queryStr = JSON.stringify(reqQuery);

  // Créer les opérateurs ($gt, $gte, etc.)
  queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

  // Trouver les ressources
  query = model.find(JSON.parse(queryStr));

  // Sélection des champs
  if (req.query.select) {
    const fields = req.query.select.split(',').join(' ');
    query = query.select(fields);
  }

  // Tri
  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
    query = query.sort('-createdAt');
  }

  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await model.countDocuments(JSON.parse(queryStr));

  query = query.skip(startIndex).limit(limit);

  // Population
  if (populate) {
    if (Array.isArray(populate)) {
      populate.forEach(item => {
        query = query.populate(item);
      });
    } else {
      query = query.populate(populate);
    }
  }

  // Exécution de la requête
  const results = await query;

  // Pagination result
  const pagination = {};

  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit
    };
  }

  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit
    };
  }

  res.advancedResults = {
    success: true,
    count: results.length,
    pagination,
    data: results
  };

  next();
};

module.exports = advancedResults;
