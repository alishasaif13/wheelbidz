import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as JWTstrategy, ExtractJwt as ExtractJWT } from 'passport-jwt';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import bcrypt from 'bcrypt';
import pool from './db.js'; 

const { hash, compare } = bcrypt;

// Local Strategy for Login
passport.use(
  'login',
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
    },
    async (email, password, done) => {
      try {
        // 1. Fetch user by email (MySQL version)
        const [users, fields] = await pool.query("SELECT * FROM tbl_users WHERE email = ?", [email]); // Use ? for MySQL

        if (users.length === 0) { // MySQL returns an array of rows directly
          return done(null, false, { message: 'Invalid email or password' });
        }

        const user = users[0]; // Get the first user from the array

        // 2. Check account status
        if (user.status === 'N') {
          return done(null, false, { message: 'Account deactivated. Contact support.' });
        }

        let storedPassword = user.password;
        const isHashed = storedPassword.startsWith('$2b$');

        // Auto-upgrade plain text passwords
        if (!isHashed) {
          console.log('Upgrading password security...');
          const hashedPassword = await hash(storedPassword, 10);
          // MySQL version
          await pool.query('UPDATE tbl_users SET password = ? WHERE email = ?', [hashedPassword, email]);
          storedPassword = hashedPassword;
        }

        // 3. Compare passwords
        const isMatch = await compare(password, storedPassword);

        if (!isMatch) {
          return done(null, false, { message: 'Invalid email or password' });
        }

        // 4. If everything is correct, return the user object
        return done(null, user, { message: 'Logged in successfully' });

      } catch (error) {
        return done(error);
      }
    }
  )
);

passport.use(
  'jwt',
  new JWTstrategy(
    {
      secretOrKey: process.env.JWT_SECRET,
      jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken()
    },
    async (token, done) => {
      try {
        return done(null, token);
      } catch (error) {
        return done(error);
      }
    }
  )
);

passport.use(
  'google',
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log("Google Profile Received:", profile);

        const [userByGoogleId] = await pool.query('SELECT * FROM tbl_users WHERE google_id = ?', [profile.id]);

        if (userByGoogleId.length > 0) {
          return done(null, userByGoogleId[0]);
        }

        const [userByEmail] = await pool.query('SELECT * FROM tbl_users WHERE email = ?', [profile.emails[0].value]);

        let user;
        if (userByEmail.length > 0) {
          user = userByEmail[0];
          await pool.query('UPDATE tbl_users SET google_id = ? WHERE id = ?', [profile.id, user.id]);
        } else {
          const newUser = {
            google_id: profile.id,
            name: profile.displayName,
            email: profile.emails[0].value,
            image: profile.photos[0].value,
            password: null,
            status: 'Y',
            role: 'customer'
          };

          // MySQL INSERT query - NOTE THE DIFFERENCE!
          const [result] = await pool.query(
            'INSERT INTO tbl_users (google_id, name, email, image, password, status, role) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [newUser.google_id, newUser.name, newUser.email, newUser.image, newUser.password, newUser.status, newUser.role]
          );
          // Get the ID of the newly inserted row
          const [newUsers] = await pool.query('SELECT * FROM tbl_users WHERE id = ?', [result.insertId]);
          user = newUsers[0];
        }

        return done(null, user);

      } catch (error) {
        console.error("Google Strategy Error:", error);
        return done(error, null);
      }
    }
  )
);

export default passport;