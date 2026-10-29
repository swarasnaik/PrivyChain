/**
 * backend/src/utils/validation.js
 *
 * Strict parameter validation helpers and standardized API response formats.
 */

const { isAddress } = require("ethers");

/**
 * Validates whether an input is a valid 32-byte hex string (bytes32).
 * e.g., 0x + 64 hexadecimal characters.
 */
function isBytes32(value) {
  if (typeof value !== "string") return false;
  return /^0x[0-9a-fA-F]{64}$/.test(value.trim());
}

/**
 * Standardized success response envelope.
 */
function sendSuccess(res, data = {}, message = "Success", statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Standardized error response envelope.
 */
function sendError(res, error = "An error occurred", statusCode = 400, details = null) {
  const payload = {
    success: false,
    error,
    timestamp: new Date().toISOString(),
  };
  if (details) {
    payload.details = details;
  }
  return res.status(statusCode).json(payload);
}

module.exports = {
  isAddress,
  isBytes32,
  sendSuccess,
  sendError,
};
