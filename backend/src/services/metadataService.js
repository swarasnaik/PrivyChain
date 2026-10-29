/**
 * backend/src/services/metadataService.js
 *
 * Off-chain metadata registry for non-sensitive schema and encrypted pointer envelopes.
 *
 * ZERO-PII ENFORCEMENT:
 * - This service explicitly blocks any plaintext personal identifiers (e.g., name, email,
 *   phone, SSN, passport, raw documents).
 * - Only stores public schema descriptors, encrypted blob content hashes, and URI pointers.
 */

const { isBytes32 } = require("../utils/validation");

class MetadataService {
  constructor() {
    // In-memory store for demonstration / testing (can be backed by SQLite/MongoDB in production)
    this.metadataStore = new Map();
  }

  /**
   * Registers an off-chain metadata envelope for a credential.
   * Rejects any payloads containing known PII fields.
   */
  registerMetadata(record) {
    const { credentialId, schemaHash, schemaType, encryptedDataHash, encryptedDataUri, claimFields } =
      record;

    if (!isBytes32(credentialId)) {
      throw new Error("Invalid credentialId: must be a 32-byte hex string (0x...).");
    }
    if (!isBytes32(schemaHash)) {
      throw new Error("Invalid schemaHash: must be a 32-byte hex string (0x...).");
    }

    // Defensive check: explicitly block common sensitive fields
    const FORBIDDEN_FIELDS = [
      "name",
      "fullName",
      "firstName",
      "lastName",
      "email",
      "phone",
      "ssn",
      "aadhaar",
      "passportNumber",
      "documentData",
      "rawDocument",
      "privateKey",
      "salt",
    ];

    for (const key of Object.keys(record)) {
      if (FORBIDDEN_FIELDS.includes(key)) {
        throw new Error(
          `Privacy Violation: Field '${key}' contains raw identity data and cannot be stored off-chain or on-chain.`
        );
      }
    }

    const envelope = {
      credentialId,
      schemaHash,
      schemaType: schemaType || "STANDARD_VERIFIABLE_CREDENTIAL_V1",
      encryptedDataHash: encryptedDataHash || null,
      encryptedDataUri: encryptedDataUri || null,
      claimFields: Array.isArray(claimFields) ? claimFields : [],
      registeredAt: new Date().toISOString(),
    };

    this.metadataStore.set(credentialId.toLowerCase(), envelope);
    return envelope;
  }

  /**
   * Retrieves stored metadata envelope by credentialId.
   */
  getMetadata(credentialId) {
    if (!isBytes32(credentialId)) {
      throw new Error("Invalid credentialId format.");
    }
    return this.metadataStore.get(credentialId.toLowerCase()) || null;
  }
}

module.exports = new MetadataService();
