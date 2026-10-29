/**
 * backend/src/config/index.js
 *
 * Central configuration module for PrivyChain backend.
 * Loads environment variables without requiring or exposing private keys.
 */

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../../.env") });

const config = {
  port: parseInt(process.env.BACKEND_PORT || "4000", 10),
  rpcUrl: process.env.MST_TESTNET_RPC_URL || "https://coralrpc.mstblockchain.com",
  chainId: parseInt(process.env.MST_TESTNET_CHAIN_ID || "54635", 10),
  chainName: "MST Coral Testnet",
  explorerUrl: process.env.MST_TESTNET_EXPLORER_URL || "https://coral.mstscan.com",
  contracts: {
    registryAddress: process.env.REGISTRY_CONTRACT_ADDRESS || null,
    permissionManagerAddress: process.env.PERMISSION_MANAGER_CONTRACT_ADDRESS || null,
  },
};

module.exports = config;
