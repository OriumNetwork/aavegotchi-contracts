// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import {LibMeta} from "../../shared/libraries/LibMeta.sol";
import {Modifiers} from "../libraries/LibAppStorage.sol";

contract RoleApprovalFacet is Modifiers {
    event RoleApprovalForAll(address indexed tokenAddress, address indexed operator, bool indexed isApproved);

    function setRoleApprovalForAll(address _tokenAddress, address _operator, bool _approved) external {
        s.itemsRoleApprovals[LibMeta.msgSender()][_tokenAddress][_operator] = _approved;
        emit RoleApprovalForAll(_tokenAddress, _operator, _approved);
    }
}
