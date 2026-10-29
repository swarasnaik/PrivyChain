# PrivyChain Deployment & Verification Runbook (MST Coral Testnet)

> **SAFETY NOTICE:**
> Contracts are currently **UNDEPLOYED**. Deployment will be executed only after explicit confirmation.

---

## 1. Network Parameters

* **Network Name:** MST Coral Testnet *(proposed buildathon target — confirm against the official buildathon network announcement)*
* **RPC URL:** `https://coralrpc.mstblockchain.com`
* **Chain ID:** `54635` (`0xd56b`)
* **Solidity EVM Target:** `paris`
* **Native Token:** `tMSTC` (18 Decimals)
* **Block Explorer:** `https://coral.mstscan.com`
* **Faucet:** `https://coral-faucet.mstblockchain.com`

---

## 2. Required Environment Variables

Before executing deployment, create a `.env` file from `.env.example`:

```bash
cp .env.example .env
```

Ensure `.env` contains:
```env
# Network Target
MST_TESTNET_RPC_URL=https://coralrpc.mstblockchain.com
MST_TESTNET_CHAIN_ID=54635
MST_TESTNET_EXPLORER_URL=https://coral.mstscan.com

# Deployer Credentials (MUST hold at least 0.05 tMSTC for gas)
# Do NOT include '0x' prefix; NEVER commit this file or expose the private key.
DEPLOYER_PRIVATE_KEY=your_64_character_hex_private_key_here
```

---

## 3. Constructor Parameters & Deployment Order

The contracts must be deployed in strict sequential order:

```
Step 1: Deploy PrivyCredentialRegistry
        Constructor parameter: initialOwner (address) -> deployer.address
        ▼
Step 2: Deploy PrivyPermissionManager
        Constructor parameter: registryAddress (address) -> address from Step 1
```

### Detailed Parameter Matrix

| Contract | Constructor Arguments | Description |
| :--- | :--- | :--- |
| **`PrivyCredentialRegistry`** | `address initialOwner` | The deployer's address; receives `Ownable2Step` administrator rights to manage institutional issuer allowlists. |
| **`PrivyPermissionManager`** | `address registryAddress` | The immutable on-chain address of the `PrivyCredentialRegistry` deployed in Step 1. |

---

## 4. Gas & Cost Projections

Based on compiled contract bytecode sizes and current MST Testnet fee metrics (1.0 Gwei):

| Contract | Bytecode Size | Estimated Gas | Estimated Cost @ 1.0 Gwei | Estimated Cost @ 20 Gwei (Peak) |
| :--- | :--- | :--- | :--- | :--- |
| **`PrivyCredentialRegistry`** | 3,368 bytes | ~800,000 gas | ~0.0008 tMSTC | ~0.0160 tMSTC |
| **`PrivyPermissionManager`** | 3,593 bytes | ~900,000 gas | ~0.0009 tMSTC | ~0.0180 tMSTC |
| **Total Deployment** | **6,961 bytes** | **~1,700,000 gas** | **~0.0017 tMSTC** | **~0.0340 tMSTC** |

> **Recommended Minimum Faucet Balance:** `0.05 tMSTC` to cover deployment and initial test attestations.

---

## 5. Non-Destructive Readiness Check (Dry-Run)

Before submitting real transactions, execute the read-only dry run:

```bash
npm run deploy:check
```

This script:
1. Validates RPC connectivity to `https://coralrpc.mstblockchain.com`.
2. Confirms live Chain ID is `54635`.
3. Queries current network gas prices.
4. Verifies compiled bytecode and simulates constructor calldata locally.
5. Verifies deployer account balance without broadcasting transactions.
6. Ensures contract ABIs are synchronized.

---

## 6. Execution Command (When Authorized)

When deployment is explicitly approved:

```bash
npm run deploy:mst
# Equivalent to:
npx hardhat run scripts/deploy.js --network mstTestnet
```

### Automated Actions Performed by `deploy.js`:
1. Validates deployer funding (`balance > 0`).
2. Deploys `PrivyCredentialRegistry` and logs address & tx hash.
3. Deploys `PrivyPermissionManager` with the registry address and logs address & tx hash.
4. Records deployment receipt in `deployments/mstTestnet.json`.
5. Automatically updates `abis/network-config.json` with live contract addresses.

---

## 7. Post-Deployment Verification Steps

1. **Verify on MST Coral Explorer:**
   * Open `https://coral.mstscan.com/address/<REGISTRY_ADDRESS>`
   * Open `https://coral.mstscan.com/address/<PERMISSION_MANAGER_ADDRESS>`
   * Confirm contract creation transaction was mined with status `Success`.
2. **Propagate Addresses to Frontend & Backend:**
   * Update `frontend/.env`:
     ```env
     VITE_REGISTRY_CONTRACT_ADDRESS=<REGISTRY_ADDRESS>
     VITE_PERMISSION_MANAGER_CONTRACT_ADDRESS=<PERMISSION_MANAGER_ADDRESS>
     ```
   * Update `backend/.env`:
     ```env
     REGISTRY_CONTRACT_ADDRESS=<REGISTRY_ADDRESS>
     PERMISSION_MANAGER_CONTRACT_ADDRESS=<PERMISSION_MANAGER_ADDRESS>
     ```
3. **Run Post-Deployment Smoke Test:**
   * Query the live contract addresses using the probe:
     ```bash
     node scripts/testnet-probe.js <DEPLOYER_ADDRESS>
     ```
   * Open the explorer:
     ```
     https://coral.mstscan.com/address/<REGISTRY_ADDRESS>
     https://coral.mstscan.com/address/<PERMISSION_MANAGER_ADDRESS>
     ```
