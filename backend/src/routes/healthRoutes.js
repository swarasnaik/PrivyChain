/**
 * backend/src/routes/healthRoutes.js
 *
 * Health and network status endpoints.
 */

const express = require("express");
const router = express.Router();
const blockchainService = require("../services/blockchainService");
const config = require("../config");
const { sendSuccess } = require("../utils/validation");

router.get("/health", async (req, res) => {
  const networkStatus = await blockchainService.getNetworkStatus();

  return sendSuccess(res, {
    status: "HEALTHY",
    service: "PrivyChain Backend Service",
    timestamp: new Date().toISOString(),
    network: {
      name: config.chainName,
      targetChainId: config.chainId,
      liveStatus: networkStatus,
    },
    configuredContracts: {
      registryAddress: config.contracts.registryAddress || "PENDING_DEPLOYMENT",
      permissionManagerAddress: config.contracts.permissionManagerAddress || "PENDING_DEPLOYMENT",
    },
  }, "PrivyChain service is healthy");
});

module.exports = router;
