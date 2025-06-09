# Seguikro Backend

## Description
Backend API pour l'application de cotisation mensuelle Seguikro. Cette API gère l'authentification, les cotisations, les groupes et les transactions.

## Structure du Projet

### Fichiers Principaux
- **server.js** - Point d'entrée de l'application qui configure Express, connecte à MongoDB, initialise Redis et démarre le serveur.
- **package.json** - Configuration du projet et dépendances.

### Répertoires

#### `/src/config`
Contient les fichiers de configuration pour la base de données et autres services.
- **db.js** - Configuration de la connexion à MongoDB.

#### `/src/controllers`
Contient la logique métier de l'application.
- **authController.js** - Gestion de l'authentification (inscription, connexion, etc.).
- **cotisationController.js** - Gestion des cotisations (création, mise à jour, suppression, etc.).
- **groupeController.js** - Gestion des groupes (création, mise à jour, suppression, etc.).
- **transactionController.js** - Gestion des transactions (création, mise à jour, suppression, etc.).

#### `/src/middleware` et `/src/middlewares`
Contient les middlewares pour l'authentification, la validation, etc.
- Middleware d'authentification pour protéger les routes.
- Middleware de validation pour valider les entrées utilisateur.

#### `/src/models`
Définit les schémas et modèles Mongoose pour la base de données.
- **User.js** - Modèle pour les utilisateurs avec champs comme nom, email, mot de passe, etc.
- **Cotisation.js** - Modèle pour les cotisations avec champs comme montant, date, statut, etc.
- **Groupe.js** - Modèle pour les groupes avec champs comme nom, description, membres, etc.
- **Transaction.js** - Modèle pour les transactions avec champs comme montant, date, type, etc.

#### `/src/routes`
Définit les routes de l'API.
- **auth.js** - Routes pour l'authentification (/api/auth/register, /api/auth/login, etc.).
- **cotisations.js** - Routes pour les cotisations (/api/cotisations).
- **groupes.js** - Routes pour les groupes (/api/groupes).
- **transactions.js** - Routes pour les transactions (/api/transactions).

#### `/src/utils`
Contient des utilitaires et fonctions d'aide.
- Fonctions pour générer des tokens JWT.
- Fonctions pour formater les réponses API.
- Autres utilitaires.

## Technologies Utilisées
- **Node.js** - Environnement d'exécution JavaScript côté serveur.
- **Express** - Framework web pour Node.js.
- **MongoDB** - Base de données NoSQL.
- **Mongoose** - ODM (Object Data Modeling) pour MongoDB.
- **Redis** - Stockage en cache pour améliorer les performances.
- **JWT** - JSON Web Tokens pour l'authentification.
- **bcryptjs** - Hachage des mots de passe.
- **express-validator** - Validation des entrées.
- **helmet** - Sécurité HTTP.
- **cors** - Cross-Origin Resource Sharing.
- **morgan** - Logging HTTP.
- **dotenv** - Gestion des variables d'environnement.

## Configuration
1. Créez un fichier `.env` à la racine du projet avec les variables suivantes:
   ```
   NODE_ENV=development
   PORT=5000
   MONGO_URI=votre_uri_mongodb
   JWT_SECRET=votre_secret_jwt
   JWT_EXPIRE=30d
   REDIS_URL=redis://localhost:6379
   ```

## Installation
```bash
# Installer les dépendances
npm install

# Démarrer en mode développement
npm run dev

# Démarrer en mode production
npm start
```

## Sécurité
L'API implémente plusieurs mesures de sécurité:
- Hachage des mots de passe avec bcryptjs.
- Authentification par JWT.
- Protection contre les attaques CSRF et XSS avec Helmet.
- Limitation de débit (rate limiting) pour prévenir les attaques par force brute.
- Validation des entrées avec express-validator.

## Endpoints API

### Authentification
- `POST /api/auth/register` - Inscription d'un nouvel utilisateur.
- `POST /api/auth/login` - Connexion d'un utilisateur.
- `GET /api/auth/me` - Récupérer les informations de l'utilisateur connecté.

### Cotisations
- `GET /api/cotisations` - Récupérer toutes les cotisations.
- `POST /api/cotisations` - Créer une nouvelle cotisation.
- `GET /api/cotisations/:id` - Récupérer une cotisation spécifique.
- `PUT /api/cotisations/:id` - Mettre à jour une cotisation.
- `DELETE /api/cotisations/:id` - Supprimer une cotisation.

### Groupes
- `GET /api/groupes` - Récupérer tous les groupes.
- `POST /api/groupes` - Créer un nouveau groupe.
- `GET /api/groupes/:id` - Récupérer un groupe spécifique.
- `PUT /api/groupes/:id` - Mettre à jour un groupe.
- `DELETE /api/groupes/:id` - Supprimer un groupe.

### Transactions
- `GET /api/transactions` - Récupérer toutes les transactions.
- `POST /api/transactions` - Créer une nouvelle transaction.
- `GET /api/transactions/:id` - Récupérer une transaction spécifique.
- `PUT /api/transactions/:id` - Mettre à jour une transaction.
- `DELETE /api/transactions/:id` - Supprimer une transaction.
