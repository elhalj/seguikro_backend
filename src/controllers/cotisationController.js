const Cotisation = require('../models/Cotisation');
const User = require('../models/User');
const Groupe = require('../models/Groupe');
const Transaction = require('../models/Transaction');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const { validationResult } = require('express-validator');

// @desc    Obtenir toutes les cotisations
// @route   GET /api/cotisations
// @access  Private/Admin
exports.getCotisations = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Obtenir une cotisation par ID
// @route   GET /api/cotisations/:id
// @access  Private
exports.getCotisation = asyncHandler(async (req, res, next) => {
  const cotisation = await Cotisation.findById(req.params.id).populate({
    path: 'membre',
    select: 'nom prenom email telephone'
  });

  if (!cotisation) {
    return next(new ErrorResponse(`Cotisation non trouvée avec l'id ${req.params.id}`, 404));
  }

  // Vérifier si l'utilisateur est autorisé à voir cette cotisation
  if (cotisation.membre._id.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`L'utilisateur ${req.user.id} n'est pas autorisé à accéder à cette cotisation`, 403));
  }

  res.status(200).json({
    success: true,
    data: cotisation
  });
});

// @desc    Créer une nouvelle cotisation
// @route   POST /api/cotisations
// @access  Private
exports.createCotisation = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ErrorResponse('Erreur de validation', 400, errors.array()));
  }

  // Ajouter l'utilisateur à la requête
  req.body.membre = req.user.id;
  
  // Vérifier si une cotisation existe déjà pour ce mois/année
  const existingCotisation = await Cotisation.findOne({
    membre: req.user.id,
    mois: req.body.mois,
    annee: req.body.annee
  });

  if (existingCotisation) {
    return next(new ErrorResponse(`Vous avez déjà une cotisation pour ${req.body.mois} ${req.body.annee}`, 400));
  }

  // Créer la cotisation
  const cotisation = await Cotisation.create(req.body);

  // Créer une transaction associée
  await Transaction.create({
    type: 'Entrée',
    montant: req.body.montant,
    description: `Cotisation de ${req.user.nom} ${req.user.prenom} pour ${req.body.mois} ${req.body.annee}`,
    categorie: 'Cotisation',
    cotisation: cotisation._id,
    membre: req.user.id,
    createur: req.user.id
  });

  res.status(201).json({
    success: true,
    data: cotisation
  });
});

// @desc    Mettre à jour une cotisation
// @route   PUT /api/cotisations/:id
// @access  Private
exports.updateCotisation = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ErrorResponse('Erreur de validation', 400, errors.array()));
  }

  let cotisation = await Cotisation.findById(req.params.id);

  if (!cotisation) {
    return next(new ErrorResponse(`Cotisation non trouvée avec l'id ${req.params.id}`, 404));
  }

  // Vérifier si l'utilisateur est autorisé à mettre à jour cette cotisation
  if (cotisation.membre.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`L'utilisateur ${req.user.id} n'est pas autorisé à mettre à jour cette cotisation`, 403));
  }

  // Vérifier si la cotisation est en attente
  if (cotisation.statut !== 'En attente') {
    return next(new ErrorResponse(`Seules les cotisations en attente peuvent être modifiées`, 400));
  }

  // Mettre à jour la cotisation
  cotisation = await Cotisation.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  // Mettre à jour la transaction associée si le montant a changé
  if (req.body.montant && req.body.montant !== cotisation.montant) {
    await Transaction.findOneAndUpdate(
      { cotisation: cotisation._id },
      { 
        montant: req.body.montant,
        description: `Cotisation de ${req.user.nom} ${req.user.prenom} pour ${cotisation.mois} ${cotisation.annee}`
      },
      { new: true }
    );
  }

  res.status(200).json({
    success: true,
    data: cotisation
  });
});

// @desc    Mettre à jour le statut d'une cotisation
// @route   PATCH /api/cotisations/:id/status
// @access  Private/Admin
exports.updateCotisationStatus = asyncHandler(async (req, res, next) => {
  const { statut } = req.body;

  if (!statut || !['En attente', 'Confirmé', 'Rejeté'].includes(statut)) {
    return next(new ErrorResponse('Veuillez fournir un statut valide', 400));
  }

  let cotisation = await Cotisation.findById(req.params.id);

  if (!cotisation) {
    return next(new ErrorResponse(`Cotisation non trouvée avec l'id ${req.params.id}`, 404));
  }

  // Seuls les administrateurs peuvent changer le statut
  if (req.user.role !== 'admin') {
    return next(new ErrorResponse(`L'utilisateur n'est pas autorisé à changer le statut des cotisations`, 403));
  }

  // Mettre à jour le statut
  cotisation = await Cotisation.findByIdAndUpdate(
    req.params.id,
    { statut },
    { new: true, runValidators: true }
  );

  // Mettre à jour la transaction associée
  const transaction = await Transaction.findOne({ cotisation: cotisation._id });
  if (transaction) {
    if (statut === 'Confirmé') {
      transaction.statut = 'Complété';
    } else if (statut === 'Rejeté') {
      transaction.statut = 'Annulé';
    } else {
      transaction.statut = 'En attente';
    }
    await transaction.save();
  }

  res.status(200).json({
    success: true,
    data: cotisation
  });
});

