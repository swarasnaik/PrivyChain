/**
 * backend/src/routes/credentialRoutes.js
 *
 * Read-only routes for inspecting on-chain credential commitments.
 */

const express = require("express");
const router = express.Router();
const blockchainService = require("../services/blockchainService");
const { isBytes32, sendSuccess, sendError } = require("../utils/validation");

/**
 * GET /api/credentials/:credentialId/status
 * Queries on-chain status of a credential commitment.
 */
router.get("/:credentialId/status", async (req, res) => {
  const { credentialId } = req.params;

  if (!isBytes32(credentialId)) {
    return sendError(res, "Invalid credentialId parameter: must be a 32-byte hex string (0x...).", 400);
  }

  try {
    const result = await blockchainService.getCredentialStatus(credentialId);
    return sendSuccess(res, result, "Credential status queried successfully.");
  } catch (err) {
    return sendError(res, err.message, 500);
  }
});

module.exports = router;
