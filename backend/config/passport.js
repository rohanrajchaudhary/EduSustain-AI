const passport = require("passport");
const GoogleStrategy =
  require("passport-google-oauth20").Strategy;

const User = require("../models/user");


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
        "http://localhost:5000/api/auth/google/callback",
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


        // ==========================================
        // GET EMAIL
        // ==========================================

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
          googleEmail.toLowerCase();


        // ==========================================
        // GET PROFILE IMAGE
        // ==========================================

        const profilePicture =
          profile.photos?.[0]?.value || "";


        // ==========================================
        // FIND USER BY GOOGLE ID FIRST
        // ==========================================

        let user =
          await User.findOne({
            googleId:
              profile.id,
          });


        // ==========================================
        // IF NOT FOUND, FIND BY EMAIL
        // ==========================================

        if (!user) {

          user =
            await User.findOne({
              email: email,
            });

        }


        // ==========================================
        // CREATE NEW USER
        // ==========================================

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

        // ==========================================
        // EXISTING USER
        // ==========================================

        else {

          let shouldSave =
            false;


          // Add Google ID if missing
          if (
            !user.googleId
          ) {

            user.googleId =
              profile.id;

            shouldSave =
              true;

          }


          // Update profile picture
          if (
            profilePicture &&
            !user.profilePicture
          ) {

            user.profilePicture =
              profilePicture;

            shouldSave =
              true;

          }


          // Save provider
          if (
            user.authProvider !==
            "google"
          ) {

            user.authProvider =
              "google";

            shouldSave =
              true;

          }


          if (
            shouldSave
          ) {

            await user.save();

          }


          console.log(
            "👤 Existing User Logged In ✅"
          );

        }


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
        "DESERIALIZE ERROR:",
        error
      );

      done(
        error,
        null
      );

    }

  }
);


module.exports = passport;