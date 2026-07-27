const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const passport = require("passport");

const User = require("../models/User");

const router = express.Router();


// =====================================================
// FRONTEND URL
// =====================================================
// Vite frontend currently runs on port 5173.
// If FRONTEND_URL is present in .env, it will be used.
// Otherwise localhost:5173 will be used automatically.

const FRONTEND_URL =
  process.env.FRONTEND_URL ||
  "http://localhost:5173";


// =====================================================
// HELPER: CREATE JWT
// =====================================================

const createToken = (user) => {

  return jwt.sign(

    {
      id: user._id,
      email: user.email,
    },

    process.env.JWT_SECRET,

    {
      expiresIn: "7d",
    }

  );

};


// =====================================================
// REGISTER
// =====================================================

router.post(
  "/register",

  async (req, res) => {

    try {

      const {
        name,
        email,
        password,
      } = req.body;


      // ==========================================
      // VALIDATION
      // ==========================================

      if (
        !name ||
        !email ||
        !password
      ) {

        return res
          .status(400)
          .json({

            success: false,

            message:
              "Please fill all fields",

          });

      }


      if (
        password.length < 6
      ) {

        return res
          .status(400)
          .json({

            success: false,

            message:
              "Password must be at least 6 characters",

          });

      }


      // ==========================================
      // NORMALIZE EMAIL
      // ==========================================

      const normalizedEmail =
        email
          .trim()
          .toLowerCase();


      // ==========================================
      // CHECK EXISTING USER
      // ==========================================

      const existingUser =
        await User.findOne({

          email:
            normalizedEmail,

        });


      if (existingUser) {

        // ========================================
        // GOOGLE ACCOUNT
        // ========================================

        if (
          existingUser.authProvider ===
          "google"
        ) {

          return res
            .status(400)
            .json({

              success: false,

              message:
                "This email is already registered with Google. Please continue with Google.",

            });

        }


        // ========================================
        // NORMAL ACCOUNT
        // ========================================

        return res
          .status(400)
          .json({

            success: false,

            message:
              "User already exists",

          });

      }


      // ==========================================
      // HASH PASSWORD
      // ==========================================

      const hashedPassword =
        await bcrypt.hash(
          password,
          10
        );


      // ==========================================
      // CREATE USER
      // ==========================================

      const user =
        await User.create({

          name:
            name.trim(),

          email:
            normalizedEmail,

          password:
            hashedPassword,

          authProvider:
            "local",

        });


      // ==========================================
      // CREATE JWT
      // ==========================================

      const token =
        createToken(
          user
        );


      // ==========================================
      // SUCCESS RESPONSE
      // ==========================================

      return res
        .status(201)
        .json({

          success: true,

          message:
            "Account created successfully",

          token,

          user: {

            id:
              user._id,

            name:
              user.name,

            email:
              user.email,

            profilePicture:
              user.profilePicture ||
              "",

            authProvider:
              user.authProvider ||
              "local",

          },

        });


    } catch (error) {

      console.error(
        "❌ REGISTER ERROR:",
        error
      );


      return res
        .status(500)
        .json({

          success: false,

          message:
            "Server error during registration",

        });

    }

  }

);


// =====================================================
// LOGIN
// =====================================================

router.post(
  "/login",

  async (req, res) => {

    try {

      const {
        email,
        password,
      } = req.body;


      // ==========================================
      // VALIDATION
      // ==========================================

      if (
        !email ||
        !password
      ) {

        return res
          .status(400)
          .json({

            success: false,

            message:
              "Email and password are required",

          });

      }


      // ==========================================
      // NORMALIZE EMAIL
      // ==========================================

      const normalizedEmail =
        email
          .trim()
          .toLowerCase();


      // ==========================================
      // FIND USER
      // ==========================================

      const user =
        await User.findOne({

          email:
            normalizedEmail,

        });


      if (!user) {

        return res
          .status(401)
          .json({

            success: false,

            message:
              "Invalid email or password",

          });

      }


      // ==========================================
      // GOOGLE USER
      // ==========================================

      if (
        user.authProvider ===
        "google" &&
        !user.password
      ) {

        return res
          .status(401)
          .json({

            success: false,

            message:
              "This account uses Google Login. Please continue with Google.",

          });

      }


      // ==========================================
      // PASSWORD CHECK
      // ==========================================

      const isMatch =
        await bcrypt.compare(

          password,

          user.password

        );


      if (!isMatch) {

        return res
          .status(401)
          .json({

            success: false,

            message:
              "Invalid email or password",

          });

      }


      // ==========================================
      // CREATE JWT
      // ==========================================

      const token =
        createToken(
          user
        );


      // ==========================================
      // SUCCESS RESPONSE
      // ==========================================

      return res.json({

        success: true,

        message:
          "Login successful",

        token,

        user: {

          id:
            user._id,

          name:
            user.name,

          email:
            user.email,

          profilePicture:
            user.profilePicture ||
            "",

          authProvider:
            user.authProvider ||
            "local",

        },

      });


    } catch (error) {

      console.error(
        "❌ LOGIN ERROR:",
        error
      );


      return res
        .status(500)
        .json({

          success: false,

          message:
            "Server error during login",

        });

    }

  }

);