// @desc    Supprimer une cotisation
// @route   DELETE /api/cotisations/:id
// @access  Private
exports.deleteCotisation = asyncHandler(async (req, res, next) => {
  const cotisation = await Cotisation.findById(req.params.id);

  if (!cotisation) {
    return next(new ErrorResponse(`Cotisation non trouvée avec l'id ${req.params.id}`, 404));
  }

  // Vérifier si l'utilisateur est autorisé à supprimer cette cotisation
  if (cotisation.membre.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`L'utilisateur ${req.user.id} n'est pas autorisé à supprimer cette cotisation`, 403));
  }

  // Vérifier si la cotisation est en attente ou si l'utilisateur est admin
  if (cotisation.statut !== 'En attente' && req.user.role !== 'admin') {
    return next(new ErrorResponse(`Seules les cotisations en attente peuvent être supprimées`, 400));
  }

  // Supprimer la transaction associée
  await Transaction.findOneAndDelete({ cotisation: cotisation._id });

  // Supprimer la cotisation
  await cotisation.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Obtenir les cotisations d'un membre
// @route   GET /api/cotisations/membre/:membreId
// @access  Private
exports.getCotisationsByMembre = asyncHandler(async (req, res, next) => {
  const membreId = req.params.membreId;

  // Vérifier si l'utilisateur est autorisé à voir ces cotisations
  if (membreId !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`L'utilisateur n'est pas autorisé à accéder aux cotisations d'un autre membre`, 403));
  }

  const cotisations = await Cotisation.find({ membre: membreId }).sort('-annee -mois');

  res.status(200).json({
    success: true,
    count: cotisations.length,
    data: cotisations
  });
});

// @desc    Obtenir les cotisations par période (mois/année)
// @route   GET /api/cotisations/periode/:mois/:annee
// @access  Private/Admin
exports.getCotisationsByPeriode = asyncHandler(async (req, res, next) => {
  const { mois, annee } = req.params;

  // Seuls les administrateurs peuvent voir toutes les cotisations par période
  if (req.user.role !== 'admin') {
    return next(new ErrorResponse(`L'utilisateur n'est pas autorisé à accéder à cette ressource`, 403));
  }

  const cotisations = await Cotisation.find({
    mois,
    annee: parseInt(annee)
  }).populate({
    path: 'membre',
    select: 'nom prenom email telephone'
  });

  res.status(200).json({
    success: true,
    count: cotisations.length,
    data: cotisations
  });
});

// @desc    Générer un rapport de cotisations
// @route   POST /api/cotisations/report
// @access  Private/Admin
exports.generateReport = asyncHandler(async (req, res, next) => {
  // Seuls les administrateurs peuvent générer des rapports
  if (req.user.role !== 'admin') {
    return next(new ErrorResponse(`L'utilisateur n'est pas autorisé à générer des rapports`, 403));
  }

  const { mois, annee, statut } = req.body;
  
  // Construire le filtre
  const filter = {};
  if (mois) filter.mois = mois;
  if (annee) filter.annee = parseInt(annee);
  if (statut) filter.statut = statut;

  // Récupérer les cotisations selon les filtres
  const cotisations = await Cotisation.find(filter).populate({
    path: 'membre',
    select: 'nom prenom email telephone'
  });

  // Calculer les statistiques
  const totalCotisations = cotisations.length;
  const totalMontant = cotisations.reduce((acc, curr) => acc + curr.montant, 0);
  const cotisationsConfirmees = cotisations.filter(c => c.statut === 'Confirmé').length;
  const cotisationsEnAttente = cotisations.filter(c => c.statut === 'En attente').length;
  const cotisationsRejetees = cotisations.filter(c => c.statut === 'Rejeté').length;

  res.status(200).json({
    success: true,
    data: {
      cotisations,
      stats: {
        totalCotisations,
        totalMontant,
        cotisationsConfirmees,
        cotisationsEnAttente,
        cotisationsRejetees
      }
    }
  });
});
