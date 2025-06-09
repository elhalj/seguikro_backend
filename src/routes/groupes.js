const express = require("express");
const { check } = require("express-validator");
const {
  getGroupes,
  getGroupe,
  createGroupe,
  updateGroupe,
  deleteGroupe,
  addMembreToGroupe,
  removeMembreFromGroupe,
  getGroupesByMembre,
} = require("../controllers/groupeController");

const routerGroupe = express.Router();

// Middleware de protection des routes et restriction d'accès
const { protect, authorize } = require("../middleware/auth");
const advancedResults = require("../middleware/advancedResults");
const Groupe = require("../models/Groupe");

// Validation pour la création/mise à jour de groupe
const groupeValidation = [
  check("nom", "Le nom du groupe est requis").not().isEmpty(),
  check("description", "La description est requise").not().isEmpty(),
  check(
    "montantCotisationMensuelle",
    "Le montant de la cotisation mensuelle est requis et doit être un nombre"
  ).isNumeric(),
];

// Routes pour les groupes
routerGroupe
  .route("/")
  .get(
    protect,
    advancedResults(Groupe, [
      { path: "responsable", select: "nom prenom email" },
      { path: "membres", select: "nom prenom email" },
    ]),
    getGroupes
  )
  .post(protect, authorize("admin"), groupeValidation, createGroupe);

routerGroupe
  .route("/:id")
  .get(protect, getGroupe)
  .put(protect, authorize("admin"), groupeValidation, updateGroupe)
  .delete(protect, authorize("admin"), deleteGroupe);

routerGroupe
  .route("/:id/membres/:userId")
  .put(protect, authorize("admin"), addMembreToGroupe)
  .delete(protect, removeMembreFromGroupe);

routerGroupe.route("/membre/:membreId").get(protect, getGroupesByMembre);

module.exports = routerGroupe;
