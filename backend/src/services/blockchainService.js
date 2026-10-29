/**
 * backend/src/services/blockchainService.js
 *
 * Read-only blockchain interaction service.
 * Connects to MST Testnet RPC to verify contract states.
 *
 * SECURITY:
 * - This service uses a read-only JsonRpcProvider.
 * - It contains NO private keys and CANNOT submit transactions or modify state.
 * - Authorization decisions MUST be verified against the on-chain contract state.
 */

const { ethers, Contract, JsonRpcProvider } = require("ethers");
const config = require("../config");

// Load exported ABIs
let registryAbi = [];
let permissionManagerAbi = [];

try {
  registryAbi = require("../abis/PrivyCredentialRegistry.json");
  permissionManagerAbi = require("../abis/PrivyPermissionManager.json");
} catch {
  console.warn("[!] Warning: ABIs not found in backend/src/abis/. Run 'npm run export-abis'.");
}

class BlockchainService {
  constructor() {
    this.provider = new JsonRpcProvider(config.rpcUrl);
  }

  getRegistryContract() {
    if (!config.contracts.registryAddress || !ethers.isAddress(config.contracts.registryAddress)) {
      return null;
    }
    return new Contract(config.contracts.registryAddress, registryAbi, this.provider);
  }

  getPermissionManagerContract() {
    if (
      !config.contracts.permissionManagerAddress ||
      !ethers.isAddress(config.contracts.permissionManagerAddress)
    ) {
      return null;
    }
    return new Contract(
      config.contracts.permissionManagerAddress,
      permissionManagerAbi,
      this.provider
    );
  }

  /**
   * Health probe for the live blockchain RPC connection.
   */
  async getNetworkStatus() {
    try {
      const network = await this.provider.getNetwork();
      const blockNumber = await this.provider.getBlockNumber();
      return {
        connected: true,
        chainId: Number(network.chainId),
        blockNumber,
        configuredRpc: config.rpcUrl,
      };
    } catch (err) {
      return {
        connected: false,
        error: err.message,
        configuredRpc: config.rpcUrl,
      };
    }
  }

  /**
   * Reads on-chain credential validity and metadata record.
   */
  async getCredentialStatus(credentialId) {
    const registry = this.getRegistryContract();
    if (!registry) {
      throw new Error(
        "Registry contract address is not configured or pending deployment. Set REGISTRY_CONTRACT_ADDRESS in .env."
      );
    }

    const isValid = await registry.isValidCredential(credentialId);

    let details = null;
    try {
      const cred = await registry.getCredential(credentialId);
      details = {
        issuer: cred.issuer,
        subject: cred.subject,
        schemaHash: cred.schemaHash,
        issuedAt: Number(cred.issuedAt),
        validUntil: Number(cred.validUntil),
        isRevoked: cred.isRevoked,
        revokedAt: Number(cred.revokedAt),
        isPerpetual: cred.validUntil === 0n,
      };
    } catch {
      // Credential may not be registered yet
      details = null;
    }

    return {
      credentialId,
      isRegistered: details !== null,
      isValid,
      details,
    };
  }

  /**
   * Reads on-chain permission grant status for a verifier and scope.
   */
  async checkPermission(subject, verifier, credentialId, scope) {
    const manager = this.getPermissionManagerContract();
    if (!manager) {
      throw new Error(
        "PermissionManager contract address is not configured or pending deployment. Set PERMISSION_MANAGER_CONTRACT_ADDRESS in .env."
      );
    }

    const isValid = await manager.checkPermission(subject, verifier, credentialId, scope);
    const permissionId = await manager.computePermissionId(subject, verifier, credentialId, scope);

    let details = null;
    try {
      const perm = await manager.getPermission(permissionId);
      details = {
        permissionId: perm.permissionId,
        subject: perm.subject,
        verifier: perm.verifier,
        credentialId: perm.credentialId,
        scope: perm.scope,
        grantedAt: Number(perm.grantedAt),
        validUntil: Number(perm.validUntil),
        isActive: perm.isActive,
        isRevoked: perm.isRevoked,
      };
    } catch {
      // Permission not granted or doesn't exist
      details = null;
    }

    return {
      permissionId,
      subject,
      verifier,
      credentialId,
      scope,
      hasValidPermission: isValid,
      details,
    };
  }
}

module.exports = new BlockchainService();
