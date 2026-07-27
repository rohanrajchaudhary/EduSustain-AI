import { useEffect, useState } from "react";
import "./App.css";

// =========================================
// API URLS
// =========================================

const API = "http://localhost:5000";
const ML_API = "http://localhost:8000";

function App() {
  // =========================================
  // AUTH STATE
  // =========================================

  const [showAuth, setShowAuth] = useState(false);
  const [isLogin, setIsLogin] = useState(true);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [authMessage, setAuthMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // =========================================
  // USER / DASHBOARD
  // =========================================

  const [user, setUser] = useState(null);
  const [showDashboard, setShowDashboard] = useState(false);

  // =========================================
  // SCHOOL DATA
  // =========================================

  const [schoolData, setSchoolData] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);

  // =========================================
  // FILE UPLOAD
  // =========================================

  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploading, setUploading] = useState(false);

  // =========================================
  // AI
  // =========================================

  const [aiResults, setAiResults] = useState({});
  const [aiLoading, setAiLoading] = useState({});

  // =========================================
  // DARK MODE
  // =========================================

  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("darkMode") === "true"
  );

  // =========================================
  // GOOGLE OAUTH CALLBACK
  // =========================================

  useEffect(() => {
    const handleGoogleCallback = async () => {
      const params = new URLSearchParams(
        window.location.search
      );

      const googleToken = params.get("token");
      const googleUser = params.get("user");
      const googleError = params.get("googleError");

      // =========================================
      // GOOGLE LOGIN ERROR
      // =========================================

      if (googleError) {
        console.error(
          "Google authentication failed"
        );

        setAuthMessage(
          "Google authentication failed. Please try again."
        );

        setShowAuth(true);

        // URL clean
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        );

        return;
      }

      // =========================================
      // GOOGLE LOGIN SUCCESS
      // =========================================

      if (googleToken && googleUser) {
        try {
          setLoading(true);

          // =====================================
          // DECODE USER
          // =====================================

          const parsedUser = JSON.parse(
            decodeURIComponent(googleUser)
          );

          console.log(
            "Google User:",
            parsedUser
          );

          // =====================================
          // SAVE JWT TOKEN
          // =====================================

          localStorage.setItem(
            "token",
            googleToken
          );

          // =====================================
          // SAVE USER
          // =====================================

          localStorage.setItem(
            "user",
            JSON.stringify(parsedUser)
          );

          // =====================================
          // UPDATE REACT STATE
          // =====================================

          setUser(parsedUser);

          setShowAuth(false);

          setShowDashboard(true);

          setAuthMessage("");

          // =====================================
          // LOAD MONGODB SCHOOL DATA
          // =====================================

          await fetchSchoolData(
            googleToken
          );

          console.log(
            "Google Login Successful ✅"
          );

          // =====================================
          // CLEAN URL
          // =====================================

          window.history.replaceState(
            {},
            document.title,
            window.location.pathname
          );
        } catch (error) {
          console.error(
            "GOOGLE CALLBACK ERROR:",
            error
          );

          localStorage.removeItem(
            "token"
          );

          localStorage.removeItem(
            "user"
          );

          setUser(null);

          setShowDashboard(false);

          setAuthMessage(
            "Google authentication failed. Please try again."
          );

          setShowAuth(true);

          // URL clean
          window.history.replaceState(
            {},
            document.title,
            window.location.pathname
          );
        } finally {
          setLoading(false);
        }
      }
    };

    handleGoogleCallback();
  }, []);

  // =========================================
  // GOOGLE LOGIN
  // =========================================

  const handleGoogleLogin = () => {
    setAuthMessage(
      "Connecting to Google..."
    );

    setLoading(true);

    // Backend Google OAuth route
    window.location.href =
      `${API}/api/auth/google`;
  };

  // =========================================
  // CHECK EXISTING LOGIN
  // =========================================

  useEffect(() => {
    const savedToken =
      localStorage.getItem("token");

    const savedUser =
      localStorage.getItem("user");

    // Agar Google callback URL me token hai
    // toh callback wala useEffect handle karega
    const urlParams =
      new URLSearchParams(
        window.location.search
      );

    const urlToken =
      urlParams.get("token");

    if (urlToken) {
      return;
    }

    // Normal saved login
    if (
      savedToken &&
      savedUser
    ) {
      try {
        const parsedUser =
          JSON.parse(savedUser);

        setUser(parsedUser);

        setShowDashboard(true);

        fetchSchoolData(
          savedToken
        );
      } catch (error) {
        console.error(
          "RESTORE LOGIN ERROR:",
          error
        );

        localStorage.removeItem(
          "token"
        );

        localStorage.removeItem(
          "user"
        );

        setUser(null);
      }
    }
  }, []);

  // =========================================
  // DARK MODE
  // =========================================

  useEffect(() => {
    localStorage.setItem(
      "darkMode",
      darkMode
    );
  }, [darkMode]);

  // =========================================
  // NORMAL EMAIL AUTH
  // =========================================

  const handleAuth = async () => {
    setAuthMessage("");

    // =====================================
    // VALIDATION
    // =====================================

    if (!email || !password) {
      setAuthMessage(
        "Please enter email and password"
      );

      return;
    }

    if (!isLogin) {
      if (!name) {
        setAuthMessage(
          "Please enter your name"
        );

        return;
      }

      if (
        password !==
        confirmPassword
      ) {
        setAuthMessage(
          "Passwords do not match"
        );

        return;
      }
    }

    try {
      setLoading(true);

      // =====================================
      // ENDPOINT
      // =====================================

      const endpoint = isLogin
        ? `${API}/api/auth/login`
        : `${API}/api/auth/register`;

      // =====================================
      // REQUEST BODY
      // =====================================

      const body = isLogin
        ? {
            email,
            password,
          }
        : {
            name,
            email,
            password,
          };

      // =====================================
      // API REQUEST
      // =====================================

      const response =
        await fetch(
          endpoint,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify(
              body
            ),
          }
        );

      const data =
        await response.json();

      // =====================================
      // ERROR
      // =====================================

      if (!response.ok) {
        setAuthMessage(
          data.message ||
            "Authentication failed"
        );

        return;
      }

      // =====================================
      // SAVE TOKEN
      // =====================================

      localStorage.setItem(
        "token",
        data.token
      );

      // =====================================
      // SAVE USER
      // =====================================

      localStorage.setItem(
        "user",
        JSON.stringify(
          data.user
        )
      );

      // =====================================
      // UPDATE STATE
      // =====================================

      setUser(
        data.user
      );

      setAuthMessage(
        isLogin
          ? "Login successful 🎉"
          : "Account created successfully 🎉"
      );

      // =====================================
      // CLEAR FORM
      // =====================================

      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");

      // =====================================
      // OPEN DASHBOARD
      // =====================================

      setTimeout(
        async () => {
          setShowAuth(false);

          setShowDashboard(true);

          await fetchSchoolData(
            data.token
          );
        },
        700
      );
    } catch (error) {
      console.error(
        "AUTH ERROR:",
        error
      );

      setAuthMessage(
        "Cannot connect to backend server"
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================
  // FETCH SCHOOL DATA FROM MONGODB
  // =========================================

  const fetchSchoolData = async (
    customToken = null
  ) => {
    const token =
      customToken ||
      localStorage.getItem(
        "token"
      );

    if (!token) {
      return;
    }

    try {
      setDataLoading(true);

      const response =
        await fetch(
          `${API}/api/schools/all`,
          {
            method: "GET",

            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        setUploadMessage(
          result.message ||
            "Failed to fetch school data"
        );

        return;
      }

      setSchoolData(
        result.data || []
      );
    } catch (error) {
      console.error(
        "FETCH SCHOOL DATA ERROR:",
        error
      );

      setUploadMessage(
        "Failed to connect to backend"
      );
    } finally {
      setDataLoading(false);
    }
  };

  // =========================================
  // FILE SELECT
  // =========================================

  const handleFileChange = (
    event
  ) => {
    const file =
      event.target.files[0];

    if (!file) {
      return;
    }

    setSelectedFile(file);

    setUploadMessage(
      `Selected: ${file.name}`
    );
  };

  // =========================================
  // UPLOAD SCHOOL DATA
  // =========================================

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadMessage(
        "Please select a CSV or Excel file first."
      );

      return;
    }

    const token =
      localStorage.getItem(
        "token"
      );

    if (!token) {
      setUploadMessage(
        "Please login first."
      );

      return;
    }

    try {
      setUploading(true);

      setUploadMessage(
        "Uploading and analyzing..."
      );

      const formData =
        new FormData();

      formData.append(
        "file",
        selectedFile
      );

      const response =
        await fetch(
          `${API}/api/schools/upload`,
          {
            method: "POST",

            headers: {
              Authorization:
                `Bearer ${token}`,
            },

            body: formData,
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        setUploadMessage(
          result.message ||
            "Failed to upload data."
        );

        return;
      }

      setUploadMessage(
        `${result.message} (${result.count} records added)`
      );

      setSelectedFile(
        null
      );

      const fileInput =
        document.getElementById(
          "school-file"
        );

      if (fileInput) {
        fileInput.value = "";
      }

      setAiResults({});

      await fetchSchoolData(
        token
      );
    } catch (error) {
      console.error(
        "UPLOAD ERROR:",
        error
      );

      setUploadMessage(
        "Failed to connect to backend"
      );
    } finally {
      setUploading(false);
    }
  };

  // =========================================
  // AI ANALYSIS
  // =========================================

  const handleAIAnalysis =
    async (school) => {
      const token =
        localStorage.getItem(
          "token"
        );

      if (!token) {
        setUploadMessage(
          "Please login first."
        );

        return;
      }

      const schoolId =
        school._id;

      try {
        setAiLoading(
          (prev) => ({
            ...prev,

            [schoolId]:
              true,
          })
        );

        setUploadMessage(
          `🤖 AI is analyzing ${
            school.schoolName ||
            "school"
          }...`
        );

        const response =
          await fetch(
            `${ML_API}/predict`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",

                Authorization:
                  `Bearer ${token}`,
              },

              body: JSON.stringify(
                {
                  schoolName:
                    school.schoolName,

                  students:
                    Number(
                      school.students ||
                        0
                    ),

                  waterConsumption:
                    Number(
                      school.waterConsumption ||
                        0
                    ),

                  electricityConsumption:
                    Number(
                      school.electricityConsumption ||
                        0
                    ),

                  greenArea:
                    Number(
                      school.greenArea ||
                        0
                    ),

                  wasteGenerated:
                    Number(
                      school.wasteGenerated ||
                        0
                    ),
                }
              ),
            }
          );

        const result =
          await response.json();

        if (!response.ok) {
          throw new Error(
            result.message ||
              "AI analysis failed"
          );
        }

        // =====================================
        // SHOW AI RESULT
        // =====================================

        setAiResults(
          (prev) => ({
            ...prev,

            [schoolId]:
              result,
          })
        );

        // =====================================
        // SAVE AI RESULT TO MONGODB
        // =====================================

        try {
          const score =
            result.sustainabilityScore ??
            result.score ??
            result.prediction;

          const risk =
            result.riskLevel ??
            result.risk ??
            "High";

          const recommendations =
            Array.isArray(
              result.recommendations
            )
              ? result.recommendations
              : [];

          if (
            score !==
              undefined &&
            score !==
              null
          ) {
            const saveResponse =
              await fetch(
                `${API}/api/schools/${schoolId}/ai-result`,
                {
                  method: "PUT",

                  headers: {
                    "Content-Type":
                      "application/json",

                    Authorization:
                      `Bearer ${token}`,
                  },

                  body: JSON.stringify(
                    {
                      sustainabilityScore:
                        Number(
                          score
                        ),

                      riskLevel:
                        String(
                          risk
                        ),

                      recommendations:
                        recommendations,
                    }
                  ),
                }
              );

            if (
              !saveResponse.ok
            ) {
              console.warn(
                "AI result could not be saved to MongoDB"
              );
            }
          }
        } catch (
          saveError
        ) {
          console.error(
            "SAVE AI RESULT ERROR:",
            saveError
          );
        }

        setUploadMessage(
          "AI analysis completed successfully 🎉"
        );
      } catch (error) {
        console.error(
          "AI ANALYSIS ERROR:",
          error
        );

        setUploadMessage(
          "AI service is not available. Please make sure Python ML server is running on port 8000."
        );
      } finally {
        setAiLoading(
          (prev) => ({
            ...prev,

            [schoolId]:
              false,
          })
        );
      }
    };

  // =========================================
  // DELETE ALL SCHOOL DATA
  // =========================================

  const handleDeleteAll =
    async () => {
      const confirmDelete =
        window.confirm(
          "Are you sure you want to delete all your school data?"
        );

      if (!confirmDelete) {
        return;
      }

      const token =
        localStorage.getItem(
          "token"
        );

      if (!token) {
        setUploadMessage(
          "Please login first."
        );

        return;
      }

      try {
        setDataLoading(
          true
        );

        const response =
          await fetch(
            `${API}/api/schools/all`,
            {
              method: "DELETE",

              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );

        const result =
          await response.json();

        if (!response.ok) {
          setUploadMessage(
            result.message ||
              "Failed to delete data"
          );

          return;
        }

        setSchoolData([]);

        setAiResults({});

        setUploadMessage(
          `Deleted ${result.deletedCount} records successfully.`
        );
      } catch (error) {
        console.error(
          "DELETE ERROR:",
          error
        );

        setUploadMessage(
          "Failed to connect to backend"
        );
      } finally {
        setDataLoading(
          false
        );
      }
    };

  // =========================================
  // LOGOUT
  // =========================================

  const handleLogout = () => {
    localStorage.removeItem(
      "token"
    );

    localStorage.removeItem(
      "user"
    );

    setUser(null);

    setSchoolData([]);

    setAiResults({});

    setShowDashboard(false);

    setShowAuth(false);

    setAuthMessage("");

    setName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");

    setUploadMessage("");
  };

  // =========================================
  // OPEN DASHBOARD
  // =========================================

  const openDashboard = () => {
    const token =
      localStorage.getItem(
        "token"
      );

    if (!token) {
      setIsLogin(true);

      setAuthMessage(
        "Please login or create an account to access the dashboard."
      );

      setShowAuth(true);

      return;
    }

    setShowDashboard(true);

    fetchSchoolData(
      token
    );
  };

  // =========================================
  // CALCULATIONS
  // =========================================

  const totalStudents =
    schoolData.reduce(
      (sum, item) =>
        sum +
        Number(
          item.students ||
            0
        ),
      0
    );

  const totalWater =
    schoolData.reduce(
      (sum, item) =>
        sum +
        Number(
          item.waterConsumption ||
            0
        ),
      0
    );

  const totalElectricity =
    schoolData.reduce(
      (sum, item) =>
        sum +
        Number(
          item.electricityConsumption ||
            0
        ),
      0
    );

  // =========================================
  // DASHBOARD VIEW
  // =========================================

  if (
    showDashboard &&
    user
  ) {
    return (
      <div
        className={
          darkMode
            ? "app dark"
            : "app"
        }
      >
        {/* NAVBAR */}

        <nav className="navbar dashboard-nav">
          <div className="logo">
            <span className="logo-icon">
              🌱
            </span>

            <span>
              EduSustain{" "}
              <b>AI</b>
            </span>
          </div>

          <div className="dashboard-nav-right">
            <button
              className="theme-btn"
              onClick={() =>
                setDarkMode(
                  !darkMode
                )
              }
            >
              {darkMode
                ? "☀️"
                : "🌙"}
            </button>

            <span className="welcome-user">
              Hi,{" "}
              {user.name ||
                user.email ||
                "User"}
            </span>

            <button
              className="logout-btn"
              onClick={
                handleLogout
              }
            >
              Logout
            </button>
          </div>
        </nav>

        {/* DASHBOARD */}

        <main className="dashboard">
          <div className="dashboard-heading">
            <div>
              <span className="dashboard-label">
                AI SUSTAINABILITY DASHBOARD
              </span>

              <h1>
                Welcome back,{" "}
                {user.name ||
                  user.email}{" "}
                👋
              </h1>

              <p>
                Monitor your
                school's
                sustainability
                performance
                using real
                MongoDB data
                and AI
                intelligence.
              </p>
            </div>

            <button
              className="back-btn"
              onClick={() =>
                setShowDashboard(
                  false
                )
              }
            >
              ← Back Home
            </button>
          </div>

          {/* STATS */}

          <div className="stats-grid">
            <div className="stat-card">
              <span>
                🏫
              </span>

              <strong>
                {
                  schoolData.length
                }
              </strong>

              <small>
                Schools
              </small>
            </div>

            <div className="stat-card">
              <span>
                👨‍🎓
              </span>

              <strong>
                {totalStudents.toLocaleString()}
              </strong>

              <small>
                Total Students
              </small>
            </div>

            <div className="stat-card">
              <span>
                💧
              </span>

              <strong>
                {totalWater.toLocaleString()}
              </strong>

              <small>
                Water Consumption
              </small>
            </div>

            <div className="stat-card">
              <span>
                ⚡
              </span>

              <strong>
                {totalElectricity.toLocaleString()}
              </strong>

              <small>
                Electricity
              </small>
            </div>
          </div>

          {/* UPLOAD */}

          <section className="upload-card">
            <div>
              <span className="section-tag">
                DATA MANAGEMENT
              </span>

              <h2>
                Upload School Data
              </h2>

              <p>
                Upload CSV, XLS
                or XLSX files to
                analyze your
                school's
                sustainability
                performance.
              </p>
            </div>

            <div className="upload-controls">
              <input
                id="school-file"
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={
                  handleFileChange
                }
              />

              <button
                className="primary-btn"
                onClick={
                  handleUpload
                }
                disabled={
                  uploading
                }
              >
                {uploading
                  ? "Uploading..."
                  : "Upload & Analyze →"}
              </button>
            </div>

            {uploadMessage && (
              <div className="upload-message">
                {
                  uploadMessage
                }
              </div>
            )}
          </section>

          {/* DATA */}

          <section className="data-section">
            <div className="data-header">
              <div>
                <span className="section-tag">
                  MONGODB DATA
                </span>

                <h2>
                  📋 Uploaded
                  School Data
                </h2>
              </div>

              <div className="data-actions">
                <button
                  className="refresh-btn"
                  onClick={() =>
                    fetchSchoolData()
                  }
                >
                  🔄 Refresh
                  Data
                </button>

                <button
                  className="delete-btn"
                  onClick={
                    handleDeleteAll
                  }
                >
                  🗑 Delete My
                  Data
                </button>
              </div>
            </div>

            {dataLoading ? (
              <div className="empty-state">
                Loading data...
              </div>
            ) : schoolData.length ===
              0 ? (
              <div className="empty-state">
                <div>
                  📊
                </div>

                <h3>
                  No school data
                  found
                </h3>

                <p>
                  Upload your CSV
                  or Excel file to
                  see real data
                  from MongoDB
                  here.
                </p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>
                        School
                      </th>

                      <th>
                        Students
                      </th>

                      <th>
                        Water
                      </th>

                      <th>
                        Electricity
                      </th>

                      <th>
                        Green Area
                      </th>

                      <th>
                        Waste
                      </th>

                      <th>
                        AI Analysis
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {schoolData.map(
                      (
                        item,
                        index
                      ) => {
                        const ai =
                          aiResults[
                            item._id
                          ];

                        return (
                          <tr
                            key={
                              item._id ||
                              index
                            }
                          >
                            <td>
                              <strong>
                                {
                                  item.schoolName ||
                                  "Unknown School"
                                }
                              </strong>
                            </td>

                            <td>
                              {Number(
                                item.students ||
                                  0
                              ).toLocaleString()}
                            </td>

                            <td>
                              {Number(
                                item.waterConsumption ||
                                  0
                              ).toLocaleString()}
                            </td>

                            <td>
                              {Number(
                                item.electricityConsumption ||
                                  0
                              ).toLocaleString()}
                            </td>

                            <td>
                              {Number(
                                item.greenArea ||
                                  0
                              ).toLocaleString()}
                            </td>

                            <td>
                              {Number(
                                item.wasteGenerated ||
                                  0
                              ).toLocaleString()}
                            </td>

                            <td className="ai-cell">
                              <button
                                className="ai-analyze-btn"
                                onClick={() =>
                                  handleAIAnalysis(
                                    item
                                  )
                                }
                                disabled={
                                  aiLoading[
                                    item._id
                                  ]
                                }
                              >
                                {aiLoading[
                                  item._id
                                ]
                                  ? "🤖 Analyzing..."
                                  : "🤖 Analyze AI"}
                              </button>

                              {ai && (
                                <div className="ai-result-box">
                                  <div className="ai-score">
                                    🌱 Score:

                                    <strong>
                                      {
                                        ai.sustainabilityScore ??
                                        ai.score ??
                                        ai.prediction ??
                                        "N/A"
                                      }
                                    </strong>

                                    {(
                                      ai.sustainabilityScore ??
                                      ai.score
                                    ) !==
                                      undefined &&
                                      ai.prediction ===
                                        undefined
                                      ? "/100"
                                      : ""}
                                  </div>

                                  <div className="ai-risk">
                                    ⚠️ Risk:

                                    <strong>
                                      {
                                        ai.riskLevel ??
                                        ai.risk ??
                                        "N/A"
                                      }
                                    </strong>
                                  </div>

                                  {ai.recommendations &&
                                    Array.isArray(
                                      ai.recommendations
                                    ) && (
                                      <div className="ai-recommendations">
                                        <strong>
                                          💡 AI
                                          Recommendations
                                        </strong>

                                        <ul>
                                          {ai.recommendations.map(
                                            (
                                              recommendation,
                                              recommendationIndex
                                            ) => (
                                              <li
                                                key={
                                                  recommendationIndex
                                                }
                                              >
                                                {
                                                  recommendation
                                                }
                                              </li>
                                            )
                                          )}
                                        </ul>
                                      </div>
                                    )}
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* FOOTER */}

          <div className="dashboard-footer">
            <div>
              🌱 EduSustain AI
            </div>

            <p>
              AI-powered
              intelligence for
              sustainable and
              resilient schools.
            </p>
          </div>
        </main>
      </div>
    );
  }

  // =========================================
  // LANDING PAGE
  // =========================================

  return (
    <div
      className={
        darkMode
          ? "app dark"
          : "app"
      }
    >
      {/* NAVBAR */}

      <nav className="navbar">
        <div className="logo">
          <span className="logo-icon">
            🌱
          </span>

          <span>
            EduSustain{" "}
            <b>AI</b>
          </span>
        </div>

        <div className="nav-links">
          <a href="#features">
            Features
          </a>

          <a href="#how-it-works">
            How It Works
          </a>

          <a href="#about">
            About
          </a>
        </div>

        <div className="nav-buttons">
          <button
            className="theme-btn"
            onClick={() =>
              setDarkMode(
                !darkMode
              )
            }
          >
            {darkMode
              ? "☀️"
              : "🌙"}
          </button>

          <button
            className="login-btn"
            onClick={() => {
              setIsLogin(true);

              setAuthMessage("");

              setShowAuth(true);
            }}
          >
            Log In
          </button>

          <button
            className="signup-btn"
            onClick={() => {
              setIsLogin(false);

              setAuthMessage("");

              setShowAuth(true);
            }}
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* HERO */}

      <section className="hero">
        <div className="hero-content">
          <div className="badge">
            ✨ AI-Powered
            Sustainable
            Education
          </div>

          <h1>
            Building Smarter,
            <span>
              Sustainable Schools.
            </span>
          </h1>

          <p>
            EduSustain AI helps
            schools understand
            their water usage,
            sustainability
            performance and
            infrastructure risks
            using intelligent data
            analytics and machine
            learning.
          </p>

          <div className="hero-buttons">
            <button
              className="primary-btn"
              onClick={
                openDashboard
              }
            >
              Explore Dashboard →
            </button>

            <button
              className="secondary-btn"
              onClick={() =>
                document
                  .getElementById(
                    "features"
                  )
                  ?.scrollIntoView({
                    behavior:
                      "smooth",
                  })
              }
            >
              Learn More
            </button>
          </div>

          <div className="trust-text">
            🌍 Data-driven
            decisions for a
            sustainable future
          </div>
        </div>

        <div className="hero-visual">
          <div className="glow"></div>

          <div className="dashboard-card">
            <div className="card-header">
              <div>
                <small>
                  School
                  Sustainability
                </small>

                <h3>
                  AI Overview
                </h3>
              </div>

              <span className="status">
                ● Live
              </span>
            </div>

            <div className="score">
              <div className="score-circle">
                <strong>
                  87
                </strong>

                <span>
                  /100
                </span>
              </div>

              <div className="score-info">
                <h4>
                  Excellent
                </h4>

                <p>
                  AI Sustainability
                </p>
              </div>
            </div>

            <div className="stats">
              <div>
                <span>
                  💧
                </span>

                <strong>
                  72%
                </strong>

                <small>
                  Water Efficiency
                </small>
              </div>

              <div>
                <span>
                  🌱
                </span>

                <strong>
                  91%
                </strong>

                <small>
                  Sustainability
                </small>
              </div>

              <div>
                <span>
                  🤖
                </span>

                <strong>
                  Low
                </strong>

                <small>
                  Risk Level
                </small>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}

      <section
        className="features-section"
        id="features"
      >
        <div className="section-heading">
          <span>
            POWERFUL INTELLIGENCE
          </span>

          <h2>
            Everything Your School
            Needs
          </h2>

          <p>
            Transform raw school
            data into meaningful
            insights, predictions
            and actionable
            sustainability
            decisions.
          </p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">
              💧
            </div>

            <h3>
              Water Intelligence
            </h3>

            <p>
              Monitor water
              consumption and
              identify wastage using
              intelligent analytics.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              🤖
            </div>

            <h3>
              AI Predictions
            </h3>

            <p>
              Machine learning
              models predict future
              risks and
              sustainability trends.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              🌱
            </div>

            <h3>
              Sustainability Score
            </h3>

            <p>
              Measure your school's
              sustainability
              performance through
              intelligent scoring.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              📊
            </div>

            <h3>
              Smart Analytics
            </h3>

            <p>
              Convert complex
              datasets into
              beautiful,
              understandable visual
              insights.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              🗺️
            </div>

            <h3>
              GIS Mapping
            </h3>

            <p>
              Visualize schools and
              infrastructure through
              interactive maps.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              ⚡
            </div>

            <h3>
              AutoML Engine
            </h3>

            <p>
              Upload your dataset
              and let AI automatically
              train and select the
              best model.
            </p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}

      <section
        className="how-section"
        id="how-it-works"
      >
        <div className="section-heading">
          <span>
            SIMPLE PROCESS
          </span>

          <h2>
            From Data to
            Intelligence
          </h2>
        </div>

        <div className="steps">
          <div className="step">
            <div className="step-number">
              01
            </div>

            <h3>
              Upload Data
            </h3>

            <p>
              Upload your school's
              CSV or Excel dataset.
            </p>
          </div>

          <div className="step">
            <div className="step-number">
              02
            </div>

            <h3>
              AI Analyzes
            </h3>

            <p>
              Our system
              automatically processes
              your data.
            </p>
          </div>

          <div className="step">
            <div className="step-number">
              03
            </div>

            <h3>
              Train AI
            </h3>

            <p>
              AutoML tests different
              machine learning
              models.
            </p>
          </div>

          <div className="step">
            <div className="step-number">
              04
            </div>

            <h3>
              Get Insights
            </h3>

            <p>
              Receive predictions
              and actionable
              recommendations.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}

      <section className="cta-section">
        <div className="cta-content">
          <span>
            READY TO BUILD A
            BETTER FUTURE?
          </span>

          <h2>
            Turn Your School
            Data
            <br />
            Into Smart Decisions.
          </h2>

          <p>
            Start your journey
            towards smarter and
            more sustainable
            educational
            infrastructure.
          </p>

          <button
            className="primary-btn"
            onClick={
              openDashboard
            }
          >
            Get Started with
            EduSustain AI →
          </button>
        </div>
      </section>

      {/* FOOTER */}
{/*   


{/* =========================================
    FOOTER
========================================= */}

<footer id="about">

  <div className="footer-logo">
    🌱 EduSustain{" "}
    <b>AI</b>
  </div>

  <p>
    AI-powered
    intelligence for
    sustainable and
    resilient schools.
  </p>

  <div className="footer-bottom">

    <p>
      © 2026 EduSustain AI.
      Built for a sustainable future.
    </p>

    <p className="team-credit">
      Made with ❤️ by{" "}
      <strong>
        Team DIVYA DRISHTI
      </strong>
    </p>

    <p className="developer-credit">
      Lead Developer:{" "}
      <strong>
        ROHAN RAJ CHAUDHARY
      </strong>
    </p>

  </div>

</footer>


      {/* <footer id="about">
        <div className="footer-logo">
          🌱 EduSustain{" "}
          <b>AI</b>
        </div> */}

        {/* <p>
          AI-powered
          intelligence for
          sustainable and
          resilient schools.
        </p> */}

        {/* <div className="footer-bottom">
          © 2026 EduSustain AI.
          Built for a sustainable
          future.
        </div>
      </footer> */}

      {/* AUTH MODAL */}

      {showAuth && (
        <div className="auth-overlay">
          <div className="auth-card">
            <button
              className="close-btn"
              onClick={() =>
                setShowAuth(
                  false
                )
              }
            >
              ✕
            </button>

            <div className="auth-logo">
              🌱
            </div>

            <h2>
              {isLogin
                ? "Welcome Back!"
                : "Create Your Account"}
            </h2>

            <p className="auth-subtitle">
              {isLogin
                ? "Login to access your sustainability dashboard."
                : "Join EduSustain AI and start analyzing your school data."}
            </p>

            {/* ================================= */}
            {/* GOOGLE LOGIN */}
            {/* ================================= */}

            <button
              className="google-btn"
              onClick={
                handleGoogleLogin
              }
              disabled={loading}
            >
              <span>
                G
              </span>

              {loading
                ? "Connecting to Google..."
                : "Continue with Google"}
            </button>

            <div className="divider">
              <span>
                OR
              </span>
            </div>

            {/* NAME */}

            {!isLogin && (
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) =>
                  setName(
                    e.target.value
                  )
                }
              />
            )}

            {/* EMAIL */}

            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) =>
                setEmail(
                  e.target.value
                )
              }
            />

            {/* PASSWORD */}

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) =>
                setPassword(
                  e.target.value
                )
              }
            />

            {/* CONFIRM PASSWORD */}

            {!isLogin && (
              <input
                type="password"
                placeholder="Confirm Password"
                value={
                  confirmPassword
                }
                onChange={(e) =>
                  setConfirmPassword(
                    e.target.value
                  )
                }
              />
            )}

            {/* SUBMIT */}

            <button
              className="auth-submit"
              onClick={
                handleAuth
              }
              disabled={
                loading
              }
            >
              {loading
                ? "Please wait..."
                : isLogin
                ? "Login to Dashboard"
                : "Create Account"}
            </button>

            {/* MESSAGE */}

            {authMessage && (
              <p className="auth-message">
                {
                  authMessage
                }
              </p>
            )}

            {/* SWITCH */}

            <p className="switch-auth">
              {isLogin
                ? "Don't have an account?"
                : "Already have an account?"}

              <button
                onClick={() => {
                  setIsLogin(
                    !isLogin
                  );

                  setAuthMessage(
                    ""
                  );
                }}
              >
                {isLogin
                  ? " Create Account"
                  : " Login"}
              </button>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;