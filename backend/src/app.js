/**
 * backend/src/app.js
 *
 * Express application configuration and route registration.
 */

const express = require("express");
const cors = require("cors");

const healthRoutes = require("./routes/healthRoutes");
const credentialRoutes = require("./routes/credentialRoutes");
const permissionRoutes = require("./routes/permissionRoutes");
const metadataRoutes = require("./routes/metadataRoutes");
const networkRoutes = require("./routes/networkRoutes");
const { sendError } = require("./utils/validation");

const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: "50kb" })); // Restrict payload size defensively

// API Routes
app.use("/api", healthRoutes);
app.use("/api", networkRoutes);
app.use("/api/credentials", credentialRoutes);
app.use("/api/permissions", permissionRoutes);
app.use("/api/metadata", metadataRoutes);

// 404 Handler
app.use((req, res) => {
  return sendError(res, `Route not found: ${req.method} ${req.originalUrl}`, 404);
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Internal Server Error:", err);
  return sendError(res, err.message || "Internal server error", 500);
});

module.exports = app;
