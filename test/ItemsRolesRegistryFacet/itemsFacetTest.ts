/* global describe it before ethers network */
/* eslint prefer-const: "off" */

//@ts-ignore
import { ethers, network } from "hardhat";
import chai from "chai";
import {
  DAOFacet,
  ItemsFacet,
  LibERC1155,
  LibEventHandler,
  WearablesFacet,
} from "../../typechain";

import { Contract, Signer } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  LargeGotchiOwner,
  LargeGotchiOwnerAavegotchis,
  aavegotchiDiamondAddress,
  wearableAmounts,
  wearableDiamondAddress,
  wearableIds,
  wearableSlots,
  RoleAssignment,
  buildRoleAssignment,
  generateRandomInt,
  ONE_DAY,
} from "./helpers";
import { itemManagerAlt } from "../../scripts/helperFunctions";
import { upgradeWithNewFacets } from "./upgradeScript";

const { expect } = chai;

describe("ItemsRolesRegistryFacet", async () => {
  let ItemsRolesRegistryFacet: Contract;
  let grantor: SignerWithAddress;
  let grantee: Signer;
  let anotherUser: SignerWithAddress;
  let wearablesFacet: WearablesFacet;
  let libEventHandler: LibEventHandler;
  let itemsFacet: ItemsFacet;
  let daoFacet: DAOFacet;
  let libERC1155: LibERC1155;

  const gotchiId = LargeGotchiOwnerAavegotchis[0];

  before(async () => {
    const signers = await ethers.getSigners();
    grantor = signers[0];
    anotherUser = signers[2];

    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [LargeGotchiOwner],
    });
    grantee = await ethers.provider.getSigner(LargeGotchiOwner);

    const diamondOwnerAddress = "0x01F010a5e001fe9d6940758EA5e8c777885E351e";
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [diamondOwnerAddress],
    });
    const diamondOwner = await ethers.provider.getSigner(diamondOwnerAddress);

    await upgradeWithNewFacets({
      diamondAddress: aavegotchiDiamondAddress,
      facetNames: [
        "ItemsRolesRegistryFacet",
        "contracts/Aavegotchi/facets/ItemsFacet.sol:ItemsFacet",
      ],
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

    itemsFacet = (await ethers.getContractAt(
      "contracts/Aavegotchi/facets/ItemsFacet.sol:ItemsFacet",
      aavegotchiDiamondAddress
    )) as ItemsFacet;

    libERC1155 = (await ethers.getContractAt(
      "contracts/shared/libraries/LibERC1155.sol:LibERC1155",
      aavegotchiDiamondAddress
    )) as LibERC1155;

    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [itemManagerAlt],
    });
    const signer = await ethers.provider.getSigner(itemManagerAlt);

    daoFacet = await ethers.getContractAt(
      "DAOFacet",
      aavegotchiDiamondAddress,
      signer
    );

    await daoFacet.updateItemTypeMaxQuantity(wearableIds, wearableAmounts);
    await daoFacet.mintItems(
      grantor.address,
      wearableIds,
      wearableIds.map(() => 1000)
    );
  });

  describe("equipDelegatedWearables", () => {
    let RoleAssignment: RoleAssignment;

    beforeEach(async () => {
      RoleAssignment = await buildRoleAssignment({
        tokenAddress: wearablesFacet.address,
        tokenId: wearableIds[3],
        grantor: grantor.address,
        grantee: LargeGotchiOwner,
      });
      await wearablesFacet
        .connect(grantor)
        .setApprovalForAll(ItemsRolesRegistryFacet.address, true);

      await expect(
        ItemsRolesRegistryFacet.connect(grantor).grantRoleFrom(RoleAssignment)
      ).to.not.be.reverted;

    });

    it("should equip and unequip delegated wearable", async () => {
      await expect(
        itemsFacet
          .connect(grantee)
          .equipDelegatedWearables(
            gotchiId,
            [0, 0, 0, wearableIds[3], 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, RoleAssignment.nonce, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
          )
      )
        .to.emit(libERC1155, "TransferToParent")
        .withArgs(aavegotchiDiamondAddress, gotchiId, wearableIds[3], 1)
        .to.not.emit(libEventHandler, "TransferSingle");

      await expect(
        itemsFacet
          .connect(grantee)
          .equipDelegatedWearables(
            gotchiId,
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
          )
      )
        .to.emit(libERC1155, "TransferFromParent")
        .withArgs(aavegotchiDiamondAddress, gotchiId, wearableIds[3], 1)
        .to.not.emit(libEventHandler, "TransferSingle");
    });
    it("should unequip a delegated wearable when the role is revoked", async () => {
      await expect(
        itemsFacet
          .connect(grantee)
          .equipDelegatedWearables(
            gotchiId,
            [0, 0, 0, wearableIds[3], 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, RoleAssignment.nonce, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
          )
      )
        .to.emit(libERC1155, "TransferToParent")
        .withArgs(aavegotchiDiamondAddress, gotchiId, wearableIds[3], 1)
        .to.not.emit(libEventHandler, "TransferSingle");

      await expect(
        ItemsRolesRegistryFacet.connect(grantor).revokeRoleFrom(RoleAssignment.nonce, RoleAssignment.role)
      ).to.emit(libERC1155, "TransferFromParent")
        .withArgs(aavegotchiDiamondAddress, gotchiId, wearableIds[3], 1)
        .to.not.emit(libEventHandler, "TransferSingle");
    })
    it("should NOT equip a delegated wearable if the depositId is from another wearable", async () => {
      const roleAssignment = await buildRoleAssignment({
        tokenAddress: wearablesFacet.address,
        tokenId: wearableIds[2],
        grantor: grantor.address,
        grantee: await grantee.getAddress(),
      });
      await wearablesFacet
        .connect(grantor)
        .setApprovalForAll(ItemsRolesRegistryFacet.address, true);

      await expect(
        ItemsRolesRegistryFacet.connect(grantor).grantRoleFrom(roleAssignment)
      ).to.not.be.reverted;

      const wrongNonce = RoleAssignment.nonce;

      await expect(
        itemsFacet
          .connect(grantee)
          .equipDelegatedWearables(
            gotchiId,
            [0, 0, 0, wearableIds[2], 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, wrongNonce, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
          )
      ).to.be.revertedWith(
        "ItemsFacet: Delegated Wearable not of this delegation"
      );
    });
    it("should NOT equip a delegated wearable if the grantee is invalid for respective depositId", async () => {
      const roleAssignment = await buildRoleAssignment({
        tokenAddress: wearablesFacet.address,
        tokenId: wearableIds[2],
        grantor: grantor.address,
        grantee: anotherUser.address,
      });
      await wearablesFacet
        .connect(grantor)
        .setApprovalForAll(ItemsRolesRegistryFacet.address, true);

      await expect(
        ItemsRolesRegistryFacet.connect(grantor).grantRoleFrom(roleAssignment)
      ).to.not.be.reverted;

      await expect(
        itemsFacet
          .connect(grantee)
          .equipDelegatedWearables(
            gotchiId,
            [0, 0, 0, wearableIds[2], 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, roleAssignment.nonce, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
          )
      ).to.be.revertedWith(
        "ItemsFacet: Wearable not delegated to sender or depositId not valid"
      );
    });
    it("should NOT equip a delegated wearable if the depositId does not exist", async () => {
      const roleAssignment = await buildRoleAssignment({
        tokenAddress: wearablesFacet.address,
        tokenId: wearableIds[2],
        grantor: grantor.address,
        grantee: await grantee.getAddress(),
      });
      await wearablesFacet
        .connect(grantor)
        .setApprovalForAll(ItemsRolesRegistryFacet.address, true);

      await expect(
        ItemsRolesRegistryFacet.connect(grantor).grantRoleFrom(roleAssignment)
      ).to.not.be.reverted;

      const wrongNonce = generateRandomInt();

      await expect(
        itemsFacet
          .connect(grantee)
          .equipDelegatedWearables(
            gotchiId,
            [0, 0, 0, wearableIds[2], 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, wrongNonce, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
          )
      ).to.be.revertedWith(
        "ItemsFacet: Wearable not delegated to sender or depositId not valid"
      );
    });
    it("should NOT equip a delegated wearable if the wearable is already equipped in other gotchi", async () => {
      await expect(
        itemsFacet
          .connect(grantee)
          .equipDelegatedWearables(
            gotchiId,
            [0, 0, 0, wearableIds[3], 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, RoleAssignment.nonce, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
          )
      )
        .to.emit(libERC1155, "TransferToParent")
        .withArgs(aavegotchiDiamondAddress, gotchiId, wearableIds[3], 1)
        .to.not.emit(libEventHandler, "TransferSingle");

      const anotherGotchiId = LargeGotchiOwnerAavegotchis[1];
      await expect(
        itemsFacet
          .connect(grantee)
          .equipDelegatedWearables(
            anotherGotchiId,
            [0, 0, 0, wearableIds[3], 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, RoleAssignment.nonce, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
          )
      ).to.be.revertedWith("ItemsFacet: Wearable already delegated to another gotchi");

      // unequip for next test
      await expect(
        itemsFacet
          .connect(grantee)
          .equipDelegatedWearables(
            gotchiId,
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
          )
      )
        .to.emit(libERC1155, "TransferFromParent")
        .withArgs(aavegotchiDiamondAddress, gotchiId, wearableIds[3], 1)
        .to.not.emit(libEventHandler, "TransferSingle");
    });
    it("should NOT equip a delegated wearable if the depositId is expired", async () => {
      await network.provider.send("evm_increaseTime", [ONE_DAY]);
      await expect(
        itemsFacet
          .connect(grantee)
          .equipDelegatedWearables(
            gotchiId,
            [0, 0, 0, wearableIds[3], 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, RoleAssignment.nonce, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
          )
      ).to.be.revertedWith("ItemsFacet: Wearable delegation expired");
    });
  });
});
