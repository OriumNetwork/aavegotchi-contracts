/* global describe it before ethers network */
/* eslint prefer-const: "off" */

//@ts-ignore
import { ethers, network } from "hardhat";
import chai from "chai";
import { DAOFacet, LibEventHandler, WearablesFacet } from "../../typechain";

import { Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  ONE_DAY,
  aavegotchiDiamondAddress,
  buildRoleAssignment,
  generateRandomInt,
  time,
  wearableAmounts,
  wearableDiamondAddress,
  wearableIds,
  RoleAssignment,
} from "./helpers";
import { itemManagerAlt } from "../../scripts/helperFunctions";
import { upgradeWithNewFacets } from "./upgradeScript";

const { expect } = chai;
const { AddressZero } = ethers.constants;

describe("ItemsRolesRegistryFacet", async () => {
  let ItemsRolesRegistryFacet: Contract;
  let grantor: SignerWithAddress;
  let grantee: SignerWithAddress;
  let anotherUser: SignerWithAddress;
  let wearablesFacet: WearablesFacet;
  let libEventHandler: LibEventHandler;
  let daoFacet: DAOFacet;

  before(async () => {
    const signers = await ethers.getSigners();
    grantor = signers[0];
    grantee = signers[1];
    anotherUser = signers[2];

    const diamondOwnerAddress = "0x01F010a5e001fe9d6940758EA5e8c777885E351e";
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [diamondOwnerAddress],
    });
    const diamondOwner = await ethers.provider.getSigner(diamondOwnerAddress);

    await upgradeWithNewFacets({
      diamondAddress: aavegotchiDiamondAddress,
      facetNames: ["ItemsRolesRegistryFacet"],
      signer: diamondOwner,
    });

    ItemsRolesRegistryFacet = await ethers.getContractAt(
      "ItemsRolesRegistryFacet",
      aavegotchiDiamondAddress
    );

    wearablesFacet = (await ethers.getContractAt(
      "contracts/Aavegotchi/WearableDiamond/facets/WearablesFacet.sol:WearablesFacet",
      wearableDiamondAddress
    )) as WearablesFacet;

    libEventHandler = (await ethers.getContractAt(
      "contracts/Aavegotchi/WearableDiamond/libraries/LibEventHandler.sol:LibEventHandler",
      wearableDiamondAddress
    )) as LibEventHandler;

    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [itemManagerAlt],
    });
    const signer = await ethers.provider.getSigner(itemManagerAlt);

    daoFacet = (
      await ethers.getContractAt("DAOFacet", aavegotchiDiamondAddress)
    ).connect(signer);

    await daoFacet.updateItemTypeMaxQuantity(wearableIds, wearableAmounts);
    await daoFacet.mintItems(
      grantor.address,
      wearableIds,
      wearableIds.map(() => 1000)
    );
  });

  describe("grantRole", async () => {
    it("should revert without a reason if tokenAddress is not an ERC-1155 contract", async () => {
      const roleAssignment = await buildRoleAssignment();
      await expect(ItemsRolesRegistryFacet.connect(grantor).grantRoleFrom(roleAssignment))
        .to.be.reverted;
    });

    it("should revert if expirationDate is in the past", async () => {
      const roleAssignment = await buildRoleAssignment({
        expirationDate: (await time.latest()) - ONE_DAY,
      });
      await expect(
        ItemsRolesRegistryFacet.grantRoleFrom(roleAssignment)
      ).to.be.revertedWith(
        "ItemsRolesRegistryFacet: expiration date must be in the future"
      );
    });

    it("should revert when sender is not grantor or approved", async () => {
      const roleAssignment = await buildRoleAssignment();
      await expect(
        ItemsRolesRegistryFacet.connect(grantor).grantRoleFrom(roleAssignment)
      ).to.be.revertedWith("ItemsRolesRegistryFacet: account not approved");
    });

    it("should revert if tokenAmount is zero", async () => {
      const roleAssignment = await buildRoleAssignment({
        tokenAmount: 0,
      });
      await expect(
        ItemsRolesRegistryFacet.connect(grantor).grantRoleFrom(roleAssignment)
      ).to.be.revertedWith(
        "ItemsRolesRegistryFacet: tokenAmount must be greater than zero"
      );
    });

    it("should revert when grantor does not have enough tokens", async () => {
      const roleAssignment = await buildRoleAssignment({
        tokenAddress: wearablesFacet.address,
        grantor: grantor.address,
        tokenAmount: 999999,
      });
      await wearablesFacet
        .connect(grantor)
        .setApprovalForAll(ItemsRolesRegistryFacet.address, true);
      await expect(
        ItemsRolesRegistryFacet.connect(grantor).grantRoleFrom(roleAssignment)
      ).to.be.revertedWith("LibItems: Doesn't have that many to transfer");
    });

    it("should revert if nonce is zero", async () => {
      const roleAssignment = await buildRoleAssignment({
        nonce: 0,
        tokenAddress: wearablesFacet.address,
        grantor: grantor.address,
      });
      await wearablesFacet
        .connect(grantor)
        .setApprovalForAll(ItemsRolesRegistryFacet.address, true);
      await expect(
        ItemsRolesRegistryFacet.connect(grantor).grantRoleFrom(roleAssignment)
      ).to.be.revertedWith("ItemsRolesRegistryFacet: nonce must be greater than zero");
    });

    describe("when nonce does not exist", async () => {
      it("should grant role when grantor is sender and has enough tokens", async () => {
        const roleAssignment = await buildRoleAssignment({
          grantor: grantor.address,
        });

        await wearablesFacet
          .connect(grantor)
          .setApprovalForAll(ItemsRolesRegistryFacet.address, true);
        await expect(ItemsRolesRegistryFacet.connect(grantor).grantRoleFrom(roleAssignment))
          .to.emit(ItemsRolesRegistryFacet, "RoleGranted")
          .withArgs(
            roleAssignment.nonce,
            roleAssignment.role,
            roleAssignment.tokenAddress,
            roleAssignment.tokenId,
            roleAssignment.tokenAmount,
            roleAssignment.grantor,
            roleAssignment.grantee,
            roleAssignment.expirationDate,
            roleAssignment.revocable,
            roleAssignment.data
          );
      });

      it("should grant role when sender is approved and grantor has enough tokens", async () => {
        const roleAssignment = await buildRoleAssignment({
          grantor: grantor.address,
        });
        await wearablesFacet
          .connect(grantor)
          .setApprovalForAll(ItemsRolesRegistryFacet.address, true);
        await ItemsRolesRegistryFacet.connect(grantor).setRoleApprovalForAll(
          roleAssignment.tokenAddress,
          anotherUser.address,
          true
        );
        await expect(
          ItemsRolesRegistryFacet.connect(anotherUser).grantRoleFrom(roleAssignment)
        )
          .to.emit(ItemsRolesRegistryFacet, "RoleGranted")
          .withArgs(
            roleAssignment.nonce,
            roleAssignment.role,
            roleAssignment.tokenAddress,
            roleAssignment.tokenId,
            roleAssignment.tokenAmount,
            roleAssignment.grantor,
            roleAssignment.grantee,
            roleAssignment.expirationDate,
            roleAssignment.revocable,
            roleAssignment.data
          );
      });
    });
  });

  describe("when nonce exists", async () => {
    let RoleAssignment: RoleAssignment;

    beforeEach(async () => {
      RoleAssignment = await buildRoleAssignment({
        grantor: grantor.address,
      });
      await wearablesFacet
        .connect(grantor)
        .setApprovalForAll(ItemsRolesRegistryFacet.address, true);
      await expect(ItemsRolesRegistryFacet.connect(grantor).grantRoleFrom(RoleAssignment))
        .to.emit(ItemsRolesRegistryFacet, "RoleGranted")
        .withArgs(
          RoleAssignment.nonce,
          RoleAssignment.role,
          RoleAssignment.tokenAddress,
          RoleAssignment.tokenId,
          RoleAssignment.tokenAmount,
          RoleAssignment.grantor,
          RoleAssignment.grantee,
          RoleAssignment.expirationDate,
          RoleAssignment.revocable,
          RoleAssignment.data
        );
    });

    it("should revert if nonce is not expired", async () => {
      const revocableRoleAssignment = await buildRoleAssignment({
        tokenAddress: wearablesFacet.address,
        grantor: grantor.address,
        revocable: false,
      });

      await ItemsRolesRegistryFacet.connect(grantor).grantRoleFrom(revocableRoleAssignment);
      await expect(
        ItemsRolesRegistryFacet.connect(grantor).grantRoleFrom(revocableRoleAssignment)
      ).to.be.revertedWith(
        "ItemsRolesRegistryFacet: nonce is not expired or is not revocable"
      );
    });

    it("should revert if grantor's balance is insufficient", async () => {
      await expect(
        ItemsRolesRegistryFacet.connect(grantor).grantRoleFrom({
          ...RoleAssignment,
          nonce: generateRandomInt(),
          tokenAmount: 9999999999,
        })
      ).to.be.revertedWith("LibItems: Doesn't have that many to transfer");
    });

    it("should grant role if tokens deposited are equal to tokens requested", async () => {
      await expect(ItemsRolesRegistryFacet.connect(grantor).grantRoleFrom(RoleAssignment))
        .to.emit(ItemsRolesRegistryFacet, "RoleGranted")
        .withArgs(
          RoleAssignment.nonce,
          RoleAssignment.role,
          RoleAssignment.tokenAddress,
          RoleAssignment.tokenId,
          RoleAssignment.tokenAmount,
          RoleAssignment.grantor,
          RoleAssignment.grantee,
          RoleAssignment.expirationDate,
          RoleAssignment.revocable,
          RoleAssignment.data
        )
        // should not transfer any tokens
        .to.not.emit(libEventHandler, "TransferSingle");
    });
  });

  describe("grantorole", async () => {
    let RoleAssignment: RoleAssignment;

    beforeEach(async () => {
      RoleAssignment = await buildRoleAssignment({
        tokenAddress: wearablesFacet.address,
        grantor: grantor.address,
        grantee: grantee.address,
      });
      await wearablesFacet
        .connect(grantor)
        .setApprovalForAll(ItemsRolesRegistryFacet.address, true);

      await expect(ItemsRolesRegistryFacet.connect(grantor).grantRoleFrom(RoleAssignment))
        .to.not.be.reverted;
    });

    it("should revert if grantee is invalid", async () => {
      const newRoleAssignment = await buildRoleAssignment({
        tokenAddress: wearablesFacet.address,
        grantor: grantor.address,
        revocable: false,
      });

      await expect(
        ItemsRolesRegistryFacet.connect(grantor).grantRoleFrom(newRoleAssignment)
      );

      await expect(
        ItemsRolesRegistryFacet.connect(grantor).revokeRoleFrom(
          newRoleAssignment.nonce,
          newRoleAssignment.role
        )
      ).to.be.revertedWith("ItemsRolesRegistryFacet: invalid grantee");
    });

    it("should revert if nonce is not expired and is not revocable", async () => {
      const newRoleAssignment = await buildRoleAssignment({
        nonce: generateRandomInt(),
        tokenAddress: wearablesFacet.address,
        grantor: grantor.address,
        grantee: grantee.address,
        revocable: false,
      });

      await ItemsRolesRegistryFacet.connect(grantor).grantRoleFrom(newRoleAssignment);

      await expect(
        ItemsRolesRegistryFacet.connect(grantor).revokeRoleFrom(
          newRoleAssignment.nonce,
          newRoleAssignment.role
        )
      ).to.be.revertedWith(
        "ItemsRolesRegistryFacet: nonce is not expired or is not revocable"
      );
    });

    it("should revert if caller is not approved", async () => {
      await ItemsRolesRegistryFacet.connect(grantor).setRoleApprovalForAll(
        RoleAssignment.tokenAddress,
        anotherUser.address,
        false
      );
      await ItemsRolesRegistryFacet.connect(grantee).setRoleApprovalForAll(
        RoleAssignment.tokenAddress,
        anotherUser.address,
        false
      );
      await expect(
        ItemsRolesRegistryFacet.connect(anotherUser).revokeRoleFrom(
          RoleAssignment.nonce,
          RoleAssignment.role
        )
      ).to.be.revertedWith("ItemsRolesRegistryFacet: sender must be approved");
    });

    it("should revoke role if sender is grantor", async () => {
      await expect(
        ItemsRolesRegistryFacet.connect(grantor).revokeRoleFrom(
          RoleAssignment.nonce,
          RoleAssignment.role
        )
      )
        .to.emit(ItemsRolesRegistryFacet, "RoleRevoked")
        .withArgs(
          RoleAssignment.nonce,
          RoleAssignment.role,
          RoleAssignment.tokenAddress,
          RoleAssignment.tokenId,
          RoleAssignment.tokenAmount,
          RoleAssignment.grantor,
          RoleAssignment.grantee
        );
      // transfer tokens back to owner
      /*  .to.emit(wearablesFacet, 'TransferSingle')
        .withArgs(
          ItemsRolesRegistryFacet.address,
          ItemsRolesRegistryFacet.address,
          RoleAssignment.grantor,
          RoleAssignment.tokenId,
          RoleAssignment.tokenAmount,
        ) */
    });

    it("should revoke role if sender is approved by grantor", async () => {
      await ItemsRolesRegistryFacet.connect(grantor).setRoleApprovalForAll(
        RoleAssignment.tokenAddress,
        anotherUser.address,
        true
      );
      await expect(
        ItemsRolesRegistryFacet.connect(anotherUser).revokeRoleFrom(
          RoleAssignment.nonce,
          RoleAssignment.role
        )
      )
        .to.emit(ItemsRolesRegistryFacet, "RoleRevoked")
        .withArgs(
          RoleAssignment.nonce,
          RoleAssignment.role,
          RoleAssignment.tokenAddress,
          RoleAssignment.tokenId,
          RoleAssignment.tokenAmount,
          RoleAssignment.grantor,
          RoleAssignment.grantee
        );
      // transfer tokens back to owner
      /* .to.emit(wearablesFacet, 'TransferSingle')
        .withArgs(
          ItemsRolesRegistryFacet.address,
          ItemsRolesRegistryFacet.address,
          RoleAssignment.grantor,
          RoleAssignment.tokenId,
          RoleAssignment.tokenAmount,
        ) */
    });
    it("should revoke role if sender is approved by grantee", async () => {
      await ItemsRolesRegistryFacet.connect(grantee).setRoleApprovalForAll(
        RoleAssignment.tokenAddress,
        anotherUser.address,
        true
      );
      await expect(
        ItemsRolesRegistryFacet.connect(anotherUser).revokeRoleFrom(
          RoleAssignment.nonce,
          RoleAssignment.role
        )
      )
        .to.emit(ItemsRolesRegistryFacet, "RoleRevoked")
        .withArgs(
          RoleAssignment.nonce,
          RoleAssignment.role,
          RoleAssignment.tokenAddress,
          RoleAssignment.tokenId,
          RoleAssignment.tokenAmount,
          RoleAssignment.grantor,
          RoleAssignment.grantee
        );
      // transfer tokens back to owner
      /*         .to.emit(wearablesFacet, 'TransferSingle')
        .withArgs(
          ItemsRolesRegistryFacet.address,
          ItemsRolesRegistryFacet.address,
          RoleAssignment.grantor,
          RoleAssignment.tokenId,
          RoleAssignment.tokenAmount,
        ) */
    });

    it("should revoke role if sender is grantee", async () => {
      const newRoleAssignment = await buildRoleAssignment({
        nonce: generateRandomInt(),
        tokenAddress: wearablesFacet.address,
        grantor: grantor.address,
        grantee: grantee.address,
        revocable: false,
      });

      await ItemsRolesRegistryFacet.connect(grantor).grantRoleFrom(newRoleAssignment);

      await expect(
        ItemsRolesRegistryFacet.connect(grantee).revokeRoleFrom(
          newRoleAssignment.nonce,
          newRoleAssignment.role
        )
      )
        .to.emit(ItemsRolesRegistryFacet, "RoleRevoked")
        .withArgs(
          newRoleAssignment.nonce,
          newRoleAssignment.role,
          newRoleAssignment.tokenAddress,
          newRoleAssignment.tokenId,
          newRoleAssignment.tokenAmount,
          newRoleAssignment.grantor,
          newRoleAssignment.grantee
        );
      // transfer tokens back to owner
      /*         .to.emit(wearablesFacet, 'TransferSingle')
        .withArgs(
          ItemsRolesRegistryFacet.address,
          ItemsRolesRegistryFacet.address,
          RoleAssignment.grantor,
          RoleAssignment.tokenId,
          RoleAssignment.tokenAmount,
        ) */
    });
  });

  describe("setRoleApprovalForAll", async () => {
    it("should approve and revoke approval", async () => {
      expect(
        await ItemsRolesRegistryFacet.isRoleApprovedForAll(
          AddressZero,
          grantor.address,
          anotherUser.address
        )
      ).to.be.false;
      expect(
        await ItemsRolesRegistryFacet.connect(grantor).setRoleApprovalForAll(
          AddressZero,
          anotherUser.address,
          true
        )
      )
        .to.emit(ItemsRolesRegistryFacet, "RoleApprovalForAll")
        .withArgs(AddressZero, grantor.address, anotherUser.address, true);
      expect(
        await ItemsRolesRegistryFacet.isRoleApprovedForAll(
          AddressZero,
          grantor.address,
          anotherUser.address
        )
      ).to.be.true;
    });
  });

  describe("withdraw", async function () {
    let RoleAssignment: RoleAssignment;

    beforeEach(async () => {
      RoleAssignment = await buildRoleAssignment({
        tokenAddress: wearablesFacet.address,
        grantor: grantor.address,
        grantee: grantee.address,
        revocable: false,
      });

      await wearablesFacet
        .connect(grantor)
        .setApprovalForAll(ItemsRolesRegistryFacet.address, true);

      await expect(ItemsRolesRegistryFacet.connect(grantor).grantRoleFrom(RoleAssignment))
        .to.not.be.reverted;
    });
    it("should revert nonce role is not expired", async () => {
      await expect(
        ItemsRolesRegistryFacet.connect(grantor).withdraw(RoleAssignment.nonce)
      ).to.be.revertedWith("ItemsRolesRegistryFacet: nft is delegated");
    });
    it("should revert if nonce does not exist", async () => {
      await expect(
        ItemsRolesRegistryFacet.connect(grantor).withdraw(generateRandomInt())
      ).to.be.revertedWith(
        "ItemsRolesRegistryFacet: tokenAmount must be greater than zero"
      );
    });
    it("should not revert if nonce is expired", async () => {
      await time.increase(ONE_DAY);
      await expect(ItemsRolesRegistryFacet.connect(grantor).withdraw(RoleAssignment.nonce))
        .to.emit(ItemsRolesRegistryFacet, "Withdrew")
        .withArgs(
          RoleAssignment.nonce,
          RoleAssignment.grantor,
          RoleAssignment.tokenId,
          RoleAssignment.tokenAddress,
          RoleAssignment.tokenAmount
        );
    });
    it("should not revert if nonce has a role revoked", async () => {
      await time.increase(ONE_DAY);
      await ItemsRolesRegistryFacet.connect(grantor).revokeRoleFrom(
        RoleAssignment.nonce,
        RoleAssignment.role
      );
      await expect(ItemsRolesRegistryFacet.connect(grantor).withdraw(RoleAssignment.nonce))
        .to.emit(ItemsRolesRegistryFacet, "Withdrew")
        .withArgs(
          RoleAssignment.nonce,
          RoleAssignment.grantor,
          RoleAssignment.tokenId,
          RoleAssignment.tokenAddress,
          RoleAssignment.tokenAmount
        );
    });
    it("shoudl not revert if nonce has a revocable role", async () => {
      await time.increase(ONE_DAY);
      RoleAssignment.revocable = true;
      RoleAssignment.expirationDate = (await time.latest()) + ONE_DAY;
      await ItemsRolesRegistryFacet.connect(grantor).grantRoleFrom(RoleAssignment);
      await expect(ItemsRolesRegistryFacet.connect(grantor).withdraw(RoleAssignment.nonce))
        .to.emit(ItemsRolesRegistryFacet, "Withdrew")
        .withArgs(
          RoleAssignment.nonce,
          RoleAssignment.grantor,
          RoleAssignment.tokenId,
          RoleAssignment.tokenAddress,
          RoleAssignment.tokenAmount
        );
    });
  });

  describe("View Functions", async () => {
    let RoleAssignment: RoleAssignment;

    beforeEach(async () => {
      RoleAssignment = await buildRoleAssignment({
        tokenAddress: wearablesFacet.address,
        grantor: grantor.address,
        grantee: grantee.address,
      });
      await wearablesFacet
        .connect(grantor)
        .setApprovalForAll(ItemsRolesRegistryFacet.address, true);
      await expect(ItemsRolesRegistryFacet.connect(grantor).grantRoleFrom(RoleAssignment))
        .to.not.be.reverted;
    });

    it("should return the role data", async () => {
      const roleData = await ItemsRolesRegistryFacet.roleData(
        RoleAssignment.nonce,
        RoleAssignment.role
      );

      expect(roleData.expirationDate).to.be.equal(
        RoleAssignment.expirationDate
      );
      expect(roleData.revocable).to.be.equal(RoleAssignment.revocable);
      expect(roleData.data).to.be.equal(RoleAssignment.data);
    });

    it("should return the expiration date", async () => {
      expect(
        await ItemsRolesRegistryFacet.roleExpirationDate(
          RoleAssignment.nonce,
          RoleAssignment.role
        )
      ).to.be.equal(RoleAssignment.expirationDate);
    });

  });

  describe("ERC-165 supportsInterface", async () => {
    it("should return true if ERC1155Receiver interface id", async () => {
      expect(await ItemsRolesRegistryFacet.supportsInterface("0x4e2312e0")).to.be.true;
    });
  });
});
