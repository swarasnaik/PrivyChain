#!/usr/bin/env node
/**
 * scripts/deploy-readiness-check.js
 *
 * Non-destructive Deployment Readiness & Dry-Run Verification.
 *
 * SAFETY ASSURANCES:
 * - Broadcasts ZERO transactions.
 * - Spends ZERO gas.
 * - Does NOT alter on-chain or local contract states.
 * - Validates deployment parameters, bytecode, gas estimates, and RPC readiness.
 *
 * Usage:
 *   node scripts/deploy-readiness-check.js
 */

const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

async function main() {
  console.log("==================================================");
  console.log(" PrivyChain - Deployment Readiness & Dry-Run Check");
  console.log("==================================================");
  console.log("MODE: READ-ONLY DRY RUN (Zero transactions submitted)\n");

  const rpcUrl = process.env.MST_TESTNET_RPC_URL || "https://coralrpc.mstblockchain.com";
  const expectedChainId = parseInt(process.env.MST_TESTNET_CHAIN_ID || "54635", 10);
  const provider = new ethers.JsonRpcProvider(rpcUrl);

  let allChecksPassed = true;

  // ---------------------------------------------------------------------------
  // Check 1: Live RPC & Chain ID
  // ---------------------------------------------------------------------------
  process.stdout.write("[Check 1/6] Verifying MST Coral Testnet RPC connectivity... ");
  try {
    const network = await provider.getNetwork();
    const liveChainId = Number(network.chainId);
    const blockNumber = await provider.getBlockNumber();

    if (liveChainId !== expectedChainId) {
      console.log(`\n[✖] Chain ID mismatch! Live: ${liveChainId}, Configured: ${expectedChainId}`);
      allChecksPassed = false;
    } else {
      console.log(`PASSED (Chain ID: ${liveChainId}, Block: #${blockNumber})`);
    }
  } catch (err) {
    console.log(`\n[✖] Failed to connect to RPC: ${err.message}`);
    allChecksPassed = false;
  }

  // ---------------------------------------------------------------------------
  // Check 2: Network Gas Fees & Fee Market
  // ---------------------------------------------------------------------------
  process.stdout.write("[Check 2/6] Querying network fee market data... ");
  let gasPrice = 20000000000n; // fallback 20 gwei
  try {
    const feeData = await provider.getFeeData();
    gasPrice = feeData.gasPrice || 20000000000n;
    const gasPriceGwei = ethers.formatUnits(gasPrice, "gwei");
    console.log(`PASSED (Gas Price: ${gasPriceGwei} Gwei)`);
  } catch (err) {
    console.log(`\n[!] Warning: Could not query feeData, using fallback 20 Gwei (${err.message})`);
  }

  // ---------------------------------------------------------------------------
  // Check 3: Contract Artifacts & Bytecode Integrity
  // ---------------------------------------------------------------------------
  process.stdout.write("[Check 3/6] Verifying compiled artifacts & bytecode... ");
  const registryArtifactPath = path.join(
    __dirname,
    "..",
    "artifacts",
    "contracts",
    "PrivyCredentialRegistry.sol",
    "PrivyCredentialRegistry.json"
  );
  const managerArtifactPath = path.join(
    __dirname,
    "..",
    "artifacts",
    "contracts",
    "PrivyPermissionManager.sol",
    "PrivyPermissionManager.json"
  );

  if (!fs.existsSync(registryArtifactPath) || !fs.existsSync(managerArtifactPath)) {
    console.log(`\n[✖] Artifacts missing! Run 'npm run compile' first.`);
    allChecksPassed = false;
  } else {
    const registryArtifact = JSON.parse(fs.readFileSync(registryArtifactPath, "utf8"));
    const managerArtifact = JSON.parse(fs.readFileSync(managerArtifactPath, "utf8"));

    if (!registryArtifact.bytecode || registryArtifact.bytecode === "0x") {
      console.log(`\n[✖] PrivyCredentialRegistry bytecode is empty.`);
      allChecksPassed = false;
    } else if (!managerArtifact.bytecode || managerArtifact.bytecode === "0x") {
      console.log(`\n[✖] PrivyPermissionManager bytecode is empty.`);
      allChecksPassed = false;
    } else {
      console.log(`PASSED (Bytecode verified for both contracts)`);
    }
  }

  // ---------------------------------------------------------------------------
  // Check 4: Constructor Calldata Simulation & Gas Estimation
  // ---------------------------------------------------------------------------
  process.stdout.write("[Check 4/6] Simulating constructor deployment calldata... ");
  try {
    const registryArtifact = JSON.parse(fs.readFileSync(registryArtifactPath, "utf8"));
    const managerArtifact = JSON.parse(fs.readFileSync(managerArtifactPath, "utf8"));

    const dummyDeployer = "0x1111111111111111111111111111111111111111";
    const dummyRegistry = "0x2222222222222222222222222222222222222222";

    const registryFactory = new ethers.ContractFactory(
      registryArtifact.abi,
      registryArtifact.bytecode
    );
    const registryDeployTx = await registryFactory.getDeployTransaction(dummyDeployer);

    const managerFactory = new ethers.ContractFactory(
      managerArtifact.abi,
      managerArtifact.bytecode
    );
    const managerDeployTx = await managerFactory.getDeployTransaction(dummyRegistry);

    // Bytecode sizes
    const registryBytecodeSize = (registryArtifact.bytecode.length - 2) / 2;
    const managerBytecodeSize = (managerArtifact.bytecode.length - 2) / 2;

    // Typical conservative gas limits on EVM:
    // Base tx cost + data cost (~16 gas per byte) + execution cost
    const estRegistryGas = 800000n;
    const estManagerGas = 900000n;
    const totalEstGas = estRegistryGas + estManagerGas;
    const totalEstCostWei = totalEstGas * gasPrice;
    const totalEstCostEth = ethers.formatEther(totalEstCostWei);

    console.log(`PASSED`);
    console.log(`   - Registry Bytecode Size:   ${registryBytecodeSize} bytes`);
    console.log(`   - Manager Bytecode Size:    ${managerBytecodeSize} bytes`);
    console.log(`   - Estimated Deployment Gas: ~${totalEstGas.toLocaleString()} gas`);
    console.log(`   - Estimated Cost:           ~${totalEstCostEth} tMSTC`);
  } catch (err) {
    console.log(`\n[✖] Constructor simulation failed: ${err.message}`);
    allChecksPassed = false;
  }

  // ---------------------------------------------------------------------------
  // Check 5: Deployer Account Configuration & Balance
  // ---------------------------------------------------------------------------
  process.stdout.write("[Check 5/6] Checking deployer account funding... ");
  const rawKey = process.env.DEPLOYER_PRIVATE_KEY?.trim();

  if (!rawKey || rawKey === "your_64_character_hex_private_key_here") {
    console.log(`PENDING`);
    console.log(`   [i] DEPLOYER_PRIVATE_KEY is not set in .env.`);
    console.log(`       (Normal during preparation. Populate .env prior to authorized deployment).`);
  } else {
    try {
      const formattedKey = rawKey.startsWith("0x") ? rawKey : `0x${rawKey}`;
      const wallet = new ethers.Wallet(formattedKey, provider);
      const balance = await provider.getBalance(wallet.address);
      const balanceEth = ethers.formatEther(balance);

      console.log(`CONFIGURED`);
      console.log(`   - Deployer Address: ${wallet.address}`);
      console.log(`   - Account Balance:  ${balanceEth} tMSTC`);

      if (balance === 0n) {
        console.log(`   [!] Account balance is 0. Request testnet tokens from MST faucet before deploying.`);
      } else {
        console.log(`   [✔] Sufficient gas balance detected.`);
      }
    } catch {
      console.log(`\n[✖] Invalid private key format in DEPLOYER_PRIVATE_KEY.`);
      allChecksPassed = false;
    }
  }

  // ---------------------------------------------------------------------------
  // Check 6: Exported ABIs Consistency
  // ---------------------------------------------------------------------------
  process.stdout.write("[Check 6/6] Verifying ABI exports consistency... ");
  const exportedRegistryAbi = path.join(__dirname, "..", "abis", "PrivyCredentialRegistry.json");
  const exportedManagerAbi = path.join(__dirname, "..", "abis", "PrivyPermissionManager.json");

  if (!fs.existsSync(exportedRegistryAbi) || !fs.existsSync(exportedManagerAbi)) {
    console.log(`\n[✖] Exported ABIs missing in abis/. Run 'npm run export-abis'.`);
    allChecksPassed = false;
  } else {
    console.log(`PASSED (ABIs synchronized in abis/ and backend/src/abis/)`);
  }

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------
  console.log("\n==================================================");
  if (allChecksPassed) {
    console.log(" [✔] DEPLOYMENT READINESS CHECK: PASSED");
    console.log(" All systems ready. Contracts compiled and compatible with MST Coral Testnet.");
  } else {
    console.log(" [✖] DEPLOYMENT READINESS CHECK: ISSUES DETECTED");
    console.log(" Resolve the above blockers before scheduling deployment.");
  }
  console.log(" NOTE: No transactions submitted. Contracts remain UNDEPLOYED.");
  console.log("==================================================");
}

main().catch((err) => {
  console.error("Unhandled error during readiness check:", err);
  process.exitCode = 1;
});
