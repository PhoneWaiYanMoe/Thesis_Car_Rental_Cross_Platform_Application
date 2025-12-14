const jwt = require('jsonwebtoken');
const passport = require('../config/passport');


//  Middleware for linking OAuth accounts to logged-in users
//  Requires both JWT authentication AND OAuth success

exports.authenticatedOAuthLink = (provider) => {
  return [
    // First, verify JWT token
    (req, res, next) => {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.redirect(
          `${process.env.FRONTEND_URL}/login?error=${encodeURIComponent('Authentication required to link accounts')}`
        );
      }
      
      const token = authHeader.substring(7);
      
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Store JWT data
        next();
      } catch (error) {
        return res.redirect(
          `${process.env.FRONTEND_URL}/login?error=${encodeURIComponent('Invalid or expired token')}`
        );
      }
    },
    
    // Then, authenticate with OAuth provider
    passport.authenticate(provider, { 
      session: false,
      failureRedirect: `${process.env.FRONTEND_URL}/settings/accounts?status=error&provider=${provider}`
    }),
    
    // Combine JWT user with OAuth data
    (req, res, next) => {
      req.user = {
        userId: req.user.userId, // From JWT
        email: req.user.email,
        role: req.user.role,
        oauthData: req.user // OAuth profile from Passport
      };
      next();
    }
  ];
};