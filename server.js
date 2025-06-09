const express = require("express");
const dotenv = require("dotenv");
const morgan = require("morgan");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { createClient } = require("redis");
const connectDB = require("./src/config/db");
const routerUser = require("./src/routes/auth");
const routerCotisation = require("./src/routes/cotisations");
const cookieParser = require("./src/middleware/cookieParser");
const routerGroupe = require("./src/routes/groupes");
const routerTransaction = require("./src/routes/transactions");

// Charger les variables d'environnement
dotenv.config();

// Connexion à la base de données
connectDB();

// Initialiser l'application Express
const app = express();

// Middleware pour le parsing du body
app.use(express.json());
app.use(cookieParser());

// Middleware pour les logs en développement
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Sécurité
app.use(helmet());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true, // <-- Autoriser l'envoi de cookies
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 100, // limite chaque IP à 100 requêtes par fenêtre
});
app.use(limiter);

// Initialiser Redis pour le cache
// let redisClient;
// (async () => {
//   try {
//     const client = createClient({
//       username: "default",
//       password: "QfCCaUENZTgH46yvCjgI6rNuq4dMNS0M",
//       socket: {
//         host: "redis-18778.c99.us-east-1-4.ec2.redns.redis-cloud.com",
//         port: 18778,
//       },
//     });

//     client.on("error", (err) => console.log("Redis Client Error", err.message));

//     await client.connect();

//     await client.set("foo", "bar");
//     const result = await client.get("foo");
//     console.log(result); // >>> bar
//   } catch (error) {
//     console.error(`Redis connection error: ${error}`);
//   }
// })();

// Route de base
app.get("/", (req, res) => {
  res.json({
    message:
      "Bienvenue sur l'API de Seguikro - Application de Cotisation Mensuelle",
  });
});

app.use("/api/auth", routerUser);
app.use("/api/cotisation", routerCotisation);
app.use("api/groupes", routerGroupe);
app.use("api/transactions", routerTransaction);

// Définir le port
const PORT = process.env.PORT || 5000;

// Démarrer le serveur
const server = app.listen(PORT, () => {
  console.log(
    `Serveur démarré en mode ${process.env.NODE_ENV} sur le port ${PORT}`
  );
});

// Gestion des erreurs non capturées
process.on("unhandledRejection", (err, promise) => {
  console.log(`Erreur: ${err.message}`);
  // Fermer le serveur et quitter le processus
  server.close(() => process.exit(1));
});
