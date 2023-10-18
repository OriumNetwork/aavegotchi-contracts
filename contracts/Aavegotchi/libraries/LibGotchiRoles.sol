// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import {LibAppStorage, AppStorage} from "./LibAppStorage.sol";
import {IERC7432} from "../../shared/interfaces/IERC7432.sol";

library LibGotchiRoles {
    bytes32 public constant GOTCHIVERSE_PLAYER = keccak256("GOTCHIVERSE_PLAYER");
    bytes32 public constant CHANNELING_ROLE = keccak256("CHANNELING_ROLE");

    function isAavegotchiLent(uint32 _gotchiId) internal view returns (bool) {
        AppStorage storage s = LibAppStorage.diamondStorage();
        address _lastGrantee = IERC7432(s.rolesRegistry).lastGrantee(GOTCHIVERSE_PLAYER, address(this), _gotchiId, s.aavegotchis[_gotchiId].owner);

        return hasGotchiversePlayerRole(_gotchiId, _lastGrantee);
    }

    function hasGotchiversePlayerRole(uint32 _gotchiId, address _player) public view returns (bool) {
        AppStorage storage s = LibAppStorage.diamondStorage();
        return IERC7432(s.rolesRegistry).hasRole(GOTCHIVERSE_PLAYER, address(this), _gotchiId, address(0), _player);
    }

    function rentalHasChannelingPermission(uint32 _gotchiId) public view returns (bool) {
        address _lastGrantee = IERC7432(LibAppStorage.diamondStorage().rolesRegistry).lastGrantee(
            GOTCHIVERSE_PLAYER,
            address(this),
            _gotchiId,
            LibAppStorage.diamondStorage().aavegotchis[_gotchiId].owner
        );

        return hasChannelingRole(_gotchiId, _lastGrantee);
    }

    function hasChannelingRole(uint32 _gotchiId, address _player) public view returns (bool) {
        AppStorage storage s = LibAppStorage.diamondStorage();
        return IERC7432(s.rolesRegistry).hasRole(CHANNELING_ROLE, address(this), _gotchiId, address(0), _player);
    }
}
