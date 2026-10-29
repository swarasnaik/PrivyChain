const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("PrivyPermissionManager", function () {
  let registry;
  let manager;
  let owner;
  let issuer;
  let subject;
  let subject2;
  let verifier;
  let verifier2;
  let attacker;

  const schemaHash = ethers.keccak256(ethers.toUtf8Bytes("SCHEMA_KYC_VERIFICATION_V1"));
  const credentialId = ethers.keccak256(ethers.toUtf8Bytes("CREDENTIAL_OPAQUE_REF_1001"));
  const credentialId2 = ethers.keccak256(ethers.toUtf8Bytes("CREDENTIAL_OPAQUE_REF_1002"));
  const perpetualCredId = ethers.keccak256(ethers.toUtf8Bytes("CREDENTIAL_PERPETUAL_1003"));
  const scopeEmployment = ethers.keccak256(ethers.toUtf8Bytes("SCOPE_READ_EMPLOYMENT"));
  const scopeIdentity = ethers.keccak256(ethers.toUtf8Bytes("SCOPE_READ_IDENTITY_STATUS"));

  let credExpiry;

  beforeEach(async function () {
    [owner, issuer, subject, subject2, verifier, verifier2, attacker] = await ethers.getSigners();

    // Deploy Registry
    const PrivyCredentialRegistry = await ethers.getContractFactory("PrivyCredentialRegistry");
    registry = await PrivyCredentialRegistry.deploy(owner.address);
    await registry.waitForDeployment();

    // Deploy Permission Manager
    const PrivyPermissionManager = await ethers.getContractFactory("PrivyPermissionManager");
    manager = await PrivyPermissionManager.deploy(await registry.getAddress());
    await manager.waitForDeployment();

    // Setup: Authorize issuer
    await registry.connect(owner).authorizeIssuer(issuer.address);

    // Setup: Register a credential for subject with 2 hours validity
    credExpiry = (await time.latest()) + 7200;
    await registry
      .connect(issuer)
      .registerCredential(credentialId, subject.address, schemaHash, credExpiry);

    // Setup: Register perpetual credential for subject (validUntil = 0)
    await registry
      .connect(issuer)
      .registerCredential(perpetualCredId, subject.address, schemaHash, 0);

    // Setup: Register a credential for subject2
    await registry
      .connect(issuer)
      .registerCredential(credentialId2, subject2.address, schemaHash, credExpiry);
  });

  describe("Constructor & Initialization", function () {
    it("should set the immutable registry address correctly", async function () {
      expect(await manager.registry()).to.equal(await registry.getAddress());
    });

    it("should revert if initialized with zero registry address", async function () {
      const PrivyPermissionManager = await ethers.getContractFactory("PrivyPermissionManager");
      await expect(
        PrivyPermissionManager.deploy(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(manager, "ZeroAddress");
    });
  });

  describe("Permission Grants by Subject", function () {
    it("should allow credential subject to grant permission and emit PermissionGranted", async function () {
      const permExpiry = (await time.latest()) + 3600; // 1 hr (< 2 hr credExpiry)
      const expectedPermissionId = await manager.computePermissionId(
        subject.address,
        verifier.address,
        credentialId,
        scopeEmployment
      );

      await expect(
        manager
          .connect(subject)
          .grantPermission(verifier.address, credentialId, scopeEmployment, permExpiry)
      )
        .to.emit(manager, "PermissionGranted")
        .withArgs(
          expectedPermissionId,
          subject.address,
          verifier.address,
          credentialId,
          scopeEmployment,
          permExpiry
        );

      const perm = await manager.getPermission(expectedPermissionId);
      expect(perm.subject).to.equal(subject.address);
      expect(perm.verifier).to.equal(verifier.address);
      expect(perm.credentialId).to.equal(credentialId);
      expect(perm.scope).to.equal(scopeEmployment);
      expect(perm.validUntil).to.equal(permExpiry);
      expect(perm.isActive).to.be.true;
      expect(perm.isRevoked).to.be.false;
    });

    it("should allow subject to grant permission on a perpetual credential", async function () {
      const permExpiry = (await time.latest()) + 3600;

      await expect(
        manager
          .connect(subject)
          .grantPermission(verifier.address, perpetualCredId, scopeIdentity, permExpiry)
      ).to.not.be.reverted;

      expect(
        await manager.checkPermission(
          subject.address,
          verifier.address,
          perpetualCredId,
          scopeIdentity
        )
      ).to.be.true;
    });

    it("should revert if an unauthorized caller tries to grant permission for another subject's credential", async function () {
      const permExpiry = (await time.latest()) + 3600;

      // Attacker tries to grant permission for subject's credential
      await expect(
        manager
          .connect(attacker)
          .grantPermission(verifier.address, credentialId, scopeEmployment, permExpiry)
      )
        .to.be.revertedWithCustomError(manager, "NotCredentialSubject")
        .withArgs(attacker.address, subject.address);
    });

    it("should revert if verifier is zero address", async function () {
      const permExpiry = (await time.latest()) + 3600;
      await expect(
        manager
          .connect(subject)
          .grantPermission(ethers.ZeroAddress, credentialId, scopeEmployment, permExpiry)
      ).to.be.revertedWithCustomError(manager, "ZeroAddress");
    });

    it("should revert if credentialId is zero bytes32", async function () {
      const permExpiry = (await time.latest()) + 3600;
      await expect(
        manager
          .connect(subject)
          .grantPermission(verifier.address, ethers.ZeroHash, scopeEmployment, permExpiry)
      ).to.be.revertedWithCustomError(manager, "ZeroCredentialId");
    });

    it("should revert if scope is zero bytes32", async function () {
      const permExpiry = (await time.latest()) + 3600;
      await expect(
        manager
          .connect(subject)
          .grantPermission(verifier.address, credentialId, ethers.ZeroHash, permExpiry)
      ).to.be.revertedWithCustomError(manager, "ZeroScope");
    });

    it("should revert if permission validUntil is in the past", async function () {
      const latestTime = await time.latest();
      await expect(
        manager
          .connect(subject)
          .grantPermission(verifier.address, credentialId, scopeEmployment, latestTime)
      ).to.be.revertedWithCustomError(manager, "InvalidExpiration");

      await expect(
        manager
          .connect(subject)
          .grantPermission(verifier.address, credentialId, scopeEmployment, latestTime - 100)
      ).to.be.revertedWithCustomError(manager, "InvalidExpiration");
    });

    it("should revert if permission expiry exceeds underlying credential expiry", async function () {
      // Credential expires in 7200 seconds; permission tries to set 7300 seconds
      const excessiveExpiry = credExpiry + 100;
      await expect(
        manager
          .connect(subject)
          .grantPermission(verifier.address, credentialId, scopeEmployment, excessiveExpiry)
      )
        .to.be.revertedWithCustomError(manager, "PermissionExceedsCredentialExpiry")
        .withArgs(excessiveExpiry, credExpiry);
    });

    it("should revert if credential does not exist in registry", async function () {
      const nonExistentCredId = ethers.keccak256(ethers.toUtf8Bytes("NON_EXISTENT_CRED_404"));
      const permExpiry = (await time.latest()) + 3600;

      await expect(
        manager
          .connect(subject)
          .grantPermission(verifier.address, nonExistentCredId, scopeEmployment, permExpiry)
      ).to.be.revertedWithCustomError(registry, "CredentialDoesNotExist");
    });

    it("should revert if credential is already revoked in registry", async function () {
      await registry.connect(issuer).revokeCredential(credentialId, "Fraudulent");

      const permExpiry = (await time.latest()) + 3600;
      await expect(
        manager
          .connect(subject)
          .grantPermission(verifier.address, credentialId, scopeEmployment, permExpiry)
      ).to.be.revertedWithCustomError(manager, "CredentialInvalidOrRevoked");
    });

    it("should revert if credential is already expired in registry", async function () {
      // Advance time past credential expiration
      await time.increaseTo(credExpiry + 1);

      const permExpiry = (await time.latest()) + 3600;
      await expect(
        manager
          .connect(subject)
          .grantPermission(verifier.address, credentialId, scopeEmployment, permExpiry)
      ).to.be.revertedWithCustomError(manager, "CredentialInvalidOrRevoked");
    });
  });

  describe("Permission Verification & Scope Checks", function () {
    let permExpiry;
    let permissionId;

    beforeEach(async function () {
      permExpiry = (await time.latest()) + 3600;
      permissionId = await manager.computePermissionId(
        subject.address,
        verifier.address,
        credentialId,
        scopeEmployment
      );

      await manager
        .connect(subject)
        .grantPermission(verifier.address, credentialId, scopeEmployment, permExpiry);
    });

    it("should return true for valid permission via isPermissionValid and checkPermission", async function () {
      expect(await manager.isPermissionValid(permissionId)).to.be.true;
      expect(
        await manager.checkPermission(
          subject.address,
          verifier.address,
          credentialId,
          scopeEmployment
        )
      ).to.be.true;
    });

    it("should return false if queried with wrong verifier", async function () {
      expect(
        await manager.checkPermission(
          subject.address,
          verifier2.address,
          credentialId,
          scopeEmployment
        )
      ).to.be.false;
    });

    it("should return false if queried with wrong subject", async function () {
      expect(
        await manager.checkPermission(
          subject2.address,
          verifier.address,
          credentialId,
          scopeEmployment
        )
      ).to.be.false;
    });

    it("should return false if queried with wrong scope", async function () {
      expect(
        await manager.checkPermission(
          subject.address,
          verifier.address,
          credentialId,
          scopeIdentity
        )
      ).to.be.false;
    });

    it("should return false if queried with wrong credentialId", async function () {
      expect(
        await manager.checkPermission(
          subject.address,
          verifier.address,
          credentialId2,
          scopeEmployment
        )
      ).to.be.false;
    });

    it("should return false immediately when permission expires", async function () {
      expect(await manager.isPermissionValid(permissionId)).to.be.true;

      // Advance time past permission expiry
      await time.increaseTo(permExpiry + 1);

      expect(await manager.isPermissionValid(permissionId)).to.be.false;
      expect(
        await manager.checkPermission(
          subject.address,
          verifier.address,
          credentialId,
          scopeEmployment
        )
      ).to.be.false;
    });

    it("should automatically invalidate permission if underlying credential is revoked in registry", async function () {
      expect(await manager.isPermissionValid(permissionId)).to.be.true;

      // Issuer revokes credential
      await registry.connect(issuer).revokeCredential(credentialId, "Compromised");

      // Permission check must now return false dynamically
      expect(await manager.isPermissionValid(permissionId)).to.be.false;
      expect(
        await manager.checkPermission(
          subject.address,
          verifier.address,
          credentialId,
          scopeEmployment
        )
      ).to.be.false;
    });

    it("should automatically invalidate permission if underlying credential expires", async function () {
      // Grant permission with same expiry as credential
      const longPermissionId = await manager.computePermissionId(
        subject.address,
        verifier.address,
        credentialId,
        scopeIdentity
      );
      await manager
        .connect(subject)
        .grantPermission(verifier.address, credentialId, scopeIdentity, credExpiry);

      expect(await manager.isPermissionValid(longPermissionId)).to.be.true;

      // Advance time past credential expiration
      await time.increaseTo(credExpiry + 1);

      expect(await manager.isPermissionValid(longPermissionId)).to.be.false;
    });
  });

  describe("Permission Revocation", function () {
    let permExpiry;
    let permissionId;

    beforeEach(async function () {
      permExpiry = (await time.latest()) + 3600;
      permissionId = await manager.computePermissionId(
        subject.address,
        verifier.address,
        credentialId,
        scopeEmployment
      );

      await manager
        .connect(subject)
        .grantPermission(verifier.address, credentialId, scopeEmployment, permExpiry);
    });

    it("should allow subject to revoke permission by permissionId and emit PermissionRevoked", async function () {
      await expect(manager.connect(subject)["revokePermission(bytes32)"](permissionId))
        .to.emit(manager, "PermissionRevoked")
        .withArgs(
          permissionId,
          subject.address,
          verifier.address,
          credentialId,
          scopeEmployment
        );

      const perm = await manager.getPermission(permissionId);
      expect(perm.isActive).to.be.false;
      expect(perm.isRevoked).to.be.true;
      expect(await manager.isPermissionValid(permissionId)).to.be.false;
    });

    it("should allow subject to revoke permission by tuple (verifier, credentialId, scope)", async function () {
      await expect(
        manager
          .connect(subject)["revokePermission(address,bytes32,bytes32)"](
            verifier.address,
            credentialId,
            scopeEmployment
          )
      )
        .to.emit(manager, "PermissionRevoked")
        .withArgs(
          permissionId,
          subject.address,
          verifier.address,
          credentialId,
          scopeEmployment
        );

      expect(await manager.isPermissionValid(permissionId)).to.be.false;
    });

    it("should revert if non-subject (verifier) attempts to revoke permission", async function () {
      await expect(
        manager.connect(verifier)["revokePermission(bytes32)"](permissionId)
      ).to.be.revertedWithCustomError(manager, "UnauthorizedCaller");
    });

    it("should revert if third party (attacker) attempts to revoke permission", async function () {
      await expect(
        manager.connect(attacker)["revokePermission(bytes32)"](permissionId)
      ).to.be.revertedWithCustomError(manager, "UnauthorizedCaller");
    });

    it("should revert if revoking an already revoked permission", async function () {
      await manager.connect(subject)["revokePermission(bytes32)"](permissionId);

      await expect(
        manager.connect(subject)["revokePermission(bytes32)"](permissionId)
      ).to.be.revertedWithCustomError(manager, "PermissionAlreadyRevoked");
    });

    it("should revert if revoking a non-existent permission", async function () {
      const nonExistentPermId = ethers.keccak256(ethers.toUtf8Bytes("NON_EXISTENT_PERMISSION_ID"));
      await expect(
        manager.connect(subject)["revokePermission(bytes32)"](nonExistentPermId)
      ).to.be.revertedWithCustomError(manager, "PermissionDoesNotExist");
    });

    it("should allow subject to grant permission again after revoking previous grant", async function () {
      // 1. Revoke existing permission
      await manager.connect(subject)["revokePermission(bytes32)"](permissionId);
      expect(await manager.isPermissionValid(permissionId)).to.be.false;

      // 2. Re-grant with fresh expiration
      const newPermExpiry = (await time.latest()) + 1800;
      await expect(
        manager
          .connect(subject)
          .grantPermission(verifier.address, credentialId, scopeEmployment, newPermExpiry)
      ).to.emit(manager, "PermissionGranted");

      const perm = await manager.getPermission(permissionId);
      expect(perm.isActive).to.be.true;
      expect(perm.isRevoked).to.be.false;
      expect(perm.validUntil).to.equal(newPermExpiry);
      expect(await manager.isPermissionValid(permissionId)).to.be.true;
    });
  });

  describe("Edge Cases and State Queries", function () {
    it("should revert getPermission for unregistered permissionId", async function () {
      const fakeId = ethers.keccak256(ethers.toUtf8Bytes("DOES_NOT_EXIST"));
      await expect(
        manager.getPermission(fakeId)
      ).to.be.revertedWithCustomError(manager, "PermissionDoesNotExist");
    });

    it("should return false for isPermissionValid on uninitialized permissionId", async function () {
      const fakeId = ethers.keccak256(ethers.toUtf8Bytes("DOES_NOT_EXIST"));
      expect(await manager.isPermissionValid(fakeId)).to.be.false;
    });
  });
});
