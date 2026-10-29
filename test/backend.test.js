const { expect } = require("chai");
const metadataService = require("../backend/src/services/metadataService");
const blockchainService = require("../backend/src/services/blockchainService");
const { isAddress, isBytes32, sendSuccess, sendError } = require("../backend/src/utils/validation");
const config = require("../backend/src/config");

describe("PrivyChain Backend Architecture & Services", function () {
  describe("Configuration & Zero-Key Security", function () {
    it("should load target network parameters with MST Coral Testnet", function () {
      expect(config.chainName).to.equal("MST Coral Testnet");
      expect(config.chainId).to.equal(54635);
      expect(config.rpcUrl).to.equal("https://coralrpc.mstblockchain.com");
    });

    it("should mark unconfigured contract addresses as pending deployment", function () {
      expect(config.contracts.registryAddress).to.be.null;
      expect(config.contracts.permissionManagerAddress).to.be.null;
    });

    it("should NOT load or contain any private keys in backend configuration", function () {
      expect(config).to.not.have.property("privateKey");
      expect(config).to.not.have.property("DEPLOYER_PRIVATE_KEY");
      expect(process.env.BACKEND_PRIVATE_KEY).to.be.undefined;
    });
  });

  describe("Validation Utilities", function () {
    it("should correctly validate Ethereum addresses", function () {
      expect(isAddress("0x000000000000000000000000000000000000dEaD")).to.be.true;
      expect(isAddress("0xInvalidAddress")).to.be.false;
      expect(isAddress("")).to.be.false;
      expect(isAddress(null)).to.be.false;
    });

    it("should correctly validate 32-byte hex strings (bytes32)", function () {
      const validBytes32 = "0x" + "a1".repeat(32);
      expect(isBytes32(validBytes32)).to.be.true;
      expect(isBytes32("0xShort")).to.be.false;
      expect(isBytes32("0x" + "zz".repeat(32))).to.be.false;
      expect(isBytes32(12345)).to.be.false;
    });

    it("should format standardized success envelopes", function () {
      let responsePayload = null;
      let responseStatus = null;

      const mockRes = {
        status: (code) => {
          responseStatus = code;
          return {
            json: (payload) => {
              responsePayload = payload;
              return payload;
            },
          };
        },
      };

      sendSuccess(mockRes, { item: "test" }, "All good", 200);
      expect(responseStatus).to.equal(200);
      expect(responsePayload.success).to.be.true;
      expect(responsePayload.message).to.equal("All good");
      expect(responsePayload.data.item).to.equal("test");
      expect(responsePayload).to.have.property("timestamp");
    });

    it("should format standardized error envelopes", function () {
      let responsePayload = null;
      let responseStatus = null;

      const mockRes = {
        status: (code) => {
          responseStatus = code;
          return {
            json: (payload) => {
              responsePayload = payload;
              return payload;
            },
          };
        },
      };

      sendError(mockRes, "Invalid request", 400, { field: "credentialId" });
      expect(responseStatus).to.equal(400);
      expect(responsePayload.success).to.be.false;
      expect(responsePayload.error).to.equal("Invalid request");
      expect(responsePayload.details.field).to.equal("credentialId");
    });
  });

  describe("Metadata Service (Zero-PII Off-Chain Architecture)", function () {
    const credId = "0x" + "cc".repeat(32);
    const schemaHash = "0x" + "ee".repeat(32);

    it("should register an opaque, privacy-preserving metadata envelope", function () {
      const envelope = {
        credentialId: credId,
        schemaHash: schemaHash,
        schemaType: "ACADEMIC_CREDENTIAL_V1",
        encryptedDataHash: "0x" + "11".repeat(32),
        encryptedDataUri: "ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi",
        claimFields: ["degree_title", "institution_id"],
      };

      const result = metadataService.registerMetadata(envelope);
      expect(result.credentialId).to.equal(credId);
      expect(result.schemaType).to.equal("ACADEMIC_CREDENTIAL_V1");
      expect(result.claimFields).to.deep.equal(["degree_title", "institution_id"]);
    });

    it("should retrieve stored metadata envelope", function () {
      const record = metadataService.getMetadata(credId);
      expect(record).to.not.be.null;
      expect(record.schemaType).to.equal("ACADEMIC_CREDENTIAL_V1");
    });

    it("should return null for non-existent credentialId", function () {
      const nonExistentId = "0x" + "00".repeat(32);
      expect(metadataService.getMetadata(nonExistentId)).to.be.null;
    });

    it("should DEFENSIVELY REJECT payloads containing plaintext PII (name, email, ssn)", function () {
      const piiPayload = {
        credentialId: "0x" + "99".repeat(32),
        schemaHash: schemaHash,
        name: "Alice Smith",
        email: "alice@example.edu",
      };

      expect(() => {
        metadataService.registerMetadata(piiPayload);
      }).to.throw(/Privacy Violation: Field 'name'/);
    });

    it("should DEFENSIVELY REJECT payloads containing private keys or salts", function () {
      const keyPayload = {
        credentialId: "0x" + "88".repeat(32),
        schemaHash: schemaHash,
        privateKey: "0xabcdef...",
      };

      expect(() => {
        metadataService.registerMetadata(keyPayload);
      }).to.throw(/Privacy Violation: Field 'privateKey'/);
    });
  });

  describe("Blockchain Service (Read-Only Contract Integration)", function () {
    it("should return null contract instances when deployment is pending", function () {
      expect(blockchainService.getRegistryContract()).to.be.null;
      expect(blockchainService.getPermissionManagerContract()).to.be.null;
    });

    it("should throw descriptive error when querying credential status before contract deployment", async function () {
      const dummyCredId = "0x" + "77".repeat(32);
      try {
        await blockchainService.getCredentialStatus(dummyCredId);
        expect.fail("Should have thrown error");
      } catch (err) {
        expect(err.message).to.include("Registry contract address is not configured or pending deployment");
      }
    });

    it("should throw descriptive error when checking permissions before contract deployment", async function () {
      const subject = "0x1111111111111111111111111111111111111111";
      const verifier = "0x2222222222222222222222222222222222222222";
      const credId = "0x" + "55".repeat(32);
      const scope = "0x" + "66".repeat(32);

      try {
        await blockchainService.checkPermission(subject, verifier, credId, scope);
        expect.fail("Should have thrown error");
      } catch (err) {
        expect(err.message).to.include("PermissionManager contract address is not configured or pending deployment");
      }
    });
  });
});
