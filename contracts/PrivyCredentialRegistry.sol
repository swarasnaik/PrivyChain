// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {IPrivyCredentialRegistry} from "./interfaces/IPrivyCredentialRegistry.sol";

/**
 * @title PrivyCredentialRegistry
 * @notice Central registry for authorized institutional issuers and credential commitments.
 * @dev Implements IPrivyCredentialRegistry with 2-step ownership and role-based access control.
 *
 * PRIVACY NOTICE:
 * - This contract MUST NOT store plaintext personal data, identity documents, or low-entropy hashes.
 * - credentialId commitments must be derived off-chain using high-entropy salts:
 *     credentialId = keccak256(abi.encodePacked(credentialPayload, secretSalt, nonce))
 * - Plaintext attributes must remain off-chain under the sovereign control of the credential subject.
 */
contract PrivyCredentialRegistry is IPrivyCredentialRegistry, Ownable2Step {
    // Mapping of authorized institutional issuers
    mapping(address => bool) private _authorizedIssuers;

    // Mapping of credential commitments (credentialId => Credential)
    mapping(bytes32 => Credential) private _credentials;

    /**
     * @notice Initializes the registry with the deployer as initial owner.
     * @param initialOwner Address of the contract administrator.
     */
    constructor(address initialOwner) Ownable(initialOwner) {
        if (initialOwner == address(0)) {
            revert ZeroAddress();
        }
    }

    // =========================================================================
    // Issuer Management (Admin Only)
    // =========================================================================

    /**
     * @inheritdoc IPrivyCredentialRegistry
     */
    function authorizeIssuer(address issuer) external override onlyOwner {
        if (issuer == address(0)) {
            revert ZeroAddress();
        }
        if (_authorizedIssuers[issuer]) {
            revert IssuerAlreadyAuthorized();
        }

        _authorizedIssuers[issuer] = true;
        emit IssuerAuthorized(issuer, msg.sender);
    }

    /**
     * @inheritdoc IPrivyCredentialRegistry
     */
    function deauthorizeIssuer(address issuer) external override onlyOwner {
        if (!_authorizedIssuers[issuer]) {
            revert IssuerNotAuthorized();
        }

        _authorizedIssuers[issuer] = false;
        emit IssuerRevoked(issuer, msg.sender);
    }

    // =========================================================================
    // Credential Registration & Revocation
    // =========================================================================

    /**
     * @inheritdoc IPrivyCredentialRegistry
     */
    function registerCredential(
        bytes32 credentialId,
        address subject,
        bytes32 schemaHash,
        uint64 validUntil
    ) external override {
        // Access control: only authorized issuers
        if (!_authorizedIssuers[msg.sender]) {
            revert IssuerNotAuthorized();
        }

        // Input validation
        if (credentialId == bytes32(0)) {
            revert ZeroCredentialId();
        }
        if (subject == address(0)) {
            revert ZeroAddress();
        }
        if (schemaHash == bytes32(0)) {
            revert ZeroSchemaHash();
        }
        if (validUntil > 0 && validUntil <= block.timestamp) {
            revert InvalidExpiration();
        }

        // Prevent duplicate registration
        if (_credentials[credentialId].issuer != address(0)) {
            revert CredentialAlreadyExists();
        }

        // Effects
        _credentials[credentialId] = Credential({
            issuer: msg.sender,
            subject: subject,
            schemaHash: schemaHash,
            issuedAt: uint64(block.timestamp),
            validUntil: validUntil,
            isRevoked: false,
            revokedAt: 0
        });

        emit CredentialRegistered(credentialId, msg.sender, subject, schemaHash, validUntil);
    }

    /**
     * @inheritdoc IPrivyCredentialRegistry
     */
    function revokeCredential(bytes32 credentialId, string calldata reason) external override {
        Credential storage cred = _credentials[credentialId];

        // Ensure credential exists
        if (cred.issuer == address(0)) {
            revert CredentialDoesNotExist();
        }

        // Access control: only the original issuer or contract owner can revoke
        if (msg.sender != cred.issuer && msg.sender != owner()) {
            revert UnauthorizedCaller();
        }

        // Prevent double revocation
        if (cred.isRevoked) {
            revert CredentialAlreadyRevoked();
        }

        // Effects
        cred.isRevoked = true;
        cred.revokedAt = uint64(block.timestamp);

        emit CredentialRevoked(credentialId, msg.sender, reason);
    }

    // =========================================================================
    // View Functions
    // =========================================================================

    /**
     * @inheritdoc IPrivyCredentialRegistry
     */
    function isAuthorizedIssuer(address issuer) external view override returns (bool) {
        return _authorizedIssuers[issuer];
    }

    /**
     * @inheritdoc IPrivyCredentialRegistry
     */
    function getCredential(bytes32 credentialId) external view override returns (Credential memory) {
        Credential memory cred = _credentials[credentialId];
        if (cred.issuer == address(0)) {
            revert CredentialDoesNotExist();
        }
        return cred;
    }

    /**
     * @inheritdoc IPrivyCredentialRegistry
     */
    function isValidCredential(bytes32 credentialId) external view override returns (bool) {
        Credential storage cred = _credentials[credentialId];
        if (cred.issuer == address(0)) {
            return false;
        }
        if (cred.isRevoked) {
            return false;
        }
        if (cred.validUntil > 0 && cred.validUntil <= block.timestamp) {
            return false;
        }
        return true;
    }
}
