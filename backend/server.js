// =====================================================
// 🌱 EDUSUSTAIN AI - COMPLETE BACKEND SERVER
// PRODUCTION + LOCAL DEVELOPMENT
// EXPRESS 5 COMPATIBLE
// =====================================================


// =====================================================
// LOAD ENVIRONMENT VARIABLES FIRST
// =====================================================

const dotenv = require("dotenv");

dotenv.config();


// =====================================================
// IMPORT CORE PACKAGES
// =====================================================

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const fs = require("fs");
const path = require("path");


// =====================================================
// IMPORT PASSPORT
// =====================================================

const passport = require("passport");


// =====================================================
// LOAD GOOGLE PASSPORT STRATEGY
// IMPORTANT:
// dotenv.config() ke BAAD load hona chahiye
// =====================================================

require("./config/passport");


// =====================================================
// STARTUP LOGS
// =====================================================

console.log("========================================");
console.log("🌱 EduSustain AI Backend Starting...");
console.log("========================================");


// =====================================================
// ENVIRONMENT VARIABLES CHECK
// =====================================================

console.log(
  "PORT:",
  process.env.PORT || 5000
);

console.log(
  "MONGO_URI:",
  process.env.MONGO_URI
    ? "Loaded ✅"
    : "Missing ❌"
);

console.log(
  "JWT_SECRET:",
  process.env.JWT_SECRET
    ? "Loaded ✅"
    : "Missing ❌"
);

console.log(
  "GOOGLE_CLIENT_ID:",
  process.env.GOOGLE_CLIENT_ID
    ? "Loaded ✅"
    : "Missing ❌"
);

console.log(
  "GOOGLE_CLIENT_SECRET:",
  process.env.GOOGLE_CLIENT_SECRET
    ? "Loaded ✅"
    : "Missing ❌"
);


// =====================================================
// IMPORT ROUTES
// =====================================================

const authRoutes = require("./routes/authRoutes");

const schoolRoutes = require("./routes/schoolRoutes");


// =====================================================
// CREATE EXPRESS APP
// =====================================================

const app = express();


// =====================================================
// CREATE UPLOADS FOLDER
// =====================================================

const uploadsPath = path.join(
  __dirname,
  "uploads"
);


if (!fs.existsSync(uploadsPath)) {

  fs.mkdirSync(
    uploadsPath,
    {
      recursive: true,
    }
  );

  console.log(
    "Uploads folder created ✅"
  );

} else {

  console.log(
    "Uploads folder ready ✅"
  );

}


// =====================================================
// CORS CONFIGURATION
// =====================================================
//
// PRODUCTION FRONTEND:
// https://edu-sustain-ai.vercel.app
//
// PRODUCTION BACKEND:
// https://edusustain-ai-backend.onrender.com
//
// LOCAL FRONTEND:
// http://localhost:5173
// http://localhost:5174
// http://127.0.0.1:5173
// http://127.0.0.1:5174
//
// =====================================================

const allowedOrigins = [

  // ===================================================
  // 🚀 PRODUCTION FRONTEND
  // ===================================================

  "https://edu-sustain-ai.vercel.app",

  // ===================================================
  // 💻 LOCAL DEVELOPMENT
  // ===================================================

  "http://localhost:5173",

  "http://localhost:5174",

  "http://127.0.0.1:5173",

  "http://127.0.0.1:5174",

];


// =====================================================
// CORS MIDDLEWARE
// =====================================================

