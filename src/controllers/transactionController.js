const Transaction = require('../models/Transaction');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const { validationResult } = require('express-validator');

// @desc    Obtenir toutes les transactions
// @route   GET /api/transactions
// @access  Private/Admin
exports.getTransactions = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Obtenir une transaction par ID
// @route   GET /api/transactions/:id
// @access  Private
exports.getTransaction = asyncHandler(async (req, res, next) => {
  const transaction = await Transaction.findById(req.params.id)
    .populate({
      path: 'membreConcerne',
      select: 'nom prenom email telephone'
    })
    .populate({
      path: 'groupeConcerne',
      select: 'nom description'
    })
    .populate({
      path: 'creePar',
      select: 'nom prenom email'
    });

  if (!transaction) {
    return next(new ErrorResponse(`Transaction non trouvée avec l'id ${req.params.id}`, 404));
  }

  // Vérifier si l'utilisateur est autorisé à voir cette transaction
  if (
    (transaction.membreConcerne && transaction.membreConcerne._id.toString() !== req.user.id) && 
    transaction.creePar._id.toString() !== req.user.id && 
    req.user.role !== 'admin'
  ) {
    return next(new ErrorResponse(`L'utilisateur ${req.user.id} n'est pas autorisé à accéder à cette transaction`, 403));
  }

  res.status(200).json({
    success: true,
    data: transaction
  });
});

// @desc    Créer une nouvelle transaction
// @route   POST /api/transactions
// @access  Private/Admin
exports.createTransaction = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ErrorResponse('Erreur de validation', 400, errors.array()));
  }

  // Ajouter le créateur à la requête
  req.body.creePar = req.user.id;
  
  // Créer la transaction
  const transaction = await Transaction.create(req.body);

  res.status(201).json({
    success: true,
    data: transaction
  });
});

// @desc    Mettre à jour une transaction
// @route   PUT /api/transactions/:id
// @access  Private/Admin
exports.updateTransaction = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ErrorResponse('Erreur de validation', 400, errors.array()));
  }

  let transaction = await Transaction.findById(req.params.id);

  if (!transaction) {
    return next(new ErrorResponse(`Transaction non trouvée avec l'id ${req.params.id}`, 404));
  }

  // Vérifier si l'utilisateur est autorisé à mettre à jour cette transaction
  if (transaction.creePar.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`L'utilisateur ${req.user.id} n'est pas autorisé à mettre à jour cette transaction`, 403));
  }

  // Mettre à jour la transaction
  transaction = await Transaction.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: transaction
  });
});

// @desc    Supprimer une transaction
// @route   DELETE /api/transactions/:id
// @access  Private/Admin
exports.deleteTransaction = asyncHandler(async (req, res, next) => {
  const transaction = await Transaction.findById(req.params.id);

  if (!transaction) {
    return next(new ErrorResponse(`Transaction non trouvée avec l'id ${req.params.id}`, 404));
  }

  // Vérifier si l'utilisateur est autorisé à supprimer cette transaction
  if (transaction.creePar.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`L'utilisateur ${req.user.id} n'est pas autorisé à supprimer cette transaction`, 403));
  }

  // Supprimer la transaction
  await transaction.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Obtenir les transactions d'un membre
// @route   GET /api/transactions/membre/:membreId
// @access  Private
exports.getTransactionsByMembre = asyncHandler(async (req, res, next) => {
  const membreId = req.params.membreId;

  // Vérifier si l'utilisateur est autorisé à voir ces transactions
  if (membreId !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`L'utilisateur n'est pas autorisé à accéder aux transactions d'un autre membre`, 403));
  }

  const transactions = await Transaction.find({ membreConcerne: membreId })
    .sort('-date')
    .populate({
      path: 'groupeConcerne',
      select: 'nom description'
    });

  res.status(200).json({
    success: true,
    count: transactions.length,
    data: transactions
  });
});

// @desc    Obtenir les transactions d'un groupe
// @route   GET /api/transactions/groupe/:groupeId
// @access  Private
exports.getTransactionsByGroupe = asyncHandler(async (req, res, next) => {
  const groupeId = req.params.groupeId;

  const transactions = await Transaction.find({ groupeConcerne: groupeId })
    .sort('-date')
    .populate({
      path: 'membreConcerne',
      select: 'nom prenom email'
    })
    .populate({
      path: 'creePar',
      select: 'nom prenom email'
    });

  res.status(200).json({
    success: true,
    count: transactions.length,
    data: transactions
  });
});

// @desc    Générer un rapport financier
// @route   POST /api/transactions/report
// @access  Private/Admin
exports.generateFinancialReport = asyncHandler(async (req, res, next) => {
  // Seuls les administrateurs peuvent générer des rapports
  if (req.user.role !== 'admin') {
    return next(new ErrorResponse(`L'utilisateur n'est pas autorisé à générer des rapports`, 403));
  }

  const { dateDebut, dateFin, type, categorie } = req.body;
  
  // Construire le filtre
  const filter = {};
  
  if (dateDebut && dateFin) {
    filter.date = {
      $gte: new Date(dateDebut),
      $lte: new Date(dateFin)
    };
  } else if (dateDebut) {
    filter.date = { $gte: new Date(dateDebut) };
  } else if (dateFin) {
    filter.date = { $lte: new Date(dateFin) };
  }
  
  if (type) filter.type = type;
  if (categorie) filter.categorie = categorie;

  // Récupérer les transactions selon les filtres
  const transactions = await Transaction.find(filter)
    .populate({
      path: 'membreConcerne',
      select: 'nom prenom email'
    })
    .populate({
      path: 'groupeConcerne',
      select: 'nom description'
    })
    .populate({
      path: 'creePar',
      select: 'nom prenom email'
    });

  // Calculer les statistiques
  const totalTransactions = transactions.length;
  const totalEntrees = transactions
    .filter(t => t.type === 'Entrée')
    .reduce((acc, curr) => acc + curr.montant, 0);
  const totalSorties = transactions
    .filter(t => t.type === 'Sortie')
    .reduce((acc, curr) => acc + curr.montant, 0);
  const balance = totalEntrees - totalSorties;
  
  // Statistiques par catégorie
  const statsByCategorie = {};
  transactions.forEach(t => {
    if (!statsByCategorie[t.categorie]) {
      statsByCategorie[t.categorie] = {
        count: 0,
        totalMontant: 0
      };
    }
    statsByCategorie[t.categorie].count += 1;
    statsByCategorie[t.categorie].totalMontant += t.montant;
  });

  res.status(200).json({
    success: true,
    data: {
      transactions,
      stats: {
        totalTransactions,
        totalEntrees,
        totalSorties,
        balance,
        statsByCategorie
      }
    }
  });
});
