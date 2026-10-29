# PrivyChain Frontend Integration Guide

> **Target Audience:** React Frontend Developer / UI Teammate
> **Ecosystem:** MST Blockchain Buildathon
> **Status:** Contract ABIs Exported | Addresses: **PENDING DEPLOYMENT** (Phase 6)

---

## 1. Network Configuration & Environment Variables

When connecting to the blockchain, your frontend dApp must target the **MST Coral Testnet** (proposed buildathon target — confirm the official network before release):

| Parameter | Value |
| :--- | :--- |
| **Network Name** | MST Coral Testnet |
| **RPC URL** | `https://coralrpc.mstblockchain.com` |
| **WebSocket** | `wss://coralrpc.mstblockchain.com` |
| **Chain ID (Decimal)** | `54635` |
| **Chain ID (Hex)** | `0xd56b` |
| **Currency Symbol** | `tMSTC` (Decimals: 18) |
| **Block Explorer** | `https://coral.mstscan.com` |
| **Faucet** | `https://coral-faucet.mstblockchain.com` |

### Frontend `.env` Template
Create `.env` in your frontend project (e.g. Vite / Create-React-App / Next.js):
```env
# Network
VITE_MST_TESTNET_RPC_URL=https://coralrpc.mstblockchain.com
VITE_MST_TESTNET_CHAIN_ID=54635
VITE_MST_TESTNET_EXPLORER_URL=https://coral.mstscan.com

# Smart Contract Addresses (Populated after Phase 6 deployment)
VITE_REGISTRY_CONTRACT_ADDRESS=PENDING_DEPLOYMENT
VITE_PERMISSION_MANAGER_CONTRACT_ADDRESS=PENDING_DEPLOYMENT

# Backend API
VITE_BACKEND_API_URL=http://localhost:4000/api
```

---

## 2. ABI Files & Location

Exact, compiled ABIs have been generated directly from the Solidity build artifacts. Copy or import them from:
- `abis/PrivyCredentialRegistry.json` (31 ABI items)
- `abis/PrivyPermissionManager.json` (23 ABI items)
- `abis/network-config.json` (Network metadata)

Alternatively, re-generate them at any time with:
```bash
npm run export-abis
```

---

## 3. MetaMask Network Setup & Switching

Use the following snippet to programmatically prompt MetaMask to add/switch to MST Coral Testnet:

```javascript
export async function switchToMSTTestnet() {
  if (!window.ethereum) throw new Error("MetaMask not detected");

  const chainIdHex = "0xd56b"; // 54635 in hex

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: chainIdHex }],
    });
  } catch (switchError) {
    // Error code 4902 indicates that the chain has not been added to MetaMask
    if (switchError.code === 4902) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: chainIdHex,
            chainName: "MST Coral Testnet",
            nativeCurrency: {
              name: "tMSTC",
              symbol: "tMSTC",
              decimals: 18,
            },
            rpcUrls: ["https://coralrpc.mstblockchain.com"],
            blockExplorerUrls: ["https://coral.mstscan.com"],
          },
        ],
      });
    } else {
      throw switchError;
    }
  }
}
```

---

## 4. Contract Methods & Integration Matrix

### Role 1: User / Subject (Data Owner)

#### A. Grant Permission to a Requesting Organization (Verifier)
* **Contract:** `PrivyPermissionManager`
* **Type:** State-mutating Transaction (Requires MetaMask signature & gas)
* **Method:** `grantPermission(address verifier, bytes32 credentialId, bytes32 scope, uint64 validUntil)`
* **Parameters:**
  * `verifier` (`string`): Organization address (e.g., `0xVerifier...`)
  * `credentialId` (`string`): 32-byte hex commitment (`0x...`)
  * `scope` (`string`): 32-byte hex scope identifier (e.g., `ethers.id("READ_STUDENT_ENROLLMENT")`)
  * `validUntil` (`number` / `BigInt`): Unix epoch timestamp in seconds (must be in the future, and cannot exceed credential expiry)