app.use(

  cors({

    origin: function (
      origin,
      callback
    ) {

      // =================================================
      // ALLOW REQUESTS WITHOUT ORIGIN
      // Postman
      // Thunder Client
      // Server-to-Server
      // =================================================

      if (!origin) {

        return callback(
          null,
          true
        );

      }


      // =================================================
      // CHECK ALLOWED FRONTEND ORIGIN
      // =================================================

      if (
        allowedOrigins.includes(
          origin
        )
      ) {

        console.log(
          "✅ CORS Allowed:",
          origin
        );

        return callback(
          null,
          true
        );

      }


      // =================================================
      // BLOCK UNKNOWN ORIGIN
      // =================================================

      console.log(
        "❌ CORS Blocked Origin:",
        origin
      );

      return callback(
        new Error(
          "Not allowed by CORS"
        )
      );

    },


    // =================================================
    // ALLOW COOKIES / AUTH
    // =================================================

    credentials: true,


    // =================================================
    // ALLOWED HTTP METHODS
    // =================================================

    methods: [

      "GET",

      "POST",

      "PUT",

      "PATCH",

      "DELETE",

      "OPTIONS",

    ],


    // =================================================
    // ALLOWED REQUEST HEADERS
    // =================================================

    allowedHeaders: [

      "Origin",

      "X-Requested-With",

      "Content-Type",

      "Accept",

      "Authorization",

    ],


    // =================================================
    // EXPOSED RESPONSE HEADERS
    // =================================================

    exposedHeaders: [

      "Authorization",

    ],


    // =================================================
    // BROWSER PREFLIGHT CACHE
    // =================================================

    maxAge: 86400,

  })

);


// =====================================================
// IMPORTANT
// =====================================================
//
// DO NOT USE:
//
// app.options("*", cors());
//
// Express 5 mein "*" route se
// path-to-regexp error aa sakta hai.
//
// cors() middleware already
// preflight requests handle karta hai.
//
// =====================================================


// =====================================================
// BODY PARSER
// =====================================================

app.use(

  express.json({

    limit: "10mb",

  })

);


app.use(

  express.urlencoded({

    extended: true,

    limit: "10mb",

  })

);


// =====================================================
// PASSPORT INITIALIZATION
// =====================================================

app.use(

  passport.initialize()

);


console.log(
  "Passport initialized successfully ✅"
);


// =====================================================
// HEALTH CHECK / HOME ROUTE
// =====================================================

app.get(

  "/",

  (req, res) => {

    return res.status(200).json({

      success: true,

      message:
        "EduSustain AI Backend is Running 🚀",

      status:
        "Online",

      mongodb:
        mongoose.connection.readyState === 1
          ? "Connected"
          : "Disconnected",

      googleAuth:
        process.env.GOOGLE_CLIENT_ID &&
        process.env.GOOGLE_CLIENT_SECRET
          ? "Configured"
          : "Not Configured",

      frontend:
        "https://edu-sustain-ai.vercel.app",

      backend:
        "https://edusustain-ai-backend.onrender.com",

    });

  }

);


// =====================================================
// AUTH ROUTES
// =====================================================
//
// Register:
// POST /api/auth/register
//
// Login:
// POST /api/auth/login
//
// Google Login:
// GET /api/auth/google
//
// Google Callback:
// GET /api/auth/google/callback
//
// =====================================================

app.use(

  "/api/auth",

  authRoutes

);


// =====================================================
// SCHOOL DATA ROUTES
// =====================================================
//
// Upload:
// POST /api/schools/upload
//
// Get All:
// GET /api/schools/all
//
// Analytics:
// GET /api/schools/analytics
//
// Delete All:
// DELETE /api/schools/all
//
// AI Result:
// PUT /api/schools/:id/ai-result
//
// =====================================================

app.use(

  "/api/schools",

  schoolRoutes

);


// =====================================================
// 404 ROUTE
// EXPRESS 5 COMPATIBLE
// =====================================================

app.use(

  (req, res) => {

    console.log(

      `404 - Route not found: ${req.method} ${req.originalUrl}`

    );

    return res

      .status(404)

      .json({

        success: false,

        message:
          `Route not found: ${req.method} ${req.originalUrl}`,

      });

  }

);


// =====================================================
// GLOBAL ERROR HANDLER
// =====================================================

