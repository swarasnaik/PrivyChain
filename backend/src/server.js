/**
 * backend/src/server.js
 *
 * Server startup entry point.
 */

const app = require("./app");
const config = require("./config");

const server = app.listen(config.port, () => {
  console.log("==================================================");
  console.log(" PrivyChain Backend API Server");
  console.log("==================================================");
  console.log(` Server running on: http://localhost:${config.port}`);
  console.log(` Target Network:    ${config.chainName} (Chain ID: ${config.chainId})`);
  console.log(` RPC Endpoint:      ${config.rpcUrl}`);
  console.log(` Registry Contract: ${config.contracts.registryAddress || "PENDING_DEPLOYMENT"}`);
  console.log(` Permission Contract: ${config.contracts.permissionManagerAddress || "PENDING_DEPLOYMENT"}`);
  console.log(" Security:          Read-only node (Zero private keys)");
  console.log("==================================================");
});

module.exports = server;
