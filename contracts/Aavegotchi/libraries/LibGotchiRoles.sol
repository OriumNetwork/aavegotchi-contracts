// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import {LibAppStorage, AppStorage} from "./LibAppStorage.sol";
import {IERC7432} from "../../shared/interfaces/IERC7432.sol";

library LibGotchiRoles {
    function isAavegotchiLent(uint32 _gotchiId) internal view returns (bool) {
        AppStorage storage s = LibAppStorage.diamondStorage();
        address _lastGrantee = IERC7432(s.rolesRegistry).lastGrantee(
            keccak256("GOTCHIVERSE_PLAYER"),
            address(this),
            _gotchiId,
            s.aavegotchis[_gotchiId].owner
        );

        return
            IERC7432(s.rolesRegistry).hasRole(
                keccak256("GOTCHIVERSE_PLAYER"),
                address(this),
                _gotchiId,
                s.aavegotchis[_gotchiId].owner,
                _lastGrantee
            );
    }
}
