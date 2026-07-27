const passport = require("passport");
const GoogleStrategy =
  require("passport-google-oauth20").Strategy;

const User = require("../models/user");

// =====================================================
// GOOGLE OAUTH CALLBACK URL
// =====================================================

// Local development:
// http://localhost:5000/api/auth/google/callback
//
// Production:
// https://edusustain-ai-backend.onrender.com/api/auth/google/callback
//
// Render ke Environment Variables me:
// BACKEND_URL=https://edusustain-ai-backend.onrender.com

const BACKEND_URL =
  process.env.BACKEND_URL ||
  "http://localhost:5000";

const GOOGLE_CALLBACK_URL =
  `${BACKEND_URL}/api/auth/google/callback`;

// =====================================================
// LOG OAUTH CONFIGURATION
// =====================================================

console.log(
  "========================================"
);

console.log(
  "🔐 Google OAuth Configuration"
);

console.log(
  "🌐 Backend URL:",
  BACKEND_URL
);

console.log(
  "🔄 Google Callback URL:",
  GOOGLE_CALLBACK_URL
);

console.log(
  "========================================"
);

// =====================================================
// GOOGLE OAUTH STRATEGY
// =====================================================

passport.use(
  new GoogleStrategy(
    {
      clientID:
        process.env.GOOGLE_CLIENT_ID,

      clientSecret:
        process.env.GOOGLE_CLIENT_SECRET,

      callbackURL:
        GOOGLE_CALLBACK_URL,
    },

    async (
      accessToken,
      refreshToken,
      profile,
      done
    ) => {
      try {
        console.log(
          "========================================"
        );

        console.log(
          "🔵 GOOGLE AUTH CALLBACK RECEIVED"
        );

        console.log(
          "Google ID:",
          profile.id
        );

        console.log(
          "Name:",
          profile.displayName
        );

        console.log(
          "Email:",
          profile.emails?.[0]?.value
        );

        console.log(
          "========================================"
        );

        // =========================================
        // GET EMAIL
        // =========================================

        const googleEmail =
          profile.emails?.[0]?.value;

        if (!googleEmail) {
          return done(
            new Error(
              "Google account email not available"
            ),
            null
          );
        }

        const email =
          googleEmail
            .trim()
            .toLowerCase();

        // =========================================
        // GET PROFILE IMAGE
        // =========================================

        const profilePicture =
          profile.photos?.[0]?.value || "";

        // =========================================
        // FIND USER BY GOOGLE ID
        // =========================================

        let user =
          await User.findOne({
            googleId:
              profile.id,
          });

        // =========================================
        // IF NOT FOUND, FIND BY EMAIL
        // =========================================

        if (!user) {
          user =
            await User.findOne({
              email: email,
            });
        }

        // =========================================
        // CREATE NEW GOOGLE USER
        // =========================================

        if (!user) {
          user =
            await User.create({
              name:
                profile.displayName ||
                "Google User",

              email:
                email,

              password:
                "",

              googleId:
                profile.id,

              profilePicture:
                profilePicture,

              authProvider:
                "google",
            });

          console.log(
            "🆕 New Google User Created ✅"
          );
        }

        // =========================================
        // EXISTING USER
        // =========================================

        else {
          let shouldSave = false;

          // =======================================
          // ADD GOOGLE ID IF MISSING
          // =======================================

          if (!user.googleId) {
            user.googleId =
              profile.id;

            shouldSave = true;
          }

          // =======================================
          // UPDATE PROFILE PICTURE
          // =======================================

          if (
            profilePicture &&
            user.profilePicture !==
              profilePicture
          ) {
            user.profilePicture =
              profilePicture;

            shouldSave = true;
          }

          // =======================================
          // UPDATE NAME IF EMPTY
          // =======================================

          if (
            !user.name &&
            profile.displayName
          ) {
            user.name =
              profile.displayName;

            shouldSave = true;
          }

          // =======================================
          // SET AUTH PROVIDER
          // =======================================

          if (
            user.authProvider !==
            "google"
          ) {
            user.authProvider =
              "google";

            shouldSave = true;
          }

          // =======================================
          // SAVE CHANGES
          // =======================================

          if (shouldSave) {
            await user.save();
          }

          console.log(
            "👤 Existing User Logged In ✅"
          );
        }

        // =========================================
        // AUTHENTICATION SUCCESS
        // =========================================

        return done(
          null,
          user
        );
      } catch (error) {
        console.error(
          "❌ GOOGLE STRATEGY ERROR:",
          error
        );

        return done(
          error,
          null
        );
      }
    }
  )
);

// =====================================================
// SERIALIZE USER
// =====================================================

passport.serializeUser(
  (user, done) => {
    done(
      null,
      user._id
    );
  }
);

// =====================================================
// DESERIALIZE USER
// =====================================================

passport.deserializeUser(
  async (
    id,
    done
  ) => {
    try {
      const user =
        await User.findById(
          id
        );

      done(
        null,
        user
      );
    } catch (error) {
      console.error(
        "❌ DESERIALIZE ERROR:",
        error
      );

      done(
        error,
        null
      );
    }
  }
);

// =====================================================
// EXPORT PASSPORT
// =====================================================

module.exports =
  passport;