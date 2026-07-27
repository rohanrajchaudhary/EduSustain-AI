const express = require("express");
const multer = require("multer");
const XLSX = require("xlsx");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

const SchoolData = require("../models/SchoolData");

const router = express.Router();

// =====================================================
// UPLOAD DIRECTORY
// =====================================================

const uploadDir = path.join(__dirname, "..", "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, {
    recursive: true,
  });
}

// =====================================================
// MULTER
// =====================================================

const upload = multer({
  dest: uploadDir,

  limits: {
    fileSize: 10 * 1024 * 1024,
  },

  fileFilter: (req, file, cb) => {
    const allowedExtensions = [
      ".csv",
      ".xlsx",
      ".xls",
    ];

    const extension = path
      .extname(file.originalname)
      .toLowerCase();

    if (!allowedExtensions.includes(extension)) {
      return cb(
        new Error(
          "Only CSV, XLSX and XLS files are supported."
        )
      );
    }

    cb(null, true);
  },
});

// =====================================================
// NUMBER CONVERTER
// =====================================================

function toNumber(value) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return 0;
  }

  const cleaned = String(value)
    .replace(/,/g, "")
    .replace(/[^\d.-]/g, "");

  const number = Number(cleaned);

  return Number.isFinite(number)
    ? number
    : 0;
}

// =====================================================
// DELETE TEMP FILE
// =====================================================

function deleteFile(filePath) {
  try {
    if (
      filePath &&
      fs.existsSync(filePath)
    ) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.log(
      "File delete error:",
      error.message
    );
  }
}

// =====================================================
// JWT USER ID
// =====================================================

