// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/**
 * @title IPrivyCredentialRegistry
 * @notice Interface for the PrivyChain Credential Registry.
 * @dev Manages authorized institutional issuers and verifiable credential commitments.
 *
 * PRIVACY SPECIFICATION:
 * - NO Personally Identifiable Information (PII) is stored on-chain.
 * - credentialId MUST be an opaque, high-entropy commitment generated off-chain
 *   (e.g., keccak256(abi.encodePacked(credentialPayload, secretSalt, nonce))).
 * - Raw, unsalted hashes of low-entropy identity fields (e.g., SSN, DOB, name)
 *   are vulnerable to pre-image and rainbow attacks and MUST NOT be used directly.
 */
interface IPrivyCredentialRegistry {
    /**
     * @notice Structure storing on-chain metadata for a credential commitment.
     * @param issuer The address of the authorized institutional issuer.
     * @param subject The wallet address of the credential subject (data owner).
     * @param schemaHash An opaque identifier representing the schema or credential category.
     * @param issuedAt Block timestamp when the credential was registered.
     * @param validUntil Expiration timestamp (0 if perpetual/non-expiring).
     * @param isRevoked Flag indicating whether the credential has been revoked.
     * @param revokedAt Block timestamp when revocation occurred (0 if active).
     */
    struct Credential {
        address issuer;
        address subject;
        bytes32 schemaHash;
        uint64 issuedAt;
        uint64 validUntil;
        bool isRevoked;
        uint64 revokedAt;
    }

    // =========================================================================
    // Events
    // =========================================================================

    /**
     * @notice Emitted when an issuer is granted issuance authorization.
     */
    event IssuerAuthorized(address indexed issuer, address indexed authorizedBy);

    /**
     * @notice Emitted when an issuer's issuance authorization is revoked.
     */
    event IssuerRevoked(address indexed issuer, address indexed revokedBy);

    /**
     * @notice Emitted when a new credential commitment is registered.
     */
    event CredentialRegistered(
        bytes32 indexed credentialId,
        address indexed issuer,
        address indexed subject,
        bytes32 schemaHash,
        uint64 validUntil
    );

    /**
     * @notice Emitted when a credential commitment is revoked.
     */
    event CredentialRevoked(
        bytes32 indexed credentialId,
        address indexed revokedBy,
        string reason
    );

    // =========================================================================
    // Custom Errors
    // =========================================================================

    error ZeroAddress();
    error ZeroCredentialId();
    error ZeroSchemaHash();
    error InvalidExpiration();
    error IssuerAlreadyAuthorized();
    error IssuerNotAuthorized();
    error CredentialAlreadyExists();
    error CredentialDoesNotExist();
    error CredentialAlreadyRevoked();
    error UnauthorizedCaller();

    // =========================================================================
    // Core Functions
    // =========================================================================

    /**
     * @notice Grants credential issuance authorization to an institution.
     * @param issuer The address of the institution to authorize.
     */
    function authorizeIssuer(address issuer) external;

    /**
     * @notice Deauthorizes an institution from issuing new credentials.
     * @param issuer The address of the institution to deauthorize.
     */
    function deauthorizeIssuer(address issuer) external;

    /**
     * @notice Registers a verifiable credential commitment on-chain.
     * @param credentialId Opaque, high-entropy commitment hash.
     * @param subject The wallet address of the user who owns the credential.
     * @param schemaHash The identifier for the credential schema or type.
     * @param validUntil Expiration timestamp (0 for non-expiring).
     */
    function registerCredential(
        bytes32 credentialId,
        address subject,
        bytes32 schemaHash,
        uint64 validUntil
    ) external;

    /**
     * @notice Revokes an existing credential commitment.
     * @param credentialId The identifier of the credential to revoke.
     * @param reason Human-readable revocation reason for audit logs.
     */
    function revokeCredential(bytes32 credentialId, string calldata reason) external;

    // =========================================================================
    // View Functions
    // =========================================================================

    /**
     * @notice Queries whether an address is an authorized institutional issuer.
     */
    function isAuthorizedIssuer(address issuer) external view returns (bool);

    /**
     * @notice Retrieves credential details by credentialId.
     */
    function getCredential(bytes32 credentialId) external view returns (Credential memory);

    /**
     * @notice Verifies if a credential commitment is registered, unrevoked, and unexpired.
     */
    function isValidCredential(bytes32 credentialId) external view returns (bool);
}
