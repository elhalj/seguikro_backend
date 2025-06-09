const mongoose = require('mongoose');

const GroupeSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: [true, 'Veuillez ajouter un nom pour le groupe'],
    unique: true,
    trim: true,
    maxlength: [100, 'Le nom ne peut pas dépasser 100 caractères']
  },
  description: {
    type: String,
    required: [true, 'Veuillez ajouter une description'],
    maxlength: [500, 'La description ne peut pas dépasser 500 caractères']
  },
  montantCotisationMensuelle: {
    type: Number,
    required: [true, 'Veuillez spécifier le montant de la cotisation mensuelle'],
    min: [0, 'Le montant ne peut pas être négatif']
  },
  dateCreation: {
    type: Date,
    default: Date.now
  },
  responsable: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Veuillez spécifier le responsable du groupe']
  },
  membres: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  actif: {
    type: Boolean,
    default: true
  },
  reglementation: {
    type: String,
    maxlength: [2000, 'La réglementation ne peut pas dépasser 2000 caractères']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Reverse populate avec virtuals
GroupeSchema.virtual('cotisationsGroupe', {
  ref: 'Cotisation',
  localField: 'membres',
  foreignField: 'membre',
  justOne: false
});

module.exports = mongoose.model('Groupe', GroupeSchema);
