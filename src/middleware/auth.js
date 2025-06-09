const jwt = require("jsonwebtoken");
const asyncHandler = require("./async");
const ErrorResponse = require("../utils/errorResponse");
const User = require("../models/User");

// Protéger les routes
exports.protect = asyncHandler(async (req, res, next) => {
  let token;

  // Vérifier si le token est dans les headers Authorization
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    // Extraire le token du header Bearer
    token = req.headers.authorization.split(" ")[1];
  }
  // Vérifier si le token est dans les cookies
  else if (typeof req.cookies.token !== "undefined" && req.cookies.token !== null) {
    // Extraire le token des cookies
    token = req.cookies.token;
  }

  // Vérifier si le token existe
  if (!token) {
    return next(new ErrorResponse("Non autorisé à accéder à cette route", 401));
  }

  try {
    // Vérifier le token
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Ajouter l'utilisateur à la requête
    req.user = await User.findById(decoded.user.id);
    next();
  } catch (err) {
    return next(new ErrorResponse("Non autorisé à accéder à cette route", 401));
  }
});

// Autoriser certains rôles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorResponse(
          `Le rôle ${req.user.role} n'est pas autorisé à accéder à cette route`,
          403
        )
      );
    }
    next();
  };
};
