import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { env } from './env';
import { findOrCreateGoogleUser } from '../services/auth.service';

if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackURL: env.GOOGLE_CALLBACK_URL,
        scope: ['profile', 'email'],
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(new Error('No email returned from Google'), undefined);
          }

          const { user, accessToken, refreshToken } = await findOrCreateGoogleUser({
            id: profile.id,
            email,
            name: profile.displayName || email.split('@')[0],
            avatar_url: profile.photos?.[0]?.value,
          });

          return done(null, {
            id: user.id,
            email: user.email,
            name: user.name,
            accessToken,
            refreshToken,
          });
        } catch (err) {
          return done(err as Error, undefined);
        }
      },
    ),
  );
}

export default passport;