* **Returns:** `bytes32 permissionId`
* **Example (ethers v6):**
```javascript
import { ethers } from "ethers";
import PermissionManagerABI from "../abis/PrivyPermissionManager.json";

const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();
const managerContract = new ethers.Contract(
  import.meta.env.VITE_PERMISSION_MANAGER_CONTRACT_ADDRESS,
  PermissionManagerABI,
  signer
);

const scopeBytes32 = ethers.id("READ_STUDENT_STATUS");
const validUntilTimestamp = Math.floor(Date.now() / 1000) + 86400; // 24 hours from now

const tx = await managerContract.grantPermission(
  verifierAddress,
  credentialId,
  scopeBytes32,
  validUntilTimestamp
);
await tx.wait(); // Wait for 1 confirmation
```

#### B. Revoke Permission
* **Contract:** `PrivyPermissionManager`
* **Type:** State-mutating Transaction (Requires MetaMask signature & gas)
* **Option 1 (By ID):** `revokePermission(bytes32 permissionId)`
* **Option 2 (By Tuple):** `revokePermission(address verifier, bytes32 credentialId, bytes32 scope)`
* **Example (ethers v6):**
```javascript
const tx = await managerContract["revokePermission(bytes32)"](permissionId);
await tx.wait();
```

---

### Role 2: Verifier (Requesting Organization)

#### Verify Active Access Permission
* **Contract:** `PrivyPermissionManager`
* **Type:** Read-Only Call (Instant, Free, No Gas)
* **Method:** `checkPermission(address subject, address verifier, bytes32 credentialId, bytes32 scope)`
* **Returns:** `boolean` (`true` if permission is granted, unexpired, unrevoked, and the underlying credential is valid; `false` otherwise)
* **Example (ethers v6):**
```javascript
const hasAccess = await managerContract.checkPermission(
  subjectAddress,
  verifierAddress,
  credentialId,
  scopeBytes32
);

if (hasAccess) {
  // Proceed to request encrypted data payload from backend or user
} else {
  // Display "Access Denied or Expired" in the UI
}
```

---

### Role 3: Institutional Issuer (School, Bank, Government)

#### Register Credential Commitment
* **Contract:** `PrivyCredentialRegistry`
* **Type:** State-mutating Transaction (Issuer role required)
* **Method:** `registerCredential(bytes32 credentialId, address subject, bytes32 schemaHash, uint64 validUntil)`
* **Note:** `validUntil = 0` creates a perpetual, non-expiring credential.

#### Revoke Credential Commitment
* **Contract:** `PrivyCredentialRegistry`
* **Type:** State-mutating Transaction
* **Method:** `revokeCredential(bytes32 credentialId, string reason)`

---

## 5. Event Subscriptions (Live UI Updates)

Listen to contract events to dynamically update permissions tables and badge statuses in the UI:

```javascript
// Listen for new permission grants
managerContract.on("PermissionGranted", (permissionId, subject, verifier, credentialId, scope, validUntil) => {
  console.log("Permission granted:", { permissionId, subject, verifier });
  refreshPermissionsTable();
});

// Listen for revocations
managerContract.on("PermissionRevoked", (permissionId, subject, verifier, credentialId, scope) => {
  console.log("Permission revoked:", permissionId);
  refreshPermissionsTable();
});
```

---

## 6. Privacy & UI UX Best Practices

1. **Never Ask for Plaintext Personal Data in Input Forms:**
   * Forms should take opaque credential IDs or allow users to pick from locally saved credential tokens.
2. **Always Generate Salts Client-Side:**
   * When registering or blinding credentials, generate random 32-byte salts using `crypto.getRandomValues(new Uint8Array(32))`. Store this salt in the user's browser `localStorage` (or indexedDB encrypted with user password).
3. **Display Expiry Warnings:**
   * Compare `validUntil * 1000` with `Date.now()`. Display badges:
     - 🟢 **Active** (`validUntil > now`)
     - 🟡 **Expiring Soon** (`validUntil - now < 3600 * 1000`)
     - 🔴 **Expired** (`validUntil <= now`)
     - ⛔ **Revoked** (`isRevoked === true`)
