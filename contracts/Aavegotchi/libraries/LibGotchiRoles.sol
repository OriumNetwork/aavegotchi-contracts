// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import {LibAppStorage, AppStorage} from "./LibAppStorage.sol";
import {IERC7432, RoleData} from "../../shared/interfaces/IERC7432.sol";

library LibGotchiRoles {
    bytes32 public constant GOTCHIVERSE_PLAYER = keccak256("GOTCHIVERSE_PLAYER");

    struct ProfitSplit {
        uint256 lender;
        uint256 borrower;
        uint256 thirdParty;
    }

    function isAavegotchiLent(uint32 _gotchiId) internal view returns (bool) {
        AppStorage storage s = LibAppStorage.diamondStorage();
        address _lastGrantee = IERC7432(s.rolesRegistry).lastGrantee(GOTCHIVERSE_PLAYER, address(this), _gotchiId, s.aavegotchis[_gotchiId].owner);

        return hasGotchiversePlayerRole(_gotchiId, _lastGrantee);
    }

    function hasGotchiversePlayerRole(uint32 _gotchiId, address _player) public view returns (bool) {
        AppStorage storage s = LibAppStorage.diamondStorage();
        return IERC7432(s.rolesRegistry).hasRole(GOTCHIVERSE_PLAYER, address(this), _gotchiId, s.aavegotchis[_gotchiId].owner, _player);
    }

    function rentalHasChannelingPermission(uint32 _gotchiId) public returns (bool) {
        AppStorage storage s = LibAppStorage.diamondStorage();
        address _lastGrantee = IERC7432(s.rolesRegistry).lastGrantee(GOTCHIVERSE_PLAYER, address(this), _gotchiId, s.aavegotchis[_gotchiId].owner);

        RoleData memory _roleData = IERC7432(s.rolesRegistry).roleData(
            GOTCHIVERSE_PLAYER,
            address(this),
            _gotchiId,
            s.aavegotchis[_gotchiId].owner,
            _lastGrantee
        );

        // Checking if the roleData is valid
        (bool success, ) = address(this).call(abi.encodeWithSignature("decodeData(bytes)", _roleData.data));

        if (!success) {
            (bool canChannelAlchemica, , ) = decodeData(_roleData.data);
            return canChannelAlchemica;
        } else {
            // If the roleData is invalid, we assume that false is the default
            return false;
        }
    }

    function decodeData(bytes memory _data) public pure returns (bool, ProfitSplit memory, address) {
        return abi.decode(_data, (bool, ProfitSplit, address));
    }
}
