const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const passport = require("passport");

const User = require("../models/user");

const router = express.Router();

// =====================================================
// PRODUCTION FRONTEND URL
// =====================================================

const FRONTEND_URL =
  "https://edu-sustain-ai.vercel.app";

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

router.post("/register", async (req, res) => {
  try {
    const {
      name,
      email,
      password,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please fill all fields",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 6 characters",
      });
    }

    const normalizedEmail = email
      .trim()
      .toLowerCase();

    const existingUser =
      await User.findOne({
        email: normalizedEmail,
      });

    if (existingUser) {
      if (
        existingUser.authProvider ===
        "google"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "This email is already registered with Google. Please continue with Google.",
        });
      }

      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    const hashedPassword =
      await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      authProvider: "local",
    });

    const token = createToken(user);

    return res.status(201).json({
      success: true,
      message:
        "Account created successfully",

      token,

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profilePicture:
          user.profilePicture || "",
        authProvider:
          user.authProvider || "local",
      },
    });
  } catch (error) {
    console.error(
      "❌ REGISTER ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error during registration",
    });
  }
});

// =====================================================
// LOGIN
// =====================================================

router.post("/login", async (req, res) => {
  try {
    const {
      email,
      password,
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Email and password are required",
      });
    }

    const normalizedEmail = email
      .trim()
      .toLowerCase();

    const user =
      await User.findOne({
        email: normalizedEmail,
      });

    if (!user) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid email or password",
      });
    }

    if (
      user.authProvider === "google" &&
      !user.password
    ) {
      return res.status(401).json({
        success: false,
        message:
          "This account uses Google Login. Please continue with Google.",
      });
    }

    const isMatch =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid email or password",
      });
    }

    const token = createToken(user);

    return res.json({
      success: true,
      message: "Login successful",

      token,

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profilePicture:
          user.profilePicture || "",
        authProvider:
          user.authProvider || "local",
      },
    });
  } catch (error) {
    console.error(
      "❌ LOGIN ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error during login",
    });
  }
});

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
      "🔵 Google Login Started"
    );

    console.log(
      "🌐 Production Frontend:",
      FRONTEND_URL
    );

    console.log(
      "========================================"
    );

    next();
  },

  passport.authenticate("google", {
    scope: [
      "profile",
      "email",
    ],
  })
);

// =====================================================
// GOOGLE CALLBACK
// =====================================================

router.get(
  "/google/callback",

  passport.authenticate("google", {
    failureRedirect:
      `${FRONTEND_URL}/?googleError=true`,

    session: false,
  }),

  async (req, res) => {
    try {
      console.log(
        "========================================"
      );

      console.log(
        "🔵 Google Callback Route Executed"
      );

      console.log(
        "🌐 Production Frontend:",
        FRONTEND_URL
      );

      console.log(
        "========================================"
      );

      // =========================================
      // GET USER
      // =========================================

      const user = req.user;

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

      // =========================================
      // CREATE JWT
      // =========================================

      const token =
        createToken(user);

      // =========================================
      // PREPARE USER DATA
      // =========================================

      const userData =
        encodeURIComponent(
          JSON.stringify({
            id: user._id,
            name: user.name,
            email: user.email,
            profilePicture:
              user.profilePicture || "",
            authProvider:
              user.authProvider ||
              "google",
          })
        );

      // =========================================
      // FINAL PRODUCTION REDIRECT
      // =========================================

      const redirectURL =
        `${FRONTEND_URL}/?token=${encodeURIComponent(
          token
        )}&user=${userData}`;

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
        "🔄 Redirecting to Production Frontend:"
      );

      console.log(
        `${FRONTEND_URL}/?token=TOKEN_HIDDEN&user=USER_DATA`
      );

      console.log(
        "========================================"
      );

      return res.redirect(
        redirectURL
      );
    } catch (error) {
      console.error(
        "========================================"
      );

      console.error(
        "❌ GOOGLE CALLBACK ERROR:",
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

router.get("/me", async (req, res) => {
  try {
    const authHeader =
      req.headers.authorization;

    if (
      !authHeader ||
      !authHeader.startsWith(
        "Bearer "
      )
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication token required",
      });
    }

    const token =
      authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message:
          "Token is missing",
      });
    }

    const decoded =
      jwt.verify(
        token,
        process.env.JWT_SECRET
      );

    const user =
      await User.findById(
        decoded.id
      ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "User not found",
      });
    }

    return res.json({
      success: true,

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profilePicture:
          user.profilePicture || "",
        authProvider:
          user.authProvider || "local",
      },
    });
  } catch (error) {
    console.error(
      "❌ ME ROUTE ERROR:",
      error
    );

    return res.status(401).json({
      success: false,
      message:
        "Invalid or expired token",
    });
  }
});

// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports = router;