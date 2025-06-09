const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  type: {
    type: String,
    required: [true, 'Veuillez spécifier le type de transaction'],
    enum: ['Entrée', 'Sortie']
  },
  montant: {
    type: Number,
    required: [true, 'Veuillez spécifier le montant'],
    min: [0, 'Le montant ne peut pas être négatif']
  },
  description: {
    type: String,
    required: [true, 'Veuillez ajouter une description'],
    maxlength: [200, 'La description ne peut pas dépasser 200 caractères']
  },
  date: {
    type: Date,
    default: Date.now
  },
  categorie: {
    type: String,
    required: [true, 'Veuillez spécifier une catégorie'],
    enum: ['Cotisation', 'Don', 'Dépense administrative', 'Événement', 'Autre']
  },
  cotisationLiee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cotisation'
  },
  membreConcerne: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  groupeConcerne: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Groupe'
  },
  creePar: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  pieceJustificative: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Transaction', TransactionSchema);
