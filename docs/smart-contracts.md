# PrivyChain Smart Contracts Specification & Integration Guide

This document specifies the core smart contracts for PrivyChain, designed for the MST Blockchain Buildathon.

---

## 1. System Architecture & Role Separation

PrivyChain separates credential validity from access control permissioning into two independent, modular contracts:

```
┌────────────────────────────────────────────────────────┐
│               PrivyCredentialRegistry                  │
│                                                        │
│  - Admin (Owner): Authorizes / deauthorizes issuers    │
│  - Authorized Issuers: Register / revoke credentials   │
│  - Storage: Mapping of credentialId -> Credential      │
└──────────────────────────▲─────────────────────────────┘
                           │ (Read-only status cross-check)
┌──────────────────────────┴─────────────────────────────┐
│               PrivyPermissionManager                   │
│                                                        │
│  - Subject (User): Sole grantor & revoker of access    │
│  - Verifier: Requesting organization reading status    │
│  - Storage: Mapping of permissionId -> Permission      │
└────────────────────────────────────────────────────────┘
```

### Roles Matrix

| Role | Contract | Authority & Permissions |
| :--- | :--- | :--- |
| **Administrator (Owner)** | `PrivyCredentialRegistry` | Authorize and deauthorize institutional issuers; emergency revocation of compromised credentials. Cannot grant user permissions. |
| **Authorized Issuer** | `PrivyCredentialRegistry` | Register verifiable credential commitments for subjects; revoke credentials they issued. Cannot grant or revoke user permissions. |
| **Subject (Credential Owner)** | `PrivyPermissionManager` | Sole entity permitted to grant, configure validity periods, and revoke access permissions for their credentials. |
| **Verifier (Requesting Org)** | Both | Reads on-chain permission and credential status; cannot alter state or issue grants. |

---

## 2. Privacy Model & Zero-PII Guarantees

### A. No Plaintext On-Chain
Under no circumstances are personal identity details, document images, names, email addresses, phone numbers, or national identification numbers stored or passed into transactions on-chain.

### B. High-Entropy Credential Commitments
A common cryptographic mistake is storing raw hashes of predictable fields (e.g. `keccak256("1995-05-12")`). Because the input space is narrow, attackers can perform brute-force pre-image dictionary searches in milliseconds.

PrivyChain requires off-chain client applications to generate **high-entropy, salted commitments**:
$$\text{credentialId} = \text{keccak256}(\text{abi.encodePacked}(\text{credentialPayload}, \text{userSecretSalt}, \text{nonce}))$$
* The `userSecretSalt` must be generated client-side using CSPRNG (Cryptographically Secure Pseudo-Random Number Generator) and stored solely in the user's encrypted local storage or off-chain user vault.

### C. Inherent Limitation: Off-Chain Data Retention
On-chain smart contracts cryptographically govern **authorization** at the moment of verification:
> **Known Limitation:** Once a verifier receives plaintext or selective disclosure claims off-chain, the blockchain *cannot* physically delete or prevent the verifier from caching or duplicating that information. Revoking on-chain permission guarantees that future verification queries fail, but cannot erase data already exposed to an untrusted verifier.

---

## 3. Contract Specifications

### Contract 1: `PrivyCredentialRegistry.sol`

Inherits: `IPrivyCredentialRegistry`, `Ownable2Step`

#### Struct: `Credential`
* `address issuer`: Authorized institutional issuer address.
* `address subject`: Subject wallet address.
* `bytes32 schemaHash`: Identifier for credential type/schema (e.g. `keccak256("EDUCATION_DEGREE_V1")`).
* `uint64 issuedAt`: Issuance block timestamp.
* `uint64 validUntil`: Expiration timestamp (`0` for non-expiring).
* `bool isRevoked`: True if revoked.
* `uint64 revokedAt`: Timestamp of revocation (`0` if active).

#### Core Functions

##### 1. `authorizeIssuer(address issuer)`
* **Caller:** Administrator (`onlyOwner`)
* **Errors:** `ZeroAddress()`, `IssuerAlreadyAuthorized()`
* **Events:** `IssuerAuthorized(address indexed issuer, address indexed authorizedBy)`

##### 2. `deauthorizeIssuer(address issuer)`
* **Caller:** Administrator (`onlyOwner`)
* **Errors:** `IssuerNotAuthorized()`
* **Events:** `IssuerRevoked(address indexed issuer, address indexed revokedBy)`

##### 3. `registerCredential(bytes32 credentialId, address subject, bytes32 schemaHash, uint64 validUntil)`
* **Caller:** Authorized Issuer (`_authorizedIssuers[msg.sender] == true`)
* **Errors:** `IssuerNotAuthorized()`, `ZeroCredentialId()`, `ZeroAddress()`, `ZeroSchemaHash()`, `InvalidExpiration()`, `CredentialAlreadyExists()`
* **Events:** `CredentialRegistered(bytes32 indexed credentialId, address indexed issuer, address indexed subject, bytes32 schemaHash, uint64 validUntil)`

