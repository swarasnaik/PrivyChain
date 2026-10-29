const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("PrivyCredentialRegistry", function () {
  let registry;
  let owner;
  let issuer;
  let issuer2;
  let subject;
  let verifier;
  let unauthorized;

  const testSchemaHash = ethers.keccak256(ethers.toUtf8Bytes("SCHEMA_KYC_VERIFICATION_V1"));
  const sampleCredentialId = ethers.keccak256(ethers.toUtf8Bytes("CREDENTIAL_UUID_1001"));
  const sampleCredentialId2 = ethers.keccak256(ethers.toUtf8Bytes("CREDENTIAL_UUID_1002"));

  beforeEach(async function () {
    [owner, issuer, issuer2, subject, verifier, unauthorized] = await ethers.getSigners();

    const PrivyCredentialRegistry = await ethers.getContractFactory("PrivyCredentialRegistry");
    registry = await PrivyCredentialRegistry.deploy(owner.address);
    await registry.waitForDeployment();
  });

  describe("Constructor & Initialization", function () {
    it("should set deployer as initial owner", async function () {
      expect(await registry.owner()).to.equal(owner.address);
    });

    it("should revert if initial owner is zero address", async function () {
      const PrivyCredentialRegistry = await ethers.getContractFactory("PrivyCredentialRegistry");
      await expect(
        PrivyCredentialRegistry.deploy(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(registry, "OwnableInvalidOwner");
    });
  });

  describe("Institutional Issuer Management", function () {
    it("should allow owner to authorize an issuer and emit IssuerAuthorized", async function () {
      await expect(registry.connect(owner).authorizeIssuer(issuer.address))
        .to.emit(registry, "IssuerAuthorized")
        .withArgs(issuer.address, owner.address);

      expect(await registry.isAuthorizedIssuer(issuer.address)).to.be.true;
    });

    it("should revert if non-owner attempts to authorize an issuer", async function () {
      await expect(
        registry.connect(unauthorized).authorizeIssuer(issuer.address)
      ).to.be.revertedWithCustomError(registry, "OwnableUnauthorizedAccount");
    });

    it("should revert if authorizing zero address", async function () {
      await expect(
        registry.connect(owner).authorizeIssuer(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(registry, "ZeroAddress");
    });

    it("should revert if authorizing an already authorized issuer", async function () {
      await registry.connect(owner).authorizeIssuer(issuer.address);
      await expect(
        registry.connect(owner).authorizeIssuer(issuer.address)
      ).to.be.revertedWithCustomError(registry, "IssuerAlreadyAuthorized");
    });

    it("should allow owner to deauthorize an issuer and emit IssuerRevoked", async function () {
      await registry.connect(owner).authorizeIssuer(issuer.address);
      expect(await registry.isAuthorizedIssuer(issuer.address)).to.be.true;

      await expect(registry.connect(owner).deauthorizeIssuer(issuer.address))
        .to.emit(registry, "IssuerRevoked")
        .withArgs(issuer.address, owner.address);

      expect(await registry.isAuthorizedIssuer(issuer.address)).to.be.false;
    });

    it("should revert if non-owner attempts to deauthorize an issuer", async function () {
      await registry.connect(owner).authorizeIssuer(issuer.address);
      await expect(
        registry.connect(unauthorized).deauthorizeIssuer(issuer.address)
      ).to.be.revertedWithCustomError(registry, "OwnableUnauthorizedAccount");
    });

    it("should revert if deauthorizing an issuer that is not authorized", async function () {
      await expect(
        registry.connect(owner).deauthorizeIssuer(unauthorized.address)
      ).to.be.revertedWithCustomError(registry, "IssuerNotAuthorized");
    });
  });

  describe("Credential Registration", function () {
    beforeEach(async function () {
      await registry.connect(owner).authorizeIssuer(issuer.address);
    });

    it("should allow authorized issuer to register credential with future expiration", async function () {
      const latestTime = await time.latest();
      const validUntil = latestTime + 3600; // 1 hour validity

      await expect(
        registry
          .connect(issuer)
          .registerCredential(sampleCredentialId, subject.address, testSchemaHash, validUntil)
      )
        .to.emit(registry, "CredentialRegistered")
        .withArgs(sampleCredentialId, issuer.address, subject.address, testSchemaHash, validUntil);

      const cred = await registry.getCredential(sampleCredentialId);
      expect(cred.issuer).to.equal(issuer.address);
      expect(cred.subject).to.equal(subject.address);
      expect(cred.schemaHash).to.equal(testSchemaHash);
      expect(cred.validUntil).to.equal(validUntil);
      expect(cred.isRevoked).to.be.false;
      expect(cred.revokedAt).to.equal(0);
    });

    it("should allow registering a perpetual credential (validUntil = 0)", async function () {
      await registry
        .connect(issuer)
        .registerCredential(sampleCredentialId, subject.address, testSchemaHash, 0);

      const cred = await registry.getCredential(sampleCredentialId);
      expect(cred.validUntil).to.equal(0);
      expect(await registry.isValidCredential(sampleCredentialId)).to.be.true;
    });

    it("should revert if unauthorized caller tries to register credential", async function () {
      const validUntil = (await time.latest()) + 3600;
      await expect(
        registry
          .connect(unauthorized)
          .registerCredential(sampleCredentialId, subject.address, testSchemaHash, validUntil)
      ).to.be.revertedWithCustomError(registry, "IssuerNotAuthorized");
    });

    it("should revert on zero credentialId", async function () {
      const validUntil = (await time.latest()) + 3600;
      await expect(
        registry
          .connect(issuer)
          .registerCredential(ethers.ZeroHash, subject.address, testSchemaHash, validUntil)
      ).to.be.revertedWithCustomError(registry, "ZeroCredentialId");
    });

    it("should revert on zero subject address", async function () {
      const validUntil = (await time.latest()) + 3600;
      await expect(
        registry
          .connect(issuer)
          .registerCredential(sampleCredentialId, ethers.ZeroAddress, testSchemaHash, validUntil)
      ).to.be.revertedWithCustomError(registry, "ZeroAddress");
    });

    it("should revert on zero schemaHash", async function () {
      const validUntil = (await time.latest()) + 3600;
      await expect(
        registry
          .connect(issuer)
          .registerCredential(sampleCredentialId, subject.address, ethers.ZeroHash, validUntil)
      ).to.be.revertedWithCustomError(registry, "ZeroSchemaHash");
    });

    it("should revert if validUntil is in the past or current timestamp", async function () {
      const latestTime = await time.latest();
      await expect(
        registry
          .connect(issuer)
          .registerCredential(sampleCredentialId, subject.address, testSchemaHash, latestTime)
      ).to.be.revertedWithCustomError(registry, "InvalidExpiration");

      await expect(
        registry
          .connect(issuer)
          .registerCredential(sampleCredentialId, subject.address, testSchemaHash, latestTime - 100)
      ).to.be.revertedWithCustomError(registry, "InvalidExpiration");
    });

    it("should revert on duplicate credentialId", async function () {
      const validUntil = (await time.latest()) + 3600;
      await registry
        .connect(issuer)
        .registerCredential(sampleCredentialId, subject.address, testSchemaHash, validUntil);

      await expect(
        registry
          .connect(issuer)
          .registerCredential(sampleCredentialId, subject.address, testSchemaHash, validUntil + 100)
      ).to.be.revertedWithCustomError(registry, "CredentialAlreadyExists");
    });
  });

  describe("Credential Revocation", function () {
    beforeEach(async function () {
      await registry.connect(owner).authorizeIssuer(issuer.address);
      await registry.connect(owner).authorizeIssuer(issuer2.address);
      const validUntil = (await time.latest()) + 3600;
      await registry
        .connect(issuer)
        .registerCredential(sampleCredentialId, subject.address, testSchemaHash, validUntil);
    });

    it("should allow original issuer to revoke their credential", async function () {
      await expect(
        registry.connect(issuer).revokeCredential(sampleCredentialId, "Document invalidated")
      )
        .to.emit(registry, "CredentialRevoked")
        .withArgs(sampleCredentialId, issuer.address, "Document invalidated");

      const cred = await registry.getCredential(sampleCredentialId);
      expect(cred.isRevoked).to.be.true;
      expect(cred.revokedAt).to.be.greaterThan(0);
      expect(await registry.isValidCredential(sampleCredentialId)).to.be.false;
    });

    it("should allow contract owner to revoke any credential", async function () {
      await expect(
        registry.connect(owner).revokeCredential(sampleCredentialId, "Admin emergency revocation")
      )
        .to.emit(registry, "CredentialRevoked")
        .withArgs(sampleCredentialId, owner.address, "Admin emergency revocation");

      expect(await registry.isValidCredential(sampleCredentialId)).to.be.false;
    });

    it("should revert if another authorized issuer tries to revoke this credential", async function () {
      await expect(
        registry.connect(issuer2).revokeCredential(sampleCredentialId, "Not my credential")
      ).to.be.revertedWithCustomError(registry, "UnauthorizedCaller");
    });

    it("should revert if subject tries to revoke an issuer's credential attestation directly", async function () {
      await expect(
        registry.connect(subject).revokeCredential(sampleCredentialId, "Subject attempt")
      ).to.be.revertedWithCustomError(registry, "UnauthorizedCaller");
    });

    it("should revert if non-existent credential is being revoked", async function () {
      await expect(
        registry.connect(issuer).revokeCredential(sampleCredentialId2, "Does not exist")
      ).to.be.revertedWithCustomError(registry, "CredentialDoesNotExist");
    });

    it("should revert if credential is already revoked", async function () {
      await registry.connect(issuer).revokeCredential(sampleCredentialId, "First revocation");

      await expect(
        registry.connect(issuer).revokeCredential(sampleCredentialId, "Second attempt")
      ).to.be.revertedWithCustomError(registry, "CredentialAlreadyRevoked");
    });
  });

  describe("Validity Queries and Expiry Checks", function () {
    it("should return false for unregistered credential", async function () {
      expect(await registry.isValidCredential(sampleCredentialId)).to.be.false;
    });

    it("should return true when credential is valid and active", async function () {
      await registry.connect(owner).authorizeIssuer(issuer.address);
      const validUntil = (await time.latest()) + 3600;
      await registry
        .connect(issuer)
        .registerCredential(sampleCredentialId, subject.address, testSchemaHash, validUntil);

      expect(await registry.isValidCredential(sampleCredentialId)).to.be.true;
    });

    it("should return false after credential reaches expiration timestamp", async function () {
      await registry.connect(owner).authorizeIssuer(issuer.address);
      const validUntil = (await time.latest()) + 1000;
      await registry
        .connect(issuer)
        .registerCredential(sampleCredentialId, subject.address, testSchemaHash, validUntil);

      expect(await registry.isValidCredential(sampleCredentialId)).to.be.true;

      // Advance time past validUntil
      await time.increaseTo(validUntil + 1);
      expect(await registry.isValidCredential(sampleCredentialId)).to.be.false;
    });

    it("should revert getCredential for unregistered ID", async function () {
      await expect(
        registry.getCredential(sampleCredentialId)
      ).to.be.revertedWithCustomError(registry, "CredentialDoesNotExist");
    });
  });
});
