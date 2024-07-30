// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ProfitShare {
    event RoleGranted(bytes profitShare);
    
    uint256 constant MAX_SHARES_LENGTH = 100; 

    function grantRole(bytes calldata profitShare) external {
        uint256[] memory profitShares = _safeDecodeProfitShare(profitShare);

        require(_validateProfitShare(profitShares), "Invalid profit share distribution");

        emit RoleGranted(profitShare);
    }

    function _safeDecodeProfitShare(bytes calldata data) internal pure returns (uint256[] memory) {
        require(data.length % 32 == 0, "Invalid bytes length");

        uint256[] memory decoded = abi.decode(data, (uint256[]));
        require(decoded.length <= MAX_SHARES_LENGTH, "Array too large");
        return decoded;
    }

    function _validateProfitShare(uint256[] memory shares) internal pure returns (bool) {
        uint256 total = 0;
        unchecked {
            for (uint256 i = 0; i < shares.length; i++) {
                total += shares[i];
            }
        }
        return total == 100;
    }
}