function getUserIdFromToken(req) {
  try {
    const authHeader =
      req.headers.authorization;

    if (
      !authHeader ||
      !authHeader.startsWith("Bearer ")
    ) {
      return null;
    }

    const token =
      authHeader.split(" ")[1];

    if (!token) {
      return null;
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    return decoded.id || null;
  } catch (error) {
    console.log(
      "JWT Error:",
      error.message
    );

    return null;
  }
}

// =====================================================
// NORMALIZE HEADER
// =====================================================

function normalizeHeader(header) {
  return String(header || "")
    .toLowerCase()
    .trim()
    .replace(/[\s_-]+/g, "");
}

// =====================================================
// FIND COLUMN INDEX
// =====================================================

function findColumnIndex(headers, possibleNames) {
  const normalizedHeaders =
    headers.map(normalizeHeader);

  for (
    const possibleName of possibleNames
  ) {
    const normalizedName =
      normalizeHeader(possibleName);

    const index =
      normalizedHeaders.indexOf(
        normalizedName
      );

    if (index !== -1) {
      return index;
    }
  }

  // Partial matching
  for (
    let i = 0;
    i < normalizedHeaders.length;
    i++
  ) {
    for (
      const possibleName of possibleNames
    ) {
      const normalizedName =
        normalizeHeader(possibleName);

      if (
        normalizedHeaders[i].includes(
          normalizedName
        ) ||
        normalizedName.includes(
          normalizedHeaders[i]
        )
      ) {
        return i;
      }
    }
  }

  return -1;
}

// =====================================================
// DETECT COLUMNS
// =====================================================

function detectColumns(headers) {
  return {
    schoolName: findColumnIndex(
      headers,
      [
        "school",
        "school name",
        "schoolname",
        "name",
        "institution",
        "institution name",
        "school title",
      ]
    ),

    students: findColumnIndex(
      headers,
      [
        "students",
        "student",
        "total students",
        "total student",
        "number of students",
        "no of students",
        "student count",
        "enrollment",
        "enrolment",
      ]
    ),

    waterConsumption: findColumnIndex(
      headers,
      [
        "water",
        "water consumption",
        "water usage",
        "water use",
        "water consumed",
        "water consumption liters",
        "water usage liters",
      ]
    ),

    electricityConsumption:
      findColumnIndex(
        headers,
        [
          "electricity",
          "electricity consumption",
          "electricity usage",
          "electricity use",
          "power consumption",
          "energy consumption",
          "electricity consumption kwh",
          "energy",
        ]
      ),

    greenArea: findColumnIndex(
      headers,
      [
        "green area",
        "greenarea",
        "green space",
        "green space area",
        "greenery",
        "green land",
        "green area sqm",
        "green area m2",
      ]
    ),

    wasteGenerated: findColumnIndex(
      headers,
      [
        "waste",
        "waste generated",
        "waste generation",
        "waste produced",
        "total waste",
        "waste generated kg",
        "waste kg",
      ]
    ),
  };
}

// =====================================================
// CSV PARSER
// =====================================================

function parseCSV(text) {
  const cleanText = text
    .replace(/^\uFEFF/, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");

  const lines =
    cleanText
      .split("\n")
      .filter(
        (line) =>
          line.trim().length > 0
      );

  if (lines.length < 2) {
    return [];
  }

  function parseCSVLine(line) {
    const values = [];

    let current = "";

    let insideQuotes = false;

    for (
      let i = 0;
      i < line.length;
      i++
    ) {
      const char = line[i];

      if (char === '"') {
        if (
          insideQuotes &&
          line[i + 1] === '"'
        ) {
          current += '"';

          i++;
        } else {
          insideQuotes =
            !insideQuotes;
        }
      } else if (
        char === "," &&
        !insideQuotes
      ) {
        values.push(
          current.trim()
        );

        current = "";
      } else {
        current += char;
      }
    }

    values.push(
      current.trim()
    );

    return values;
  }

  const headers =
    parseCSVLine(lines[0]);

  const rows = [];

  for (
    let i = 1;
    i < lines.length;
    i++
  ) {
    const row =
      parseCSVLine(lines[i]);

    if (
      row.some(
        (value) =>
          String(value).trim() !== ""
      )
    ) {
      rows.push(row);
    }
  }

  return {
    headers,
    rows,
  };
}

// =====================================================
// CREATE SCHOOL RECORD
// =====================================================

function createSchoolRecord(
  row,
  columnMap,
  originalName,
  uploadedBy
) {
  const schoolName =
    columnMap.schoolName !== -1
      ? String(
          row[columnMap.schoolName] ||
            ""
        ).trim()
      : "";

  // School name is required by MongoDB
  if (!schoolName) {
    return null;
  }

  return {
    schoolName,

    students:
      columnMap.students !== -1
        ? toNumber(
            row[columnMap.students]
          )
        : 0,

    waterConsumption:
      columnMap.waterConsumption !== -1
        ? toNumber(
            row[
              columnMap.waterConsumption
            ]
          )
        : 0,

    electricityConsumption:
      columnMap.electricityConsumption !== -1
        ? toNumber(
            row[
              columnMap
                .electricityConsumption
            ]
          )
        : 0,

    greenArea:
      columnMap.greenArea !== -1
        ? toNumber(
            row[columnMap.greenArea]
          )
        : 0,

    wasteGenerated:
      columnMap.wasteGenerated !== -1
        ? toNumber(
            row[
              columnMap.wasteGenerated
            ]
          )
        : 0,

    sourceFile:
      originalName,

    uploadedBy:
      uploadedBy,
  };
}

// =====================================================
// UPLOAD SCHOOL DATA
// =====================================================

router.post(
  "/upload",
  upload.single("file"),
  async (req, res) => {
    let filePath = null;

    try {
      // =================================================
      // CHECK FILE
      // =================================================

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message:
            "Please upload a CSV or Excel file.",
        });
      }

      filePath =
        req.file.path;

      const originalName =
        req.file.originalname;

      const extension =
        path
          .extname(originalName)
          .toLowerCase();

      // =================================================
      // GET USER FROM JWT
      // =================================================

      const uploadedBy =
        getUserIdFromToken(req);

      if (!uploadedBy) {
        deleteFile(filePath);

        return res.status(401).json({
          success: false,
          message:
            "Please login again.",
        });
      }

      // =================================================
      // VALIDATE USER ID
      // =================================================

      if (
        !mongoose.Types.ObjectId.isValid(
          uploadedBy
        )
      ) {
        deleteFile(filePath);

        return res.status(401).json({
          success: false,
          message:
            "Invalid user authentication.",
        });
      }

      // =================================================
      // COLUMN DATA
      // =================================================

      let headers = [];

      let rows = [];

      // =================================================
      // CSV
      // =================================================

      if (extension === ".csv") {
        const csvText =
          fs.readFileSync(
            filePath,
            "utf8"
          );

        const parsed =
          parseCSV(csvText);

        if (
          !parsed ||
          !parsed.headers ||
          !parsed.rows
        ) {
          deleteFile(filePath);

          return res.status(400).json({
            success: false,
            message:
              "CSV file is empty or invalid.",
          });
        }

        headers =
          parsed.headers;

        rows =
          parsed.rows;
      }

      // =================================================
      // EXCEL
      // =================================================

      else {
        const workbook =
          XLSX.readFile(
            filePath
          );

        if (
          !workbook.SheetNames ||
          workbook.SheetNames.length === 0
        ) {
          deleteFile(filePath);

          return res.status(400).json({
            success: false,
            message:
              "Excel file does not contain any sheet.",
          });
        }

        const sheetName =
          workbook.SheetNames[0];

        const worksheet =
          workbook.Sheets[
            sheetName
          ];

        const excelRows =
          XLSX.utils.sheet_to_json(
            worksheet,
            {
              header: 1,
              defval: "",
              raw: false,
            }
          );

        if (
          excelRows.length < 2
        ) {
          deleteFile(filePath);

          return res.status(400).json({
            success: false,
            message:
              "Excel file does not contain valid data.",
          });
        }

        headers =
          excelRows[0];

        rows =
          excelRows.slice(1);
      }

      // =================================================
      // DETECT COLUMNS
      // =================================================

      const columnMap =
        detectColumns(headers);

      console.log(
        "========================================"
      );

      console.log(
        "📊 DETECTED SCHOOL DATA COLUMNS"
      );

      console.log(
        "Headers:",
        headers
      );

      console.log(
        "Column Map:",
        columnMap
      );

      console.log(
        "========================================"
      );

      // =================================================
      // SCHOOL NAME REQUIRED
      // =================================================

      if (
        columnMap.schoolName === -1
      ) {
        deleteFile(filePath);

        return res.status(400).json({
          success: false,

          message:
            "Could not detect School Name column.",

          detectedColumns:
            columnMap,

          supportedSchoolHeaders: [
            "School",
            "School Name",
            "SchoolName",
            "Institution",
            "Name",
          ],
        });
      }

      // =================================================
      // CREATE RECORDS
      // =================================================

      const schoolRecords =
        rows
          .map((row) =>
            createSchoolRecord(
              row,
              columnMap,
              originalName,
              uploadedBy
            )
          )
          .filter(
            (record) =>
              record !== null
          );

      // =================================================
      // NO RECORDS
      // =================================================

      if (
        schoolRecords.length === 0
      ) {
        deleteFile(filePath);

        return res.status(400).json({
          success: false,

          message:
            "No valid school records found. Please check your School Name column and data.",

          detectedColumns:
            columnMap,
        });
      }

      // =================================================
      // SAVE MONGODB
      // =================================================

      const savedRecords =
        await SchoolData.insertMany(
          schoolRecords
        );

      // =================================================
      // DELETE TEMP FILE
      // =================================================

      deleteFile(filePath);

      // =================================================
      // RESPONSE
      // =================================================

      return res.status(201).json({
        success: true,

        message:
          "School data uploaded successfully 🎉",

        count:
          savedRecords.length,

        detectedColumns:
          columnMap,

        data:
          savedRecords,
      });
    } catch (error) {
      console.error(
        "UPLOAD ERROR:",
        error
      );

      deleteFile(filePath);

      return res.status(500).json({
        success: false,

        message:
          error.message ||
          "Failed to process school data.",

        error:
          error.message,
      });
    }
  }
);