##### 4. `revokeCredential(bytes32 credentialId, string calldata reason)`
* **Caller:** Original Issuer (`msg.sender == cred.issuer`) OR Contract Administrator (`msg.sender == owner()`)
* **Errors:** `CredentialDoesNotExist()`, `UnauthorizedCaller()`, `CredentialAlreadyRevoked()`
* **Events:** `CredentialRevoked(bytes32 indexed credentialId, address indexed revokedBy, string reason)`

##### 5. `isValidCredential(bytes32 credentialId) external view returns (bool)`
* Returns `true` if and only if credential exists, is not revoked, and is not expired.

---

### Contract 2: `PrivyPermissionManager.sol`

Inherits: `IPrivyPermissionManager`, `ReentrancyGuard`

#### Struct: `Permission`
* `bytes32 permissionId`: Unique hash `keccak256(abi.encode(subject, verifier, credentialId, scope))`.
* `address subject`: Grantor / credential owner.
* `address verifier`: Authorized requesting organization.
* `bytes32 credentialId`: Linked credential commitment.
* `bytes32 scope`: Purpose or claim scope identifier.
* `uint64 grantedAt`: Timestamp granted.
* `uint64 validUntil`: Expiration timestamp.
* `bool isActive`: Active status boolean.
* `bool isRevoked`: Revocation status boolean.

#### Core Functions

##### 1. `grantPermission(address verifier, bytes32 credentialId, bytes32 scope, uint64 validUntil) returns (bytes32 permissionId)`
* **Caller:** Credential Subject (`msg.sender == cred.subject`)
* **Validations:**
  - `verifier != address(0)`, `credentialId != bytes32(0)`, `scope != bytes32(0)`
  - `validUntil > block.timestamp`
  - Validates credential via Registry: must exist, subject must match `msg.sender`, credential must not be revoked, and credential must not be expired.
  - Ensures `validUntil <= cred.validUntil` (permission cannot outlive underlying credential).
* **Errors:** `ZeroAddress()`, `ZeroCredentialId()`, `ZeroScope()`, `InvalidExpiration()`, `NotCredentialSubject()`, `CredentialInvalidOrRevoked()`, `PermissionExceedsCredentialExpiry()`
* **Events:** `PermissionGranted(bytes32 indexed permissionId, address indexed subject, address indexed verifier, bytes32 credentialId, bytes32 scope, uint64 validUntil)`

##### 2. `revokePermission(bytes32 permissionId)` & `revokePermission(address verifier, bytes32 credentialId, bytes32 scope)`
* **Caller:** Subject only (`msg.sender == perm.subject`)
* **Errors:** `PermissionDoesNotExist()`, `UnauthorizedCaller()`, `PermissionAlreadyRevoked()`
* **Events:** `PermissionRevoked(bytes32 indexed permissionId, address indexed subject, address indexed verifier, bytes32 credentialId, bytes32 scope)`

##### 3. `checkPermission(address subject, address verifier, bytes32 credentialId, bytes32 scope) external view returns (bool)`
* Returns `true` if and only if:
  1. Permission exists and was granted by `subject` to `verifier`.
  2. `isActive == true` and `!isRevoked`.
  3. `block.timestamp <= perm.validUntil` (permission not expired).
  4. Cross-checks `registry.isValidCredential(credentialId)`: returns `false` if the credential was subsequently revoked or expired at the issuer level.

---

## 4. Frontend & Backend Integration Guide

### For the Teammate (Frontend / UI Integration):
1. **Network Switching:**
   * Configure MetaMask to switch to MST Coral Testnet (`chainId: 54635`, RPC: `https://coralrpc.mstblockchain.com`).
2. **User Flows:**
   * **Subject Portal:**
     - Query user's credentials from backend/local vault.
     - Call `manager.grantPermission(...)` via MetaMask to approve an organization's request.
     - Call `manager.revokePermission(...)` to immediately terminate access.
   * **Verifier Portal:**
     - Prompt user to connect wallet.
     - Query `manager.checkPermission(subjectAddress, verifierAddress, credentialId, scope)`.
     - Only request or display encrypted claim payload if `checkPermission` returns `true`.
   * **Issuer Portal:**
     - Authorized institution signs `registry.registerCredential(...)` or `registry.revokeCredential(...)`.

### For the Backend (Off-Chain Coordinator):
1. **No Key Custody:**
   * Backend does NOT hold user private keys. Transactions are signed in MetaMask.
2. **Encrypted Storage:**
   * Backend stores encrypted credential blobs off-chain. Decryption keys are shared peer-to-peer or using asymmetric encryption (verifier's public key) upon verifying on-chain grant.
3. **Event Indexer:**
   * Backend listens to `PermissionGranted`, `PermissionRevoked`, and `CredentialRevoked` WebSocket events from `wss://coralrpc.mstblockchain.com` to keep off-chain state synchronized in real-time.
