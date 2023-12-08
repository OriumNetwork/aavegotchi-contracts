// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import {IERC1155} from "../../shared/interfaces/IERC1155.sol";
import {IERC165} from "../../shared/interfaces/IERC165.sol";
import {ISftRolesRegistry} from "../../shared/interfaces/ISftRolesRegistry.sol";

import {LibItems} from "../libraries/LibItems.sol";
import {LibMeta} from "../../shared/libraries/LibMeta.sol";
import {LibERC1155Marketplace} from "../libraries/LibERC1155Marketplace.sol";

import {Modifiers, ItemType, EQUIPPED_WEARABLE_SLOTS} from "../libraries/LibAppStorage.sol";
import {IERC1155Receiver} from "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
import {ERC1155Holder, ERC1155Receiver} from "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import {IEventHandlerFacet} from "../WearableDiamond/interfaces/IEventHandlerFacet.sol";
import {LibERC1155} from "../../shared/libraries/LibERC1155.sol";

contract ItemsRolesRegistryFacet is Modifiers, ISftRolesRegistry, ERC1155Holder {
    bytes32 public constant EQUIP_WEARABLE_ROLE = keccak256("EQUIP_WEARABLE_ROLE");

    /** Modifiers **/

    modifier onlyWearables(address _tokenAddress, uint256 _tokenId) {
        require(s.wearableDiamond != address(0), "ItemsRolesRegistryFacet: WearableDiamond address must be set");
        require(_tokenAddress == s.wearableDiamond, "ItemsRolesRegistryFacet: Only Item NFTs are supported");
        require(
            s.itemTypes[_tokenId].category == LibItems.ITEM_CATEGORY_WEARABLE,
            "ItemsRolesRegistryFacet: Only Items of type Wearable are supported"
        );
        _;
    }

    modifier validExpirationDate(uint64 _expirationDate) {
        require(_expirationDate > block.timestamp, "ItemsRolesRegistryFacet: expiration date must be in the future");
        _;
    }

    modifier onlyOwnerOrApprovedWithBalance(
        address _account,
        address _tokenAddress,
        uint256 _tokenId,
        uint256 _tokenAmount
    ) {
        require(_tokenAmount > 0, "ItemsRolesRegistryFacet: tokenAmount must be greater than zero");
        require(_account == msg.sender || isRoleApprovedForAll(_tokenAddress, _account, msg.sender), "ItemsRolesRegistryFacet: account not approved");
        _;
    }

    /** External Functions **/

    function grantRoleFrom(
        RoleAssignment calldata _grantRoleData
    )
        external
        override
        onlyWearables(_grantRoleData.tokenAddress, _grantRoleData.tokenId)
        validExpirationDate(_grantRoleData.expirationDate)
        onlyOwnerOrApprovedWithBalance(_grantRoleData.grantor, _grantRoleData.tokenAddress, _grantRoleData.tokenId, _grantRoleData.tokenAmount)
    {
        require(_grantRoleData.nonce > 0, "ItemsRolesRegistryFacet: nonce must be greater than zero");
        DepositInfo memory _depositInfo = s.itemsDeposits[_grantRoleData.nonce];
        if (_depositInfo.tokenAmount == 0) {
            _depositInfo = DepositInfo(_grantRoleData.grantor, _grantRoleData.tokenAddress, _grantRoleData.tokenId, _grantRoleData.tokenAmount);
            _deposit(_grantRoleData.nonce, _depositInfo);
        }
        RoleData memory _roleData = RoleData(
            _grantRoleData.role,
            _grantRoleData.grantee,
            _grantRoleData.expirationDate,
            _grantRoleData.revocable,
            _grantRoleData.data
        );
        _grantOrUpdateRole(_grantRoleData.nonce, _depositInfo, _roleData);
    }

    function _grantOrUpdateRole(uint256 _depositId, DepositInfo memory _depositInfo, RoleData memory _roleData) internal {
        // validate if previous role assignment is expired or revocable
        RoleData memory _previousRoleData = s.itemsRoleAssignments[_depositId];
        require(
            _previousRoleData.expirationDate < block.timestamp || _previousRoleData.revocable,
            "ItemsRolesRegistryFacet: nonce is not expired or is not revocable"
        );

        s.itemsRoleAssignments[_depositId] = _roleData;

        emit RoleGranted(
            _depositId,
            EQUIP_WEARABLE_ROLE,
            _depositInfo.tokenAddress,
            _depositInfo.tokenId,
            _depositInfo.tokenAmount,
            _depositInfo.grantor,
            _roleData.grantee,
            _roleData.expirationDate,
            _roleData.revocable,
            _roleData.data
        );
    }

    function _deposit(uint256 _depositId, DepositInfo memory _depositInfo) internal {
        require(_depositInfo.tokenAmount > 0, "ItemsRolesRegistryFacet: tokenAmount must be greater than zero");
        require(s.itemsDeposits[_depositId].grantor == address(0), "ItemsRolesRegistryFacet: deposit already exists");

        s.itemsDeposits[_depositId] = _depositInfo;

        emit Deposited(_depositId, _depositInfo.tokenAddress, _depositInfo.tokenId, _depositInfo.tokenAmount, _depositInfo.grantor);

        _transferFrom(_depositInfo.grantor, address(this), _depositInfo.tokenAddress, _depositInfo.tokenId, _depositInfo.tokenAmount);
    }

    function revokeRoleFrom(uint256 _depositId, bytes32 _role) external override {
        // revoke(depositId, role1)
        RoleData memory _roleData = s.itemsRoleAssignments[_depositId];
        require(_roleData.grantee != address(0), "ItemsRolesRegistryFacet: invalid grantee");
        DepositInfo memory _depositInfo = s.itemsDeposits[_depositId];

        address caller = _findCaller(_roleData, _depositInfo);
        if (_roleData.expirationDate > block.timestamp && !_roleData.revocable) {
            // if role is not expired and is not revocable, only the grantee can revoke it
            require(caller == _roleData.grantee, "ItemsRolesRegistryFacet: nonce is not expired or is not revocable");
        }

        if (s.depositIdToItemIdToGotchiId[_depositId][_depositInfo.tokenId] != 0) {
            uint256 _gotchiId = s.depositIdToItemIdToGotchiId[_depositId][_depositInfo.tokenId];

            _unequipWearable(_gotchiId, _depositInfo.tokenId);

            delete s.depositIdToItemIdToGotchiId[_depositId][_depositInfo.tokenId];
            delete s.gotchiIdToItemIdToDepositId[_gotchiId][_depositInfo.tokenId];
        }

        delete s.itemsRoleAssignments[_depositId];

        emit RoleRevoked(
            _depositId,
            _roleData.role,
            _depositInfo.tokenAddress,
            _depositInfo.tokenId,
            _depositInfo.tokenAmount,
            _depositInfo.grantor,
            _roleData.grantee
        );
    }

    function _unequipWearable(uint256 _gotchiId, uint256 _wearableToUnequip) internal {
        for (uint256 slot; slot < EQUIPPED_WEARABLE_SLOTS; slot++) {
            if(s.aavegotchis[_gotchiId].equippedWearables[slot] != _wearableToUnequip) continue;
            s.aavegotchis[_gotchiId].equippedWearables[slot] = 0;
        }

        LibItems.removeFromParent(address(this), _gotchiId, _wearableToUnequip, 1);
        emit LibERC1155.TransferFromParent(address(this), _gotchiId, _wearableToUnequip, 1);
    }

    function withdraw(
        uint256 _depositId
    )
        public
        onlyOwnerOrApprovedWithBalance(
            s.itemsDeposits[_depositId].grantor,
            s.itemsDeposits[_depositId].tokenAddress,
            s.itemsDeposits[_depositId].tokenId,
            s.itemsDeposits[_depositId].tokenAmount
        )
    {
        DepositInfo memory _depositInfo = s.itemsDeposits[_depositId];
        require(_depositInfo.tokenAmount > 0, "ItemsRolesRegistryFacet: deposit does not exist");
        require(
            s.itemsRoleAssignments[_depositId].grantee == address(0) ||
                s.itemsRoleAssignments[_depositId].expirationDate < block.timestamp ||
                s.itemsRoleAssignments[_depositId].revocable,
            "ItemsRolesRegistryFacet: nft is delegated"
        );

        delete s.itemsDeposits[_depositId];

        _transferFrom(address(this), _depositInfo.grantor, _depositInfo.tokenAddress, _depositInfo.tokenId, _depositInfo.tokenAmount);

        emit Withdrew(_depositId, _depositInfo.grantor, _depositInfo.tokenId, _depositInfo.tokenAddress, _depositInfo.tokenAmount);
    }

    function setRoleApprovalForAll(address _tokenAddress, address _operator, bool _isApproved) external override {
        s.itemsTokenApprovals[msg.sender][_tokenAddress][_operator] = _isApproved;
        emit RoleApprovalForAll(_tokenAddress, _operator, _isApproved);
    }

    /** View Functions **/

    function roleData(uint256 _depositId, bytes32 _role) external view override returns (RoleData memory) {
        return s.itemsRoleAssignments[_depositId];
    }

    function roleExpirationDate(uint256 _depositId, bytes32 _role) external view override returns (uint64 expirationDate_) {
        return s.itemsRoleAssignments[_depositId].expirationDate;
    }

    function isRoleApprovedForAll(address _tokenAddress, address _grantor, address _operator) public view override returns (bool) {
        return s.itemsTokenApprovals[_grantor][_tokenAddress][_operator];
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC1155Receiver, IERC165) returns (bool) {
        return interfaceId == type(ISftRolesRegistry).interfaceId || interfaceId == type(IERC1155Receiver).interfaceId;
    }

    /** Helper Functions **/

    function _transferFrom(address _from, address _to, address _tokenAddress, uint256 _tokenId, uint256 _tokenAmount) internal {
        LibItems.removeFromOwner(_from, _tokenId, _tokenAmount);
        LibItems.addToOwner(_to, _tokenId, _tokenAmount);
        IEventHandlerFacet(_tokenAddress).emitTransferSingleEvent(LibMeta.msgSender(), _from, _to, _tokenId, _tokenAmount);
        LibERC1155Marketplace.updateERC1155Listing(address(this), _tokenId, _to);
    }

    function _findCaller(RoleData memory _roleData, DepositInfo memory _depositInfo) internal view returns (address) {
        if (_depositInfo.grantor == msg.sender || isRoleApprovedForAll(_depositInfo.tokenAddress, _depositInfo.grantor, msg.sender)) {
            return _depositInfo.grantor;
        }

        if (_roleData.grantee == msg.sender || isRoleApprovedForAll(_depositInfo.tokenAddress, _roleData.grantee, msg.sender)) {
            return _roleData.grantee;
        }

        revert("ItemsRolesRegistryFacet: sender must be approved");
    }
}