// =====================================================
// SAVE AI ANALYSIS RESULT
// =====================================================

router.put(
  "/:id/ai-result",
  async (req, res) => {
    try {
      const uploadedBy =
        getUserIdFromToken(req);

      if (!uploadedBy) {
        return res.status(401).json({
          success: false,
          message:
            "User authentication required.",
        });
      }

      if (
        !mongoose.Types.ObjectId.isValid(
          req.params.id
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid school data ID.",
        });
      }

      const {
        sustainabilityScore,
        score,
        riskLevel,
        risk,
        recommendations,
      } = req.body;

      const finalScore =
        sustainabilityScore !==
        undefined
          ? sustainabilityScore
          : score;

      const finalRisk =
        riskLevel ||
        risk ||
        "High";

      if (
        finalScore ===
          undefined ||
        finalScore === null
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Sustainability score is required.",
        });
      }

      const school =
        await SchoolData.findOne({
          _id:
            req.params.id,

          uploadedBy:
            uploadedBy,
        });

      if (!school) {
        return res.status(404).json({
          success: false,
          message:
            "School data not found.",
        });
      }

      // =================================================
      // SAVE AI DATA
      // =================================================

      school.sustainabilityScore =
        Number(finalScore);

      school.riskLevel =
        String(finalRisk);

      school.aiRecommendations =
        Array.isArray(
          recommendations
        )
          ? recommendations
          : [];

      school.aiAnalyzed =
        true;

      school.aiAnalyzedAt =
        new Date();

      await school.save();

      return res.json({
        success: true,

        message:
          "AI analysis saved successfully 🎉",

        data:
          school,
      });
    } catch (error) {
      console.error(
        "SAVE AI RESULT ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Failed to save AI analysis.",

        error:
          error.message,
      });
    }
  }
);

