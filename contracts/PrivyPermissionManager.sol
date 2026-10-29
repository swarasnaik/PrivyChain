// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IPrivyPermissionManager} from "./interfaces/IPrivyPermissionManager.sol";
import {IPrivyCredentialRegistry} from "./interfaces/IPrivyCredentialRegistry.sol";

/**
 * @title PrivyPermissionManager
 * @notice Self-sovereign permission management for the PrivyChain ecosystem.
 * @dev Manages subject-controlled, scoped, and time-bounded access permissions.
 *
 * PRIVACY SPECIFICATION:
 * - On-chain permissions record cryptographic authorization between a subject and verifier.
 * - This contract CANNOT prevent a requesting organization (verifier) from duplicating or
 *   storing plaintext data once received off-chain.
 * - Off-chain applications MUST implement client-side encryption and salting:
 *   transmitting only minimally required claims.
 */
contract PrivyPermissionManager is IPrivyPermissionManager, ReentrancyGuard {
    /// @notice The linked credential registry contract
    IPrivyCredentialRegistry public immutable registry;

    /// @notice Mapping of permissionId to Permission structure
    mapping(bytes32 => Permission) private _permissions;

    /**
     * @notice Initializes the Permission Manager with a valid Credential Registry address.
     * @param registryAddress Address of the deployed PrivyCredentialRegistry contract.
     */
    constructor(address registryAddress) {
        if (registryAddress == address(0)) {
            revert ZeroAddress();
        }
        registry = IPrivyCredentialRegistry(registryAddress);
    }

    // =========================================================================
    // Permission Management
    // =========================================================================

    /**
     * @inheritdoc IPrivyPermissionManager
     */
    function grantPermission(
        address verifier,
        bytes32 credentialId,
        bytes32 scope,
        uint64 validUntil
    ) external override nonReentrant returns (bytes32 permissionId) {
        // Input validation
        if (verifier == address(0)) {
            revert ZeroAddress();
        }
        if (credentialId == bytes32(0)) {
            revert ZeroCredentialId();
        }
        if (scope == bytes32(0)) {
            revert ZeroScope();
        }
        if (validUntil <= block.timestamp) {
            revert InvalidExpiration();
        }

        // Validate credential existence and subject ownership via registry
        IPrivyCredentialRegistry.Credential memory cred = registry.getCredential(credentialId);

        if (cred.subject != msg.sender) {
            revert NotCredentialSubject(msg.sender, cred.subject);
        }

        // Validate credential is not revoked
        if (cred.isRevoked) {
            revert CredentialInvalidOrRevoked();
        }

        // Validate credential is not expired
        if (cred.validUntil > 0 && cred.validUntil <= block.timestamp) {
            revert CredentialInvalidOrRevoked();
        }

        // Ensure permission expiry does not outlive the underlying credential's validity
        if (cred.validUntil > 0 && validUntil > cred.validUntil) {
            revert PermissionExceedsCredentialExpiry(validUntil, cred.validUntil);
        }

        // Deterministic permission ID computation
        permissionId = computePermissionId(msg.sender, verifier, credentialId, scope);

        // Store or update permission
        _permissions[permissionId] = Permission({
            permissionId: permissionId,
            subject: msg.sender,
            verifier: verifier,
            credentialId: credentialId,
            scope: scope,
            grantedAt: uint64(block.timestamp),
            validUntil: validUntil,
            isActive: true,
            isRevoked: false
        });

        emit PermissionGranted(permissionId, msg.sender, verifier, credentialId, scope, validUntil);
    }

    /**
     * @inheritdoc IPrivyPermissionManager
     */
    function revokePermission(bytes32 permissionId) public override nonReentrant {
        Permission storage perm = _permissions[permissionId];

        if (perm.subject == address(0)) {
            revert PermissionDoesNotExist();
        }

        // Only the subject who granted the permission can revoke it
        if (msg.sender != perm.subject) {
            revert UnauthorizedCaller();
        }

        // Check if already revoked
        if (perm.isRevoked || !perm.isActive) {
            revert PermissionAlreadyRevoked();
        }

        // Effects
        perm.isActive = false;
        perm.isRevoked = true;

        emit PermissionRevoked(
            permissionId,
            perm.subject,
            perm.verifier,
            perm.credentialId,
            perm.scope
        );
    }

    /**
     * @inheritdoc IPrivyPermissionManager
     */
    function revokePermission(
        address verifier,
        bytes32 credentialId,
        bytes32 scope
    ) external override {
        bytes32 permissionId = computePermissionId(msg.sender, verifier, credentialId, scope);
        revokePermission(permissionId);
    }

    // =========================================================================
    // View Functions
    // =========================================================================

    /**
     * @inheritdoc IPrivyPermissionManager
     */
    function computePermissionId(
        address subject,
        address verifier,
        bytes32 credentialId,
        bytes32 scope
    ) public pure override returns (bytes32) {
        return keccak256(abi.encode(subject, verifier, credentialId, scope));
    }

    /**
     * @inheritdoc IPrivyPermissionManager
     */
    function getPermission(bytes32 permissionId) external view override returns (Permission memory) {
        Permission memory perm = _permissions[permissionId];
        if (perm.subject == address(0)) {
            revert PermissionDoesNotExist();
        }
        return perm;
    }

    /**
     * @inheritdoc IPrivyPermissionManager
     */
    function isPermissionValid(bytes32 permissionId) public view override returns (bool) {
        Permission storage perm = _permissions[permissionId];

        // Must exist, be active, and not revoked
        if (perm.subject == address(0) || !perm.isActive || perm.isRevoked) {
            return false;
        }

        // Must not be expired
        if (perm.validUntil <= block.timestamp) {
            return false;
        }

        // Underlying credential must remain valid and unrevoked in the registry
        return registry.isValidCredential(perm.credentialId);
    }

    /**
     * @inheritdoc IPrivyPermissionManager
     */
    function checkPermission(
        address subject,
        address verifier,
        bytes32 credentialId,
        bytes32 scope
    ) external view override returns (bool) {
        bytes32 permissionId = computePermissionId(subject, verifier, credentialId, scope);
        return isPermissionValid(permissionId);
    }
}
