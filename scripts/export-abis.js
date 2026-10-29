#!/usr/bin/env node
/**
 * scripts/export-abis.js
 *
 * Exports exact, compiled contract ABIs from Hardhat artifacts to dedicated
 * ABI directories for frontend integration and backend services.
 *
 * Usage:
 *   node scripts/export-abis.js
 */

const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const ARTIFACTS_DIR = path.join(ROOT_DIR, "artifacts", "contracts");

const TARGET_DIRS = [
  path.join(ROOT_DIR, "abis"),
  path.join(ROOT_DIR, "backend", "src", "abis"),
];

const CONTRACTS_TO_EXPORT = [
  {
    name: "PrivyCredentialRegistry",
    artifactPath: path.join(ARTIFACTS_DIR, "PrivyCredentialRegistry.sol", "PrivyCredentialRegistry.json"),
  },
  {
    name: "PrivyPermissionManager",
    artifactPath: path.join(ARTIFACTS_DIR, "PrivyPermissionManager.sol", "PrivyPermissionManager.json"),
  },
];

function main() {
  console.log("==================================================");
  console.log(" PrivyChain - Contract ABI Exporter");
  console.log("==================================================");

  // Ensure target directories exist
  TARGET_DIRS.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  const exportSummary = [];

  CONTRACTS_TO_EXPORT.forEach(({ name, artifactPath }) => {
    if (!fs.existsSync(artifactPath)) {
      console.error(`[✖] Artifact not found at: ${artifactPath}`);
      console.error("    Please run 'npm run compile' before exporting ABIs.");
      process.exit(1);
    }

    const rawArtifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    const abi = rawArtifact.abi;

    if (!Array.isArray(abi)) {
      console.error(`[✖] Invalid ABI format in artifact: ${name}`);
      process.exit(1);
    }

    TARGET_DIRS.forEach((targetDir) => {
      const outputPath = path.join(targetDir, `${name}.json`);
      fs.writeFileSync(outputPath, JSON.stringify(abi, null, 2), "utf8");
    });

    console.log(`[✔] Exported ${name}.json (${abi.length} ABI items)`);
    exportSummary.push({ name, itemsCount: abi.length });
  });

  // Export network specification and deployment placeholder metadata
  const networkConfig = {
    networkName: "MST Coral Testnet",
    chainId: 54635,
    chainIdHex: "0xd56b",
    rpcUrl: "https://coralrpc.mstblockchain.com",
    wsUrl: "wss://coralrpc.mstblockchain.com",
    currencySymbol: "tMSTC",
    blockExplorerUrl: "https://coral.mstscan.com",
    faucetUrl: "https://coral-faucet.mstblockchain.com",
    contracts: {
      PrivyCredentialRegistry: {
        address: "PENDING_DEPLOYMENT",
        status: "Undeployed - Pending deployment approval in Phase 6"
      },
      PrivyPermissionManager: {
        address: "PENDING_DEPLOYMENT",
        status: "Undeployed - Pending deployment approval in Phase 6"
      }
    },
    frontendEnvKeys: {
      rpcUrl: "VITE_MST_TESTNET_RPC_URL",
      chainId: "VITE_MST_TESTNET_CHAIN_ID",
      registryAddress: "VITE_REGISTRY_CONTRACT_ADDRESS",
      permissionManagerAddress: "VITE_PERMISSION_MANAGER_CONTRACT_ADDRESS"
    }
  };

  TARGET_DIRS.forEach((targetDir) => {
    const configPath = path.join(targetDir, "network-config.json");
    fs.writeFileSync(configPath, JSON.stringify(networkConfig, null, 2), "utf8");
  });

  console.log(`[✔] Exported network-config.json`);
  console.log("==================================================");
  console.log("ABI export completed successfully.");
}

main();