// =====================================================
// GET ALL SCHOOL DATA
// =====================================================

router.get(
  "/all",
  async (req, res) => {
    try {
      const uploadedBy =
        getUserIdFromToken(req);

      if (!uploadedBy) {
        return res.status(401).json({
          success: false,
          message:
            "User authentication required.",
        });
      }

      const data =
        await SchoolData.find({
          uploadedBy:
            uploadedBy,
        }).sort({
          createdAt: -1,
        });

      return res.json({
        success: true,

        count:
          data.length,

        data:
          data,
      });
    } catch (error) {
      console.error(
        "GET DATA ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Failed to fetch school data.",

        error:
          error.message,
      });
    }
  }
);

// =====================================================
// ANALYTICS API
// =====================================================

router.get(
  "/analytics",
  async (req, res) => {
    try {
      const uploadedBy =
        getUserIdFromToken(req);

      if (!uploadedBy) {
        return res.status(401).json({
          success: false,
          message:
            "User authentication required.",
        });
      }

      const data =
        await SchoolData.find({
          uploadedBy:
            uploadedBy,
        });

      // =================================================
      // TOTALS
      // =================================================

      const totalStudents =
        data.reduce(
          (sum, item) =>
            sum +
            Number(
              item.students || 0
            ),
          0
        );

      const totalWater =
        data.reduce(
          (sum, item) =>
            sum +
            Number(
              item.waterConsumption ||
                0
            ),
          0
        );

      const totalElectricity =
        data.reduce(
          (sum, item) =>
            sum +
            Number(
              item.electricityConsumption ||
                0
            ),
          0
        );

      const totalGreenArea =
        data.reduce(
          (sum, item) =>
            sum +
            Number(
              item.greenArea ||
                0
            ),
          0
        );

      const totalWaste =
        data.reduce(
          (sum, item) =>
            sum +
            Number(
              item.wasteGenerated ||
                0
            ),
          0
        );

      // =================================================
      // BASIC SUSTAINABILITY SCORE
      // =================================================

      let sustainabilityScore = 0;

      if (
        data.length > 0
      ) {
        const waterScore =
          totalWater > 0
            ? Math.min(
                100,
                (totalStudents *
                  50) /
                  totalWater
              )
            : 100;

        const greenScore =
          Math.min(
            100,
            totalGreenArea *
              5
          );

        const wasteScore =
          totalWaste > 0
            ? Math.max(
                0,
                100 -
                  totalWaste /
                    10
              )
            : 100;

        sustainabilityScore =
          Math.round(
            (waterScore +
              greenScore +
              wasteScore) /
              3
          );

        sustainabilityScore =
          Math.max(
            0,
            Math.min(
              100,
              sustainabilityScore
            )
          );
      }

      // =================================================
      // AI SCORE AVERAGE
      // =================================================

      const analyzedSchools =
        data.filter(
          (item) =>
            item.aiAnalyzed === true
        );

      let averageAIScore = 0;

      if (
        analyzedSchools.length > 0
      ) {
        const totalAIScore =
          analyzedSchools.reduce(
            (sum, item) =>
              sum +
              Number(
                item.sustainabilityScore ||
                  0
              ),
            0
          );

        averageAIScore =
          Math.round(
            totalAIScore /
              analyzedSchools.length
          );
      }

      // =================================================
      // RESPONSE
      // =================================================

      return res.json({
        success: true,

        summary: {
          totalSchools:
            data.length,

          totalStudents:
            totalStudents,

          totalWater:
            totalWater,

          totalElectricity:
            totalElectricity,

          totalGreenArea:
            totalGreenArea,

          totalWaste:
            totalWaste,

          sustainabilityScore:
            sustainabilityScore,

          analyzedSchools:
            analyzedSchools.length,

          averageAIScore:
            averageAIScore,
        },

        chartData:
          data.map(
            (item) => ({
              schoolName:
                item.schoolName ||
                "Unknown School",

              students:
                Number(
                  item.students ||
                    0
                ),

              waterConsumption:
                Number(
                  item.waterConsumption ||
                    0
                ),

              electricityConsumption:
                Number(
                  item.electricityConsumption ||
                    0
                ),

              greenArea:
                Number(
                  item.greenArea ||
                    0
                ),

              wasteGenerated:
                Number(
                  item.wasteGenerated ||
                    0
                ),

              sustainabilityScore:
                Number(
                  item.sustainabilityScore ||
                    0
                ),

              riskLevel:
                item.riskLevel ||
                "Not Analyzed",

              aiAnalyzed:
                item.aiAnalyzed ||
                false,
            })
          ),

        data:
          data,
      });
    } catch (error) {
      console.error(
        "ANALYTICS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Failed to generate analytics.",

        error:
          error.message,
      });
    }
  }
);

// =====================================================
// DELETE ALL USER DATA
// =====================================================

router.delete(
  "/all",
  async (req, res) => {
    try {
      const uploadedBy =
        getUserIdFromToken(req);

      if (!uploadedBy) {
        return res.status(401).json({
          success: false,
          message:
            "User authentication required.",
        });
      }

      const result =
        await SchoolData.deleteMany({
          uploadedBy:
            uploadedBy,
        });

      return res.json({
        success: true,

        message:
          "Your school data deleted successfully.",

        deletedCount:
          result.deletedCount,
      });
    } catch (error) {
      console.error(
        "DELETE ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Failed to delete school data.",

        error:
          error.message,
      });
    }
  }
);

// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports =
  router;