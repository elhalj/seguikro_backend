const User = require("../models/User");
const asyncHandler = require("../middleware/async");
const ErrorResponse = require("../utils/errorResponse");
const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");
const genererToken = require("../middleware/generatedToken");

// @desc    Inscrire un utilisateur
// @route   POST /api/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ErrorResponse("Erreur de validation", 400, errors.array()));
  }

  const { nom, prenom, email, password, telephone, adresse } = req.body;

  // Vérifier si l'utilisateur existe déjà
  let user = await User.findOne({ email });
  if (user) {
    return next(new ErrorResponse("Cet email est déjà utilisé", 400));
  }

  // Créer un nouvel utilisateur
  user = await User.create({
    nom,
    prenom,
    email,
    password,
    telephone,
    adresse,
    role: "membre", // Par défaut, tous les nouveaux utilisateurs sont des membres
  });

  const token = genererToken(user, 201);
  res.status(201).json({user, token});
});

// @desc    Connecter un utilisateur
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ErrorResponse("Erreur de validation", 400, errors.array()));
  }

  const { email, password } = req.body;

  // Vérifier si l'email et le mot de passe sont fournis
  if (!email || !password) {
    return next(
      new ErrorResponse("Veuillez fournir un email et un mot de passe", 400)
    );
  }

  // Vérifier si l'utilisateur existe
  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    return next(new ErrorResponse("Identifiants invalides", 401));
  }

  // Vérifier si le mot de passe correspond
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    return next(new ErrorResponse("Identifiants invalides", 401));
  }

  const token = genererToken(user, 201);
  res.status(201).json({user, token});
});

// @desc    Déconnecter un utilisateur / effacer le cookie
// @route   GET /api/auth/logout
// @access  Private
exports.logout = asyncHandler(async (req, res, next) => {
  res.cookie("token", "none", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    data: {},
  });
});

// @desc    Obtenir l'utilisateur actuellement connecté
// @route   GET /api/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc    Mettre à jour les informations de l'utilisateur
// @route   PUT /api/auth/updatedetails
// @access  Private
exports.updateDetails = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ErrorResponse("Erreur de validation", 400, errors.array()));
  }

  const fieldsToUpdate = {
    nom: req.body.nom,
    prenom: req.body.prenom,
    telephone: req.body.telephone,
    adresse: req.body.adresse,
  };

  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc    Mettre à jour le mot de passe
// @route   PUT /api/auth/updatepassword
// @access  Private
exports.updatePassword = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ErrorResponse("Erreur de validation", 400, errors.array()));
  }

  const user = await User.findById(req.user.id).select("+password");

  // Vérifier le mot de passe actuel
  if (!(await user.matchPassword(req.body.currentPassword))) {
    return next(new ErrorResponse("Mot de passe actuel incorrect", 401));
  }

  user.password = req.body.newPassword;
  await user.save();

  genererToken(user, 200, res);
});

// @desc    Demander la réinitialisation du mot de passe
// @route   POST /api/auth/forgotpassword
// @access  Public
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new ErrorResponse("Aucun utilisateur avec cet email", 404));
  }

  // Obtenir le token de réinitialisation
  const resetToken = user.getResetPasswordToken();

  await user.save({ validateBeforeSave: false });

  // Créer l'URL de réinitialisation
  const resetUrl = `${req.protocol}://${req.get(
    "host"
  )}/api/auth/resetpassword/${resetToken}`;

  // Dans une application réelle, vous enverriez un email avec ce lien
  // Pour ce projet, nous allons simplement renvoyer le token

  res.status(200).json({
    success: true,
    data: {
      resetToken,
      resetUrl,
    },
  });
});

// @desc    Réinitialiser le mot de passe
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
exports.resetPassword = asyncHandler(async (req, res, next) => {
  // Obtenir le token hashé
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.resettoken)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return next(new ErrorResponse("Token invalide", 400));
  }

  // Définir le nouveau mot de passe
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  genererToken(user, 200, res);
});