app.use(

  (
    error,
    req,
    res,
    next
  ) => {

    console.error(
      "========================================"
    );

    console.error(
      "GLOBAL SERVER ERROR ❌"
    );

    console.error(
      "========================================"
    );

    console.error(
      "Message:",
      error.message
    );

    console.error(
      "Stack:",
      error.stack
    );

    console.error(
      "========================================"
    );


    // =================================================
    // CORS ERROR
    // =================================================

    if (

      error.message ===
      "Not allowed by CORS"

    ) {

      return res

        .status(403)

        .json({

          success: false,

          message:
            "CORS Error: Frontend origin is not allowed.",

        });

    }


    // =================================================
    // GENERAL ERROR
    // =================================================

    return res

      .status(

        error.status ||
        500

      )

      .json({

        success: false,

        message:

          error.message ||
          "Internal Server Error",

      });

  }

);


// =====================================================
// DATABASE CONFIGURATION
// =====================================================

const MONGO_URI =
  process.env.MONGO_URI;


const PORT =
  process.env.PORT ||
  5000;


// =====================================================
// ENVIRONMENT VALIDATION
// =====================================================

if (!MONGO_URI) {

  console.error(
    "========================================"
  );

  console.error(
    "❌ MONGO_URI IS MISSING"
  );

  console.error(
    "Please add MONGO_URI in Render Environment Variables."
  );

  console.error(
    "========================================"
  );

  process.exit(1);

}


if (!process.env.JWT_SECRET) {

  console.error(
    "========================================"
  );

  console.error(
    "❌ JWT_SECRET IS MISSING"
  );

  console.error(
    "Please add JWT_SECRET in Render Environment Variables."
  );

  console.error(
    "========================================"
  );

  process.exit(1);

}


// =====================================================
// GOOGLE OAUTH ENVIRONMENT CHECK
// =====================================================

if (

  !process.env.GOOGLE_CLIENT_ID ||

  !process.env.GOOGLE_CLIENT_SECRET

) {

  console.warn(
    "========================================"
  );

  console.warn(
    "⚠️ GOOGLE OAUTH CREDENTIALS ARE MISSING"
  );

  console.warn(
    "Google Login will not work until"
  );

  console.warn(
    "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET"
  );

  console.warn(
    "are added to Render Environment Variables."
  );

  console.warn(
    "========================================"
  );

} else {

  console.log(
    "Google OAuth credentials loaded successfully ✅"
  );

}


// =====================================================
// MONGOOSE CONNECTION EVENTS
// =====================================================

mongoose.connection.on(

  "connected",

  () => {

    console.log(
      "MongoDB Connected Successfully ✅"
    );

  }

);


mongoose.connection.on(

  "error",

  (error) => {

    console.error(
      "MongoDB Runtime Error ❌"
    );

    console.error(
      error.message
    );

  }

);


mongoose.connection.on(

  "disconnected",

  () => {

    console.log(
      "MongoDB Disconnected ⚠️"
    );

  }

);


// =====================================================
// START SERVER
// =====================================================

