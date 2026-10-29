# PrivyChain

> **Self-Sovereign Identity & Data Permission Management dApp**
> Built for the **MST Blockchain Buildathon**

PrivyChain is a decentralized platform enabling individuals to retain sovereign ownership and fine-grained access control over their identity attestations and credentials. With PrivyChain, authorized organizations issue verifiable credential commitments, while users selectively grant, expire, and revoke access permissions to verifiers in a cryptographically verifiable and auditable manner.

---

## 🔒 Core Privacy & Security Philosophy

### Zero On-Chain PII
No personal documents, plaintext identity details, names, emails, addresses, private keys, or sensitive credentials ever touch the blockchain.

### Why a Cryptographic Hash Is NOT Automatically Private
A cryptographic hash (such as `keccak256`) is **pseudonymous**, not anonymous:
1. **Dictionary & Rainbow Attacks:** When the underlying data has low entropy (e.g., date of birth, passport formats, phone numbers), an attacker can compute hashes of candidate inputs and invert the data.
2. **Linkability & Correlation:** An un-salted hash acts as an immutable public tracking identifier across different verifiers and dApps.
3. **PrivyChain Countermeasure:** All credential digests use client-side high-entropy cryptographic salts (`keccak256(credentialPayload + secretSalt + nonce)`) generated and held strictly on the user's local device or encrypted user vault. On-chain records only track opaque commitments, validity status, and access rights.

---

## 🌐 MST Network Configuration

PrivyChain targets the **MST Coral Testnet** (proposed buildathon target — confirm against the official buildathon network announcement before final deployment):

| Parameter | Configuration | Details |
| :--- | :--- | :--- |
| **Network Name** | MST Coral Testnet | EVM-compatible Layer 1 |
| **RPC URL** | `https://coralrpc.mstblockchain.com` | Official JSON-RPC endpoint |
| **Chain ID** | `54635` (`0xd56b`) | Live-verified network chain ID |
| **Currency Symbol** | `tMSTC` | Testnet gas token |
| **Block Explorer** | `https://coral.mstscan.com` | Block, transaction, and contract explorer |
| **Faucet** | `https://coral-faucet.mstblockchain.com` | Testnet token faucet |
| **Solidity EVM Target** | `paris` | Avoids newer opcodes (e.g., `PUSH0`) for maximum node compatibility |

---

## 📂 Repository Structure

```
PrivyChain/
├── contracts/                        # Solidity Smart Contracts (Phase 2)
│   ├── PrivyCredentialRegistry.sol   # Issuer verification & credential commitments
│   ├── PrivyPermissionManager.sol    # User-controlled permission grants & verification
│   └── interfaces/                   # Contract interfaces
├── test/                             # Hardhat Unit & Integration Tests (Phase 3)
├── scripts/
│   └── testnet-probe.js              # Read-only network connectivity & balance probe
├── hardhat.config.js                 # Hardhat configuration (Solidity 0.8.24, EVM: paris)
├── .env.example                      # Environment variable template
├── .gitignore                        # Security ignore rules (prevents key & env leaks)
├── package.json                      # Project dependencies & npm scripts
└── README.md                         # Project documentation
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js:** v18+ (tested on Node.js v24.x)
- **npm:** v9+

### 2. Installation
```bash
git clone https://github.com/KrushnaSPPUDoT-code/PrivyChain.git
cd PrivyChain
npm install
```

### 3. Environment Configuration
Copy the environment template and configure your testnet environment:
```bash
cp .env.example .env
```
Edit `.env` to provide your testnet parameters and deployer credentials. **Never commit your `.env` file or share private keys.**

### 4. Verify Network Connectivity & Balance
Run the non-destructive probe to check RPC connectivity, verify Chain ID, and inspect account balance:
```bash
# General network verification
npm run probe

# Query balance for a specific wallet address
node scripts/testnet-probe.js 0xYourWalletAddress
```

### 5. Available Commands
```bash
# Compile contracts
npm run compile

# Run test suite
npm test

# Run network connectivity probe
npm run probe

# Clean build artifacts
npm run clean
```

---

## 🛡️ Security & Access Control Model

* **Administrator:** Manages the registry of authorized institutional issuers.
* **Authorized Issuers:** Issue verifiable credential hashes and record credential revocations. Issuers cannot grant or revoke user permissions.
* **Subjects (Users):** Sole authority to grant, scope, expire, and revoke permission grants for their credentials.
* **Requesting Organizations (Verifiers):** Can only verify active permissions if authorized by the subject, within the granted scope, before expiration, and while the underlying credential remains unrevoked.
* **Backend Role Separation:** The off-chain backend provides data coordination, encrypted storage, and schema verification. It holds **no user private keys** and cannot initiate blockchain transactions.

---

## 🗺️ Implementation Phases

- [x] **Phase 1:** Environment Setup, Hardhat Configuration & Security Baseline
- [x] **Phase 2:** Smart Contract Core Development (`PrivyCredentialRegistry` & `PrivyPermissionManager`)
- [x] **Phase 3:** Backend Architecture, ABI Export & Automated Test Suite (72 tests passing)
- [x] **Phase 4:** Frontend Developer Integration Specs & MetaMask Guides
- [ ] **Phase 5:** End-to-End Testnet Dry Run & Faucet Verification
- [ ] **Phase 6:** MST Testnet Deployment & Contract Verification (Pending Approval)
