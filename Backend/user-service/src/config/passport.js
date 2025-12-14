const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;

// Configure Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      scope: ['profile', 'email'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Extract user data from Google profile
        const oauthData = {
          provider: 'google',
          providerId: profile.id,
          email: profile.emails[0].value,
          fullName: profile.displayName,
          avatarUrl: profile.photos[0]?.value,
          accessToken,
          refreshToken,
        };
        
        console.log('Google OAuth success:', oauthData.email);
        return done(null, oauthData);
      } catch (error) {
        console.error('Google OAuth error:', error);
        return done(error, null);
      }
    }
  )
);

// Configure Facebook OAuth Strategy
passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: process.env.FACEBOOK_CALLBACK_URL,
      profileFields: ['id', 'emails', 'name', 'picture.type(large)'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Extract user data from Facebook profile
        const oauthData = {
          provider: 'facebook',
          providerId: profile.id,
          email: profile.emails?.[0]?.value,
          fullName: `${profile.name.givenName} ${profile.name.familyName}`,
          avatarUrl: profile.photos?.[0]?.value,
          accessToken,
          refreshToken,
        };
        
        // Facebook sometimes doesn't provide email
        if (!oauthData.email) {
          return done(new Error('Email not provided by Facebook'), null);
        }
        
        console.log('Facebook OAuth success:', oauthData.email);
        return done(null, oauthData);
      } catch (error) {
        console.error('Facebook OAuth error:', error);
        return done(error, null);
      }
    }
  )
);

module.exports = passport;