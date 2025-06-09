const mongoose = require('mongoose');

const CotisationSchema = new mongoose.Schema({
  membre: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  montant: {
    type: Number,
    required: [true, 'Veuillez ajouter un montant'],
    min: [0, 'Le montant ne peut pas être négatif']
  },
  mois: {
    type: String,
    required: [true, 'Veuillez spécifier le mois de la cotisation'],
    enum: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
  },
  annee: {
    type: Number,
    required: [true, 'Veuillez spécifier l\'année de la cotisation'],
    min: [2000, 'L\'année doit être valide'],
    max: [2100, 'L\'année doit être valide']
  },
  datePaiement: {
    type: Date,
    default: Date.now
  },
  methodePaiement: {
    type: String,
    required: [true, 'Veuillez spécifier la méthode de paiement'],
    enum: ['Espèces', 'Chèque', 'Virement', 'Mobile Money', 'Autre']
  },
  referencePaiement: {
    type: String
  },
  statut: {
    type: String,
    enum: ['En attente', 'Confirmé', 'Rejeté'],
    default: 'En attente'
  },
  commentaire: {
    type: String
  }
}, {
  timestamps: true
});

// Créer un index composé unique pour éviter les doublons de cotisation pour un membre dans un mois/année spécifique
CotisationSchema.index({ membre: 1, mois: 1, annee: 1 }, { unique: true });

module.exports = mongoose.model('Cotisation', CotisationSchema);
