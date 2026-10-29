/**
 * backend/src/routes/networkRoutes.js
 *
 * Provides public network and contract configuration for frontend dApps.
 */

const express = require("express");
const router = express.Router();
const config = require("../config");
const { sendSuccess } = require("../utils/validation");

router.get("/network-config", (req, res) => {
  return sendSuccess(res, {
    networkName: config.chainName,
    chainId: config.chainId,
    chainIdHex: `0x${config.chainId.toString(16)}`,
    rpcUrl: config.rpcUrl,
    explorerUrl: config.explorerUrl,
    contracts: {
      registryAddress: config.contracts.registryAddress || "PENDING_DEPLOYMENT",
      permissionManagerAddress: config.contracts.permissionManagerAddress || "PENDING_DEPLOYMENT",
    },
  }, "Network configuration retrieved.");
});

module.exports = router;
