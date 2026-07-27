// =====================================================
// 🌱 EDUSUSTAIN AI - COMPLETE BACKEND SERVER
// =====================================================


// =====================================================
// LOAD ENVIRONMENT VARIABLES FIRST
// VERY IMPORTANT FOR GOOGLE OAUTH
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

console.log(
  "========================================"
);

console.log(
  "🌱 EduSustain AI Backend Starting..."
);

console.log(
  "========================================"
);


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

const authRoutes =
  require("./routes/authRoutes");

const schoolRoutes =
  require("./routes/schoolRoutes");


// =====================================================
// CREATE EXPRESS APP
// =====================================================

const app = express();


// =====================================================
// CREATE UPLOADS FOLDER
// =====================================================

const uploadsPath =
  path.join(
    __dirname,
    "uploads"
  );


if (
  !fs.existsSync(
    uploadsPath
  )
) {

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

app.use(

  cors({

    origin: [

      "http://localhost:5173",

      "http://localhost:5174",

      "http://127.0.0.1:5173",

      "http://127.0.0.1:5174",

    ],

    credentials: true,

  })

);


// =====================================================
// BODY PARSER
// =====================================================

app.use(

  express.json({

    limit:
      "10mb",

  })

);


app.use(

  express.urlencoded({

    extended:
      true,

    limit:
      "10mb",

  })

);


// =====================================================
// PASSPORT INITIALIZATION
// VERY IMPORTANT FOR GOOGLE LOGIN
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

  (
    req,
    res
  ) => {

    res.status(
      200
    ).json({

      success:
        true,

      message:
        "EduSustain AI Backend is Running 🚀",

      status:
        "Online",

      mongodb:
        mongoose.connection
          .readyState === 1
          ? "Connected"
          : "Disconnected",

      googleAuth:
        process.env.GOOGLE_CLIENT_ID &&
        process.env.GOOGLE_CLIENT_SECRET
          ? "Configured"
          : "Not Configured",

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
// =====================================================

app.use(

  (
    req,
    res
  ) => {

    console.log(
      `404 - Route not found: ${req.method} ${req.originalUrl}`
    );

    res
      .status(
        404
      )
      .json({

        success:
          false,

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


    res

      .status(
        error.status ||
        500
      )

      .json({

        success:
          false,

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

if (
  !MONGO_URI
) {

  console.error(
    "========================================"
  );

  console.error(
    "❌ MONGO_URI IS MISSING"
  );

  console.error(
    "Please check your .env file."
  );

  console.error(
    "========================================"
  );

  process.exit(
    1
  );

}


if (
  !process.env.JWT_SECRET
) {

  console.error(
    "========================================"
  );

  console.error(
    "❌ JWT_SECRET IS MISSING"
  );

  console.error(
    "Please add JWT_SECRET to your .env file."
  );

  console.error(
    "========================================"
  );

  process.exit(
    1
  );

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
    "are added to your .env file."
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

  (
    error
  ) => {

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
          5000,

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

        console.log(
          `🌐 Server: http://localhost:${PORT}`
        );

        console.log(
          `❤️ Health: http://localhost:${PORT}/`
        );

        console.log(
          `🔐 Auth: http://localhost:${PORT}/api/auth`
        );

        console.log(
          `📝 Register: http://localhost:${PORT}/api/auth/register`
        );

        console.log(
          `🔑 Login: http://localhost:${PORT}/api/auth/login`
        );

        console.log(
          `🔵 Google Login: http://localhost:${PORT}/api/auth/google`
        );

        console.log(
          `🔵 Google Callback: http://localhost:${PORT}/api/auth/google/callback`
        );

        console.log(
          `🏫 Schools: http://localhost:${PORT}/api/schools`
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


  } catch (
    error
  ) {

    // =================================================
    // MONGODB CONNECTION ERROR
    // =================================================

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
      "1. Make sure MongoDB is running."
    );

    console.error(
      "2. Check MONGO_URI in .env."
    );

    console.error(
      "3. Check MongoDB Compass connection."
    );

    console.error(
      "4. Try mongodb://127.0.0.1:27017/edusustain"
    );

    console.error(
      "========================================"
    );

    process.exit(
      1
    );

  }

}


// =====================================================
// START APPLICATION
// =====================================================

startServer();


// =====================================================
// GRACEFUL SHUTDOWN - CTRL + C
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

    } catch (
      error
    ) {

      console.error(
        "Error closing MongoDB:",
        error.message
      );

    }


    process.exit(
      0
    );

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

    } catch (
      error
    ) {

      console.error(
        "Error closing MongoDB:",
        error.message
      );

    }


    process.exit(
      0
    );

  }

);