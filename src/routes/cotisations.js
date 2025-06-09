const express = require("express");
const { check } = require("express-validator");
const {
  getCotisations,
  getCotisation,
  createCotisation,
  updateCotisation,
  updateCotisationStatus,
  deleteCotisation,
  getCotisationsByMembre,
  getCotisationsByPeriode,
  generateReport,
} = require("../controllers/cotisationController");

const routerCotisation = express.Router();

// Middleware de protection des routes et restriction d'accès
const { protect, authorize } = require("../middleware/auth");
const advancedResults = require("../middleware/advancedResults");
const Cotisation = require("../models/Cotisation");

// Validation pour la création/mise à jour de cotisation
const cotisationValidation = [
  check("mois", "Le mois est requis").not().isEmpty(),
  check("annee", "L'année est requise").isNumeric(),
  check("montant", "Le montant est requis et doit être un nombre").isNumeric(),
  check("methodePaiement", "La méthode de paiement est requise")
    .not()
    .isEmpty(),
];

// Routes pour les cotisations
routerCotisation
  .route("/")
  .get(
    protect,
    authorize("admin"),
    advancedResults(Cotisation, {
      path: "membre",
      select: "nom prenom email telephone",
    }),
    getCotisations
  )
  .post(protect, cotisationValidation, createCotisation);

routerCotisation
  .route("/:id")
  .get(protect, getCotisation)
  .put(protect, cotisationValidation, updateCotisation)
  .delete(protect, deleteCotisation);

routerCotisation
  .route("/:id/status")
  .patch(protect, authorize("admin"), updateCotisationStatus);

routerCotisation
  .route("/membre/:membreId")
  .get(protect, getCotisationsByMembre);

routerCotisation
  .route("/periode/:mois/:annee")
  .get(protect, authorize("admin"), getCotisationsByPeriode);

routerCotisation
  .route("/report")
  .post(protect, authorize("admin"), generateReport);

module.exports = routerCotisation;
