const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: [true, 'Veuillez ajouter un nom'],
    trim: true,
    maxlength: [50, 'Le nom ne peut pas dépasser 50 caractères']
  },
  prenom: {
    type: String,
    required: [true, 'Veuillez ajouter un prénom'],
    trim: true,
    maxlength: [50, 'Le prénom ne peut pas dépasser 50 caractères']
  },
  email: {
    type: String,
    required: [true, 'Veuillez ajouter un email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Veuillez ajouter un email valide'
    ]
  },
  telephone: {
    type: String,
    required: [true, 'Veuillez ajouter un numéro de téléphone'],
    match: [
      /^[0-9]{10,15}$/,
      'Veuillez ajouter un numéro de téléphone valide'
    ]
  },
  role: {
    type: String,
    enum: ['membre', 'admin', 'super-admin'],
    default: 'membre'
  },
  password: {
    type: String,
    required: [true, 'Veuillez ajouter un mot de passe'],
    minlength: 6,
    select: false
  },
  adresse: {
    type: String,
    required: [true, 'Veuillez ajouter une adresse']
  },
  dateInscription: {
    type: Date,
    default: Date.now
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Chiffrer le mot de passe avec bcrypt
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Signer le JWT et retourner
UserSchema.methods.getSignedJwtToken = function() {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// Comparer le mot de passe entré avec le mot de passe hashé dans la base de données
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Reverse populate avec virtuals
UserSchema.virtual('cotisations', {
  ref: 'Cotisation',
  localField: '_id',
  foreignField: 'membre',
  justOne: false
});

module.exports = mongoose.model('User', UserSchema);