async function startServer() {

  try {

    // =================================================
    // CONNECT TO MONGODB
    // =================================================

    console.log(
      "Connecting to MongoDB..."
    );


    await mongoose.connect(

      MONGO_URI,

      {

        serverSelectionTimeoutMS:
          10000,

      }

    );


    // =================================================
    // DATABASE CONNECTED
    // =================================================

    console.log(
      "========================================"
    );

    console.log(
      "MongoDB Connected Successfully ✅"
    );

    console.log(
      "Database:",
      mongoose.connection.name
    );

    console.log(
      "========================================"
    );


    // =================================================
    // START EXPRESS SERVER
    // =================================================

    app.listen(

      PORT,

      () => {

        console.log(
          "========================================"
        );

        console.log(
          "🚀 EduSustain AI Backend is LIVE"
        );

        console.log(
          "========================================"
        );


        // =================================================
        // LOCAL URL
        // =================================================

        console.log(
          `💻 Local Backend: http://localhost:${PORT}`
        );


        // =================================================
        // PRODUCTION URL
        // =================================================

        console.log(
          "🚀 Production Backend:"
        );

        console.log(
          "https://edusustain-ai-backend.onrender.com"
        );


        // =================================================
        // HEALTH CHECK
        // =================================================

        console.log(
          "❤️ Production Health:"
        );

        console.log(
          "https://edusustain-ai-backend.onrender.com/"
        );


        // =================================================
        // FRONTEND
        // =================================================

        console.log(
          "🌐 Production Frontend:"
        );

        console.log(
          "https://edu-sustain-ai.vercel.app"
        );


        // =================================================
        // AUTH
        // =================================================

        console.log(
          "🔐 Production Auth:"
        );

        console.log(
          "https://edusustain-ai-backend.onrender.com/api/auth"
        );


        // =================================================
        // REGISTER
        // =================================================

        console.log(
          "📝 Register:"
        );

        console.log(
          "https://edusustain-ai-backend.onrender.com/api/auth/register"
        );


        // =================================================
        // LOGIN
        // =================================================

        console.log(
          "🔑 Login:"
        );

        console.log(
          "https://edusustain-ai-backend.onrender.com/api/auth/login"
        );


        // =================================================
        // GOOGLE LOGIN
        // =================================================

        console.log(
          "🔵 Google Login:"
        );

        console.log(
          "https://edusustain-ai-backend.onrender.com/api/auth/google"
        );


        // =================================================
        // SCHOOL ROUTES
        // =================================================

        console.log(
          "🏫 Production Schools:"
        );

        console.log(
          "https://edusustain-ai-backend.onrender.com/api/schools"
        );


        // =================================================
        // ALLOWED ORIGINS
        // =================================================

        console.log(
          "========================================"
        );

        console.log(
          "🌐 Allowed Frontend Origins:"
        );


        allowedOrigins.forEach(

          (origin) => {

            console.log(
              "   ✅",
              origin
            );

          }

        );


        console.log(
          "========================================"
        );

        console.log(
          "✅ Server is ready to accept requests!"
        );

        console.log(
          "========================================"
        );

      }

    );

  } catch (error) {

    console.error(
      "========================================"
    );

    console.error(
      "❌ MONGODB CONNECTION FAILED"
    );

    console.error(
      "========================================"
    );

    console.error(
      "Error Name:",
      error.name
    );

    console.error(
      "Error Message:",
      error.message
    );

    console.error(
      "========================================"
    );

    console.error(
      "Possible Solutions:"
    );

    console.error(
      "1. Check MONGO_URI in Render Environment Variables."
    );

    console.error(
      "2. Check MongoDB Atlas Network Access."
    );

    console.error(
      "3. Check MongoDB Atlas connection string."
    );

    console.error(
      "4. Make sure MongoDB Atlas allows Render IP access."
    );

    console.error(
      "========================================"
    );

    process.exit(1);

  }

}


// =====================================================
// START APPLICATION
// =====================================================

startServer();


// =====================================================
// GRACEFUL SHUTDOWN - SIGINT
// =====================================================

process.on(

  "SIGINT",

  async () => {

    console.log(
      "\n========================================"
    );

    console.log(
      "Shutting down server..."
    );

    console.log(
      "========================================"
    );


    try {

      await mongoose.connection.close();


      console.log(
        "MongoDB connection closed successfully ✅"
      );

    } catch (error) {

      console.error(
        "Error closing MongoDB:",
        error.message
      );

    }


    process.exit(0);

  }

);


// =====================================================
// GRACEFUL SHUTDOWN - SIGTERM
// =====================================================

process.on(

  "SIGTERM",

  async () => {

    console.log(
      "\n========================================"
    );

    console.log(
      "SIGTERM received..."
    );

    console.log(
      "Shutting down server..."
    );

    console.log(
      "========================================"
    );


    try {

      await mongoose.connection.close();


      console.log(
        "MongoDB connection closed successfully ✅"
      );

    } catch (error) {

      console.error(
        "Error closing MongoDB:",
        error.message
      );

    }


    process.exit(0);

  }

);