// =====================================================
// GOOGLE LOGIN START
// =====================================================

router.get(

  "/google",

  (req, res, next) => {

    console.log(
      "========================================"
    );

    console.log(
      "🔵 Google Login Started..."
    );

    console.log(
      "Frontend URL:",
      FRONTEND_URL
    );

    console.log(
      "========================================"
    );

    next();

  },

  passport.authenticate(

    "google",

    {

      scope: [

        "profile",

        "email",

      ],

    }

  )

);


// =====================================================
// GOOGLE CALLBACK
// =====================================================

router.get(

  "/google/callback",

  passport.authenticate(

    "google",

    {

      failureRedirect:
        `${FRONTEND_URL}/?googleError=true`,

      session: false,

    }

  ),

  async (

    req,

    res

  ) => {

    try {

      console.log(
        "========================================"
      );

      console.log(
        "🔵 Google Callback Route Executed"
      );

      console.log(
        "Frontend URL:",
        FRONTEND_URL
      );

      console.log(
        "========================================"
      );


      // ========================================
      // GET GOOGLE USER
      // ========================================

      const user =
        req.user;


      if (!user) {

        console.error(
          "❌ Google user not found"
        );


        return res.redirect(

          `${FRONTEND_URL}/?googleError=true`

        );

      }


      console.log(
        "✅ Google User Found:",
        user.email
      );


      // ========================================
      // CREATE JWT
      // ========================================

      const token =
        createToken(
          user
        );


      // ========================================
      // PREPARE USER DATA
      // ========================================

      const userData =

        encodeURIComponent(

          JSON.stringify({

            id:
              user._id,

            name:
              user.name,

            email:
              user.email,

            profilePicture:
              user.profilePicture ||
              "",

            authProvider:
              user.authProvider ||
              "google",

          })

        );


      // ========================================
      // CREATE FRONTEND REDIRECT URL
      // ========================================

      const redirectURL =

        `${FRONTEND_URL}/?token=${encodeURIComponent(
          token
        )}&user=${userData}`;


      // ========================================
      // LOG SUCCESS
      // ========================================

      console.log(
        "========================================"
      );

      console.log(
        "✅ Google Login Successful"
      );

      console.log(
        "👤 User:",
        user.email
      );

      console.log(
        "🔄 Redirecting to Frontend:"
      );

      console.log(
        `${FRONTEND_URL}/?token=TOKEN_HIDDEN&user=USER_DATA`
      );

      console.log(
        "========================================"
      );


      // ========================================
      // REDIRECT TO FRONTEND
      // ========================================

      return res.redirect(

        redirectURL

      );


    } catch (error) {

      console.error(
        "========================================"
      );

      console.error(
        "❌ GOOGLE CALLBACK ERROR"
      );

      console.error(
        error
      );

      console.error(
        "========================================"
      );


      return res.redirect(

        `${FRONTEND_URL}/?googleError=true`

      );

    }

  }

);


// =====================================================
// GET CURRENT USER / ME
// =====================================================

router.get(

  "/me",

  async (

    req,

    res

  ) => {

    try {

      // ========================================
      // GET AUTHORIZATION HEADER
      // ========================================

      const authHeader =
        req.headers.authorization;


      if (

        !authHeader ||

        !authHeader.startsWith(
          "Bearer "
        )

      ) {

        return res
          .status(401)
          .json({

            success: false,

            message:
              "Authentication token required",

          });

      }


      // ========================================
      // GET TOKEN
      // ========================================

      const token =

        authHeader
          .split(" ")[1];


      if (!token) {

        return res
          .status(401)
          .json({

            success: false,

            message:
              "Token is missing",

          });

      }


      // ========================================
      // VERIFY TOKEN
      // ========================================

      const decoded =

        jwt.verify(

          token,

          process.env.JWT_SECRET

        );


      // ========================================
      // FIND USER
      // ========================================

      const user =

        await User

          .findById(
            decoded.id
          )

          .select(
            "-password"
          );


      if (!user) {

        return res
          .status(404)
          .json({

            success: false,

            message:
              "User not found",

          });

      }


      // ========================================
      // RESPONSE
      // ========================================

      return res.json({

        success: true,

        user: {

          id:
            user._id,

          name:
            user.name,

          email:
            user.email,

          profilePicture:
            user.profilePicture ||
            "",

          authProvider:
            user.authProvider ||
            "local",

        },

      });


    } catch (error) {

      console.error(
        "❌ ME ROUTE ERROR:",
        error
      );


      return res
        .status(401)
        .json({

          success: false,

          message:
            "Invalid or expired token",

        });

    }

  }

);


// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports =
  router;