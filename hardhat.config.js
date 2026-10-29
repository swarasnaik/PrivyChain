require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/**
 * Normalizes a hex private key string from environment variables.
 * Ensures the '0x' prefix is present and validates key length.
 */
function getAccounts() {
  const rawKey = process.env.DEPLOYER_PRIVATE_KEY?.trim();
  if (!rawKey || rawKey === "your_64_character_hex_private_key_here") {
    return [];
  }
  const formattedKey = rawKey.startsWith("0x") ? rawKey : `0x${rawKey}`;
  return [formattedKey];
}

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      // Target Paris EVM to avoid unsupported opcodes (e.g., PUSH0) on older/custom Geth testnets
      evmVersion: "paris",
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    // MST Coral Testnet (Chain ID: 54635 / 0xd56b)
    // Named mstTestnet for npm script compatibility (npm run deploy:mst uses --network mstTestnet)
    mstTestnet: {
      url: process.env.MST_TESTNET_RPC_URL || "https://coralrpc.mstblockchain.com",
      chainId: parseInt(process.env.MST_TESTNET_CHAIN_ID || "54635", 10),
      accounts: getAccounts(),
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  mocha: {
    timeout: 40000,
  },
};
