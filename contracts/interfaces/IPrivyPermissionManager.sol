// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/**
 * @title IPrivyPermissionManager
 * @notice Interface for the PrivyChain Permission Manager.
 * @dev Manages subject-sovereign permission grants and revocations to verifier organizations.
 *
 * PRIVACY SPECIFICATION:
 * - Permissions record authorization state on-chain, but CANNOT prevent a verifier from
 *   retaining or duplicating plaintext information received off-chain.
 * - Selective disclosure and data minimization must be performed off-chain before
 *   transmitting payload data to the verifier.
 */
interface IPrivyPermissionManager {
    /**
     * @notice Structure representing a fine-grained permission grant.
     * @param permissionId The unique deterministic identifier for this permission grant.
     * @param subject The wallet address of the credential owner granting permission.
     * @param verifier The wallet/organization address authorized to access the credential.
     * @param credentialId The opaque commitment hash of the underlying credential.
     * @param scope An opaque category or permission scope (e.g., keccak256("READ_EMPLOYMENT_STATUS")).
     * @param grantedAt Block timestamp when permission was granted.
     * @param validUntil Expiration timestamp for this permission grant.
     * @param isActive Boolean indicating whether permission is actively granted.
     * @param isRevoked Boolean indicating whether the subject has revoked this grant.
     */
    struct Permission {
        bytes32 permissionId;
        address subject;
        address verifier;
        bytes32 credentialId;
        bytes32 scope;
        uint64 grantedAt;
        uint64 validUntil;
        bool isActive;
        bool isRevoked;
    }

    // =========================================================================
    // Events
    // =========================================================================

    /**
     * @notice Emitted when a credential subject grants access permission to a verifier.
     */
    event PermissionGranted(
        bytes32 indexed permissionId,
        address indexed subject,
        address indexed verifier,
        bytes32 credentialId,
        bytes32 scope,
        uint64 validUntil
    );

    /**
     * @notice Emitted when a credential subject revokes an existing permission grant.
     */
    event PermissionRevoked(
        bytes32 indexed permissionId,
        address indexed subject,
        address indexed verifier,
        bytes32 credentialId,
        bytes32 scope
    );

    // =========================================================================
    // Custom Errors
    // =========================================================================

    error ZeroAddress();
    error ZeroCredentialId();
    error ZeroScope();
    error InvalidExpiration();
    error NotCredentialSubject(address caller, address actualSubject);
    error CredentialInvalidOrRevoked();
    error PermissionExceedsCredentialExpiry(uint64 permissionExpiry, uint64 credentialExpiry);
    error PermissionDoesNotExist();
    error PermissionAlreadyRevoked();
    error PermissionExpired();
    error UnauthorizedCaller();

    // =========================================================================
    // Core Functions
    // =========================================================================

    /**
     * @notice Grants access permission for a credential to a requesting verifier.
     * @param verifier The address of the requesting organization.
     * @param credentialId The opaque credential commitment being granted.
     * @param scope Specific permission scope being authorized.
     * @param validUntil Expiration timestamp for this grant.
     * @return permissionId Deterministic hash identifying this permission grant.
     */
    function grantPermission(
        address verifier,
        bytes32 credentialId,
        bytes32 scope,
        uint64 validUntil
    ) external returns (bytes32 permissionId);

    /**
     * @notice Revokes a previously granted permission by permissionId.
     * @param permissionId The unique identifier of the permission grant.
     */
    function revokePermission(bytes32 permissionId) external;

    /**
     * @notice Revokes a previously granted permission by parameter tuple.
     * @param verifier The address of the requesting organization.
     * @param credentialId The credential commitment ID.
     * @param scope The permission scope.
     */
    function revokePermission(
        address verifier,
        bytes32 credentialId,
        bytes32 scope
    ) external;

    // =========================================================================
    // View Functions
    // =========================================================================

    /**
     * @notice Computes deterministic permissionId from grant parameters.
     */
    function computePermissionId(
        address subject,
        address verifier,
        bytes32 credentialId,
        bytes32 scope
    ) external pure returns (bytes32);

    /**
     * @notice Retrieves stored permission details by permissionId.
     */
    function getPermission(bytes32 permissionId) external view returns (Permission memory);

    /**
     * @notice Verifies whether a permission grant is currently valid and active,
     *         including cross-checking credential status with the registry.
     */
    function isPermissionValid(bytes32 permissionId) external view returns (bool);

    /**
     * @notice Convenience verification method checking permission by parameters.
     */
    function checkPermission(
        address subject,
        address verifier,
        bytes32 credentialId,
        bytes32 scope
    ) external view returns (bool);
}
