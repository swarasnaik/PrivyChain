/**
 * backend/src/routes/permissionRoutes.js
 *
 * Read-only routes for checking on-chain permission grant status.
 *
 * NOTE ON ARCHITECTURAL SEPARATION:
 * - This backend provides READ-ONLY verification helpers.
 * - Granting or revoking permissions requires the subject's private key signature
 *   and MUST be executed directly from the user's wallet (e.g., MetaMask) to the
 *   PrivyPermissionManager smart contract.
 * - The backend CANNOT grant or revoke permissions.
 */

const express = require("express");
const router = express.Router();
const blockchainService = require("../services/blockchainService");
const { isAddress, isBytes32, sendSuccess, sendError } = require("../utils/validation");

/**
 * GET /api/permissions/check
 * Query parameters:
 *   - subject: Wallet address of credential owner
 *   - verifier: Wallet address of requesting verifier
 *   - credentialId: 32-byte hex commitment ID
 *   - scope: 32-byte hex scope identifier
 */
router.get("/check", async (req, res) => {
  const { subject, verifier, credentialId, scope } = req.query;

  if (!subject || !isAddress(subject)) {
    return sendError(res, "Missing or invalid 'subject' address parameter.", 400);
  }
  if (!verifier || !isAddress(verifier)) {
    return sendError(res, "Missing or invalid 'verifier' address parameter.", 400);
  }
  if (!credentialId || !isBytes32(credentialId)) {
    return sendError(res, "Missing or invalid 'credentialId' bytes32 parameter.", 400);
  }
  if (!scope || !isBytes32(scope)) {
    return sendError(res, "Missing or invalid 'scope' bytes32 parameter.", 400);
  }

  try {
    const result = await blockchainService.checkPermission(subject, verifier, credentialId, scope);
    return sendSuccess(res, result, "Permission status checked successfully.");
  } catch (err) {
    return sendError(res, err.message, 500);
  }
});

module.exports = router;
