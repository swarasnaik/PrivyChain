/**
 * backend/src/routes/metadataRoutes.js
 *
 * Routes for storing and retrieving non-sensitive metadata envelopes.
 */

const express = require("express");
const router = express.Router();
const metadataService = require("../services/metadataService");
const { isBytes32, sendSuccess, sendError } = require("../utils/validation");

/**
 * POST /api/metadata
 * Body: { credentialId, schemaHash, schemaType, encryptedDataHash, encryptedDataUri, claimFields }
 */
router.post("/", (req, res) => {
  try {
    const envelope = metadataService.registerMetadata(req.body);
    return sendSuccess(res, envelope, "Metadata envelope registered successfully.", 201);
  } catch (err) {
    return sendError(res, err.message, 400);
  }
});

/**
 * GET /api/metadata/:credentialId
 */
router.get("/:credentialId", (req, res) => {
  const { credentialId } = req.params;

  if (!isBytes32(credentialId)) {
    return sendError(res, "Invalid credentialId parameter.", 400);
  }

  try {
    const record = metadataService.getMetadata(credentialId);
    if (!record) {
      return sendError(res, "Metadata envelope not found for the specified credentialId.", 404);
    }
    return sendSuccess(res, record, "Metadata envelope retrieved successfully.");
  } catch (err) {
    return sendError(res, err.message, 500);
  }
});

module.exports = router;
