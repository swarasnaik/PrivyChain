#!/usr/bin/env node
/**
 * scripts/testnet-probe.js
 *
 * Read-only network connectivity and balance probe for MST Coral Testnet.
 * Safely inspects chain state without sending transactions or modifying state.
 *
 * Usage:
 *   npx hardhat run scripts/testnet-probe.js --network mstTestnet
 *   OR
 *   node scripts/testnet-probe.js [optional_address_to_check]
 */

const { ethers } = require("ethers");
require("dotenv").config();

async function main() {
  const rpcUrl = process.env.MST_TESTNET_RPC_URL || "https://coralrpc.mstblockchain.com";
  const expectedChainId = parseInt(process.env.MST_TESTNET_CHAIN_ID || "54635", 10);

  console.log("==================================================");
  console.log(" PrivyChain - MST Coral Testnet Connectivity Probe");
  console.log("==================================================");
  console.log(`Connecting to RPC: ${rpcUrl}`);

  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);

    // 1. Verify network connection and Chain ID
    const network = await provider.getNetwork();
    const liveChainId = Number(network.chainId);
    const blockNumber = await provider.getBlockNumber();

    console.log(`\n[✔] Connected to MST Coral Testnet successfully!`);
    console.log(` - Live Chain ID:      ${liveChainId} (0x${liveChainId.toString(16)})`);
    console.log(` - Expected Chain ID:  ${expectedChainId}`);
    console.log(` - Current Block:      #${blockNumber}`);

    if (liveChainId !== expectedChainId) {
      console.warn(`\n[!] Warning: Live Chain ID (${liveChainId}) differs from configured (${expectedChainId}).`);
      console.warn(`    Update your .env MST_TESTNET_CHAIN_ID to ${liveChainId}.`);
    } else {
      console.log(` - Chain ID Match:     VERIFIED`);
    }

    // 2. Resolve account address to check balance
    let targetAddress = process.argv[2];

    if (!targetAddress && process.env.DEPLOYER_PRIVATE_KEY) {
      const rawKey = process.env.DEPLOYER_PRIVATE_KEY.trim();
      if (rawKey && rawKey !== "your_64_character_hex_private_key_here") {
        const formattedKey = rawKey.startsWith("0x") ? rawKey : `0x${rawKey}`;
        try {
          const wallet = new ethers.Wallet(formattedKey);
          targetAddress = wallet.address;
          console.log(`\n[i] Derived address from DEPLOYER_PRIVATE_KEY: ${targetAddress}`);
        } catch {
          console.warn("\n[!] Warning: Invalid private key format in DEPLOYER_PRIVATE_KEY.");
        }
      }
    }

    // 3. Query balance if an address is provided
    if (targetAddress && ethers.isAddress(targetAddress)) {
      const balance = await provider.getBalance(targetAddress);
      const balanceInMST = ethers.formatEther(balance);
      console.log(`\nAccount Balance for ${targetAddress}:`);
      console.log(` - Balance:            ${balanceInMST} tMSTC`);

      if (balance === 0n) {
        console.log(`\n[!] Note: Account has 0 tMSTC. Request testnet tokens from the MST Faucet before deployment.`);
      } else {
        console.log(`[✔] Account has sufficient gas funds for contract deployment.`);
      }
    } else {
      console.log("\n[i] No target address queried for balance.");
      console.log("    To check a balance, either set DEPLOYER_PRIVATE_KEY in .env, or run:");
      console.log("    node scripts/testnet-probe.js <wallet_address>");
    }

    console.log("\nProbe completed successfully.");
    console.log("==================================================");
  } catch (error) {
    console.error(`\n[✖] Connection failed: ${error.message}`);
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error("Unhandled probe error:", err);
  process.exitCode = 1;
});
