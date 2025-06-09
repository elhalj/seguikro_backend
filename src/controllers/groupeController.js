const Groupe = require('../models/Groupe');
const User = require('../models/User');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const { validationResult } = require('express-validator');

// @desc    Obtenir tous les groupes
// @route   GET /api/groupes
// @access  Private/Admin
exports.getGroupes = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Obtenir un groupe par ID
// @route   GET /api/groupes/:id
// @access  Private
exports.getGroupe = asyncHandler(async (req, res, next) => {
  const groupe = await Groupe.findById(req.params.id).populate({
    path: 'membres',
    select: 'nom prenom email telephone'
  }).populate({
    path: 'responsable',
    select: 'nom prenom email telephone'
  });

  if (!groupe) {
    return next(new ErrorResponse(`Groupe non trouvé avec l'id ${req.params.id}`, 404));
  }

  // Vérifier si l'utilisateur est membre du groupe ou admin
  if (!groupe.membres.some(membre => membre._id.toString() === req.user.id) && 
      groupe.responsable._id.toString() !== req.user.id && 
      req.user.role !== 'admin') {
    return next(new ErrorResponse(`L'utilisateur ${req.user.id} n'est pas autorisé à accéder à ce groupe`, 403));
  }

  res.status(200).json({
    success: true,
    data: groupe
  });
});

// @desc    Créer un nouveau groupe
// @route   POST /api/groupes
// @access  Private/Admin
exports.createGroupe = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ErrorResponse('Erreur de validation', 400, errors.array()));
  }

  // Ajouter le créateur comme responsable
  req.body.responsable = req.user.id;
  
  // Vérifier si le groupe existe déjà
  const existingGroupe = await Groupe.findOne({ nom: req.body.nom });
  if (existingGroupe) {
    return next(new ErrorResponse(`Un groupe avec le nom ${req.body.nom} existe déjà`, 400));
  }

  // Créer le groupe
  const groupe = await Groupe.create(req.body);

  // Ajouter le responsable aux membres
  if (!groupe.membres.includes(req.user.id)) {
    groupe.membres.push(req.user.id);
    await groupe.save();
  }

  res.status(201).json({
    success: true,
    data: groupe
  });
});

// @desc    Mettre à jour un groupe
// @route   PUT /api/groupes/:id
// @access  Private/Admin
exports.updateGroupe = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ErrorResponse('Erreur de validation', 400, errors.array()));
  }

  let groupe = await Groupe.findById(req.params.id);

  if (!groupe) {
    return next(new ErrorResponse(`Groupe non trouvé avec l'id ${req.params.id}`, 404));
  }

  // Vérifier si l'utilisateur est autorisé à mettre à jour ce groupe
  if (groupe.responsable.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`L'utilisateur ${req.user.id} n'est pas autorisé à mettre à jour ce groupe`, 403));
  }

  // Mettre à jour le groupe
  groupe = await Groupe.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: groupe
  });
});

// @desc    Supprimer un groupe
// @route   DELETE /api/groupes/:id
// @access  Private/Admin
exports.deleteGroupe = asyncHandler(async (req, res, next) => {
  const groupe = await Groupe.findById(req.params.id);

  if (!groupe) {
    return next(new ErrorResponse(`Groupe non trouvé avec l'id ${req.params.id}`, 404));
  }

  // Vérifier si l'utilisateur est autorisé à supprimer ce groupe
  if (groupe.responsable.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`L'utilisateur ${req.user.id} n'est pas autorisé à supprimer ce groupe`, 403));
  }

  // Supprimer le groupe
  await groupe.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Ajouter un membre au groupe
// @route   PUT /api/groupes/:id/membres/:userId
// @access  Private/Admin
exports.addMembreToGroupe = asyncHandler(async (req, res, next) => {
  const groupe = await Groupe.findById(req.params.id);
  const user = await User.findById(req.params.userId);

  if (!groupe) {
    return next(new ErrorResponse(`Groupe non trouvé avec l'id ${req.params.id}`, 404));
  }

  if (!user) {
    return next(new ErrorResponse(`Utilisateur non trouvé avec l'id ${req.params.userId}`, 404));
  }

  // Vérifier si l'utilisateur est autorisé à ajouter un membre
  if (groupe.responsable.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`L'utilisateur ${req.user.id} n'est pas autorisé à ajouter des membres à ce groupe`, 403));
  }

  // Vérifier si l'utilisateur est déjà membre du groupe
  if (groupe.membres.includes(req.params.userId)) {
    return next(new ErrorResponse(`L'utilisateur ${req.params.userId} est déjà membre de ce groupe`, 400));
  }

  // Ajouter l'utilisateur au groupe
  groupe.membres.push(req.params.userId);
  await groupe.save();

  res.status(200).json({
    success: true,
    data: groupe
  });
});

// @desc    Retirer un membre du groupe
// @route   DELETE /api/groupes/:id/membres/:userId
// @access  Private/Admin
exports.removeMembreFromGroupe = asyncHandler(async (req, res, next) => {
  const groupe = await Groupe.findById(req.params.id);

  if (!groupe) {
    return next(new ErrorResponse(`Groupe non trouvé avec l'id ${req.params.id}`, 404));
  }

  // Vérifier si l'utilisateur est autorisé à retirer un membre
  if (groupe.responsable.toString() !== req.user.id && 
      req.user.role !== 'admin' && 
      req.params.userId !== req.user.id) {
    return next(new ErrorResponse(`L'utilisateur ${req.user.id} n'est pas autorisé à retirer des membres de ce groupe`, 403));
  }

  // Vérifier si l'utilisateur est le responsable du groupe
  if (groupe.responsable.toString() === req.params.userId) {
    return next(new ErrorResponse(`Impossible de retirer le responsable du groupe`, 400));
  }

  // Vérifier si l'utilisateur est membre du groupe
  if (!groupe.membres.includes(req.params.userId)) {
    return next(new ErrorResponse(`L'utilisateur ${req.params.userId} n'est pas membre de ce groupe`, 400));
  }

  // Retirer l'utilisateur du groupe
  groupe.membres = groupe.membres.filter(
    membre => membre.toString() !== req.params.userId
  );
  
  await groupe.save();

  res.status(200).json({
    success: true,
    data: groupe
  });
});

// @desc    Obtenir les groupes d'un membre
// @route   GET /api/groupes/membre/:membreId
// @access  Private
exports.getGroupesByMembre = asyncHandler(async (req, res, next) => {
  const membreId = req.params.membreId;

  // Vérifier si l'utilisateur est autorisé à voir ces groupes
  if (membreId !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`L'utilisateur n'est pas autorisé à accéder aux groupes d'un autre membre`, 403));
  }

  const groupes = await Groupe.find({ membres: membreId }).populate({
    path: 'responsable',
    select: 'nom prenom email'
  });

  res.status(200).json({
    success: true,
    count: groupes.length,
    data: groupes
  });
});
