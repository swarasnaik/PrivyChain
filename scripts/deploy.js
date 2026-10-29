#!/usr/bin/env node
/**
 * scripts/deploy.js
 *
 * Production deployment script for PrivyChain contracts on MST Coral Testnet.
 *
 * Deployment Order:
 * 1. PrivyCredentialRegistry(deployer.address)
 * 2. PrivyPermissionManager(registryAddress)
 *
 * SAFETY NOTICE:
 * This script submits real transactions and spends gas.
 * ONLY run when deployment has been explicitly approved!
 *
 * Usage:
 *   npx hardhat run scripts/deploy.js --network mstTestnet
 */

const { ethers, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("==================================================");
  console.log(" PrivyChain - Smart Contract Deployment");
  console.log("==================================================");
  console.log(`Target Network:  ${network.name} (Chain ID: ${network.config.chainId})`);

  const [deployer] = await ethers.getSigners();
  if (!deployer) {
    throw new Error(
      "No deployer account configured. Please set DEPLOYER_PRIVATE_KEY in your .env file."
    );
  }

  const deployerAddress = await deployer.getAddress();
  const balance = await ethers.provider.getBalance(deployerAddress);
  const balanceEth = ethers.formatEther(balance);

  console.log(`Deployer Wallet: ${deployerAddress}`);
  console.log(`Account Balance: ${balanceEth} tMSTC`);

  if (balance === 0n) {
    throw new Error(
      `Deployer account ${deployerAddress} has 0 tMSTC. Request funds from the MST Coral Testnet faucet (https://coral-faucet.mstblockchain.com) before deployment.`
    );
  }

  // ---------------------------------------------------------------------------
  // Step 1: Deploy PrivyCredentialRegistry
  // ---------------------------------------------------------------------------
  console.log("\n[1/2] Deploying PrivyCredentialRegistry...");
  if (!ethers.isAddress(deployerAddress) || deployerAddress === ethers.ZeroAddress) {
    throw new Error("Invalid deployer address for initialOwner constructor argument.");
  }

  const CredentialRegistryFactory = await ethers.getContractFactory("PrivyCredentialRegistry");
  const registry = await CredentialRegistryFactory.deploy(deployerAddress);
  await registry.waitForDeployment();

  const registryAddress = await registry.getAddress();
  const registryTxHash = registry.deploymentTransaction()?.hash || "unknown";

  console.log(`[✔] PrivyCredentialRegistry deployed!`);
  console.log(` - Contract Address: ${registryAddress}`);
  console.log(` - Tx Hash:          ${registryTxHash}`);
  console.log(` - Explorer:         https://coral.mstscan.com/address/${registryAddress}`);

  // ---------------------------------------------------------------------------
  // Step 2: Deploy PrivyPermissionManager
  // ---------------------------------------------------------------------------
  console.log("\n[2/2] Deploying PrivyPermissionManager...");
  if (!ethers.isAddress(registryAddress) || registryAddress === ethers.ZeroAddress) {
    throw new Error("Invalid registry address for PrivyPermissionManager constructor argument.");
  }

  const PermissionManagerFactory = await ethers.getContractFactory("PrivyPermissionManager");
  const permissionManager = await PermissionManagerFactory.deploy(registryAddress);
  await permissionManager.waitForDeployment();

  const managerAddress = await permissionManager.getAddress();
  const managerTxHash = permissionManager.deploymentTransaction()?.hash || "unknown";

  console.log(`[✔] PrivyPermissionManager deployed!`);
  console.log(` - Contract Address: ${managerAddress}`);
  console.log(` - Linked Registry:  ${await permissionManager.registry()}`);
  console.log(` - Tx Hash:          ${managerTxHash}`);
  console.log(` - Explorer:         https://coral.mstscan.com/address/${managerAddress}`);

  // ---------------------------------------------------------------------------
  // Step 3: Record Deployment Artifacts
  // ---------------------------------------------------------------------------
  const deploymentRecord = {
    network: network.name,
    chainId: network.config.chainId,
    deployedAt: new Date().toISOString(),
    deployer: deployerAddress,
    contracts: {
      PrivyCredentialRegistry: {
        address: registryAddress,
        transactionHash: registryTxHash,
        constructorArgs: [deployerAddress],
        explorerUrl: `https://coral.mstscan.com/address/${registryAddress}`,
      },
      PrivyPermissionManager: {
        address: managerAddress,
        transactionHash: managerTxHash,
        constructorArgs: [registryAddress],
        explorerUrl: `https://coral.mstscan.com/address/${managerAddress}`,
      },
    },
  };

  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const recordPath = path.join(deploymentsDir, `${network.name}.json`);
  fs.writeFileSync(recordPath, JSON.stringify(deploymentRecord, null, 2), "utf8");
  console.log(`\n[✔] Saved deployment record to: ${recordPath}`);

  // Update abis/network-config.json
  const networkConfigFile = path.join(__dirname, "..", "abis", "network-config.json");
  if (fs.existsSync(networkConfigFile)) {
    const netConfig = JSON.parse(fs.readFileSync(networkConfigFile, "utf8"));
    netConfig.contracts.PrivyCredentialRegistry.address = registryAddress;
    netConfig.contracts.PrivyCredentialRegistry.status = "Deployed";
    netConfig.contracts.PrivyPermissionManager.address = managerAddress;
    netConfig.contracts.PrivyPermissionManager.status = "Deployed";
    fs.writeFileSync(networkConfigFile, JSON.stringify(netConfig, null, 2), "utf8");
    console.log(`[✔] Updated abis/network-config.json with live contract addresses.`);
  }

  console.log("\n==================================================");
  console.log(" Deployment Completed Successfully!");
  console.log("==================================================");
}

main().catch((error) => {
  console.error("\n[✖] Deployment failed:", error);
  process.exitCode = 1;
});
