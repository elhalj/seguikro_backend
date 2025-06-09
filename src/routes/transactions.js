const express = require("express");
const { check } = require("express-validator");
const {
  getTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getTransactionsByMembre,
  getTransactionsByGroupe,
  generateFinancialReport,
} = require("../controllers/transactionController");

const routerTransaction = express.Router();

// Middleware de protection des routes et restriction d'accès
const { protect, authorize } = require("../middleware/auth");
const advancedResults = require("../middleware/advancedResults");
const Transaction = require("../models/Transaction");

// Validation pour la création/mise à jour de transaction
const transactionValidation = [
  check("type", "Le type de transaction est requis").isIn(["Entrée", "Sortie"]),
  check("montant", "Le montant est requis et doit être un nombre").isNumeric(),
  check("description", "La description est requise").not().isEmpty(),
  check("categorie", "La catégorie est requise").not().isEmpty(),
];

// Routes pour les transactions
routerTransaction
  .route("/")
  .get(
    protect,
    authorize("admin"),
    advancedResults(Transaction, [
      { path: "membreConcerne", select: "nom prenom email telephone" },
      { path: "groupeConcerne", select: "nom description" },
      { path: "creePar", select: "nom prenom email" },
    ]),
    getTransactions
  )
  .post(protect, authorize("admin"), transactionValidation, createTransaction);

routerTransaction
  .route("/:id")
  .get(protect, getTransaction)
  .put(protect, authorize("admin"), transactionValidation, updateTransaction)
  .delete(protect, authorize("admin"), deleteTransaction);

routerTransaction
  .route("/membre/:membreId")
  .get(protect, getTransactionsByMembre);

routerTransaction
  .route("/groupe/:groupeId")
  .get(protect, getTransactionsByGroupe);

routerTransaction
  .route("/report")
  .post(protect, authorize("admin"), generateFinancialReport);

module.exports = routerTransaction;
