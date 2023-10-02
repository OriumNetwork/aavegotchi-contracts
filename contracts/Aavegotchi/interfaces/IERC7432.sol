// SPDX-License-Identifier: CC0-1.0

pragma solidity 0.8.1;

/// @title ERC-7432 Non-Fungible Token Roles
/// @dev See https://eips.ethereum.org/EIPS/eip-7432
/// Note: the ERC-165 identifier for this interface is 0x25be10b2.
interface IERC7432 {
    struct RoleData {
        uint64 expirationDate;
        bool revocable;
        bytes data;
    }

    struct GrantedRole {
        bytes32 role;
        address tokenAddress;
        uint256 tokenId;
        uint256 value;
        address grantor;
        address grantee;
        uint64 expirationDate;
        bool revocable;
        bytes data;
    }

    /** Events **/

    /// @notice Emitted when a role is granted.
    /// @param _role The role identifier.
    /// @param _tokenAddress The token address.
    /// @param _tokenId The token identifier.
    /// @param _grantor The user assigning the role.
    /// @param _grantee The user receiving the role.
    /// @param _expirationDate The expiration date of the role.
    /// @param _revocable Whether the role is revocable or not.
    /// @param _data Any additional data about the role.
    event RoleGranted(
        bytes32 indexed _role,
        address indexed _tokenAddress,
        uint256 indexed _tokenId,
        address _grantor,
        address _grantee,
        uint64 _expirationDate,
        bool _revocable,
        bytes _data
    );

    /// @notice Emitted when a role is revoked.
    /// @param _role The role identifier.
    /// @param _tokenAddress The token address.
    /// @param _tokenId The token identifier.
    /// @param _revoker The user revoking the role.
    /// @param _grantee The user that receives the role revocation.
    event RoleRevoked(
        bytes32 indexed _role,
        address indexed _tokenAddress,
        uint256 indexed _tokenId,
        address _revoker,
        address _grantee
    );

    /// @notice Emitted when a user is approved to manage any role on behalf of another user.
    /// @param _tokenAddress The token address.
    /// @param _operator The user approved to grant and revoke roles.
    /// @param _isApproved The approval status.
    event RoleApprovalForAll(
        address indexed _tokenAddress,
        address indexed _operator,
        bool _isApproved
    );

    /** External Functions **/

    /// @notice Grants a role on behalf of a user.
    /// @param _role The role identifier.
    /// @param _tokenAddress The token address.
    /// @param _tokenId The token identifier.
    /// @param _value The value of the token.
    /// @param _grantor The user assigning the role.
    /// @param _grantee The user that receives the role.
    /// @param _expirationDate The expiration date of the role.
    /// @param _revocable Whether the role is revocable or not.
    /// @param _data Any additional data about the role.
    /// @return roleId_ The identifier of the granted role.
    function grantRoleFrom(
        bytes32 _role,
        address _tokenAddress,
        uint256 _tokenId,
        uint256 _value,
        address _grantor,
        address _grantee,
        uint64 _expirationDate,
        bool _revocable,
        bytes calldata _data
    ) external returns (uint256 roleId_);

    /// @notice Revokes a role on behalf of a user.
    /// @param _roleId The identifier of the granted role.
    function revokeRoleFrom(
        uint256 _roleId
    ) external;

    /// @notice Approves operator to grant and revoke any roles on behalf of another user.
    /// @param _tokenAddress The token address.
    /// @param _operator The user approved to grant and revoke roles.
    /// @param _approved The approval status.
    function setRoleApprovalForAll(
        address _tokenAddress,
        address _operator,
        bool _approved
    ) external;

    /** View Functions **/

    /// @notice Checks if a user has a role.
    /// @param _role The role identifier.
    /// @param _tokenAddress The token address.
    /// @param _tokenId The token identifier.
    /// @param _grantor The user that assigned the role.
    /// @param _grantee The user that received the role.
    function hasRole(
        bytes32 _role,
        address _tokenAddress,
        uint256 _tokenId,
        address _grantor,
        address _grantee
    ) external view returns (bool);

    // todo does hasRole need grantor?

//    function roleBalanceOf(
//        bytes32 _role,
//        address _tokenAddress,
//        uint256 _tokenId,
//        address _grantor,
//        address _grantee
//    ) external view returns (uint256 balance_);

    /// @notice Checks if a user has a unique role.
    /// @param _role The role identifier.
    /// @param _tokenAddress The token address.
    /// @param _tokenId The token identifier.
    /// @param _grantor The user that assigned the role.
    /// @param _grantee The user that received the role.
    function hasUniqueRole(
        bytes32 _role,
        address _tokenAddress,
        uint256 _tokenId,
        address _grantor,
        address _grantee
    ) external view returns (bool);

    /// @notice Returns the custom data of a role assignment.
    /// @param _role The role identifier.
    /// @param _tokenAddress The token address.
    /// @param _tokenId The token identifier.
    /// @param _grantor The user that assigned the role.
    /// @param _grantee The user that received the role.
    function roleData(
        bytes32 _role,
        address _tokenAddress,
        uint256 _tokenId,
        address _grantor,
        address _grantee
    ) external view returns (bytes memory data_);

    /// @notice Returns the expiration date of a role assignment.
    /// @param _role The role identifier.
    /// @param _tokenAddress The token address.
    /// @param _tokenId The token identifier.
    /// @param _grantor The user that assigned the role.
    /// @param _grantee The user that received the role.
    function roleExpirationDate(
        bytes32 _role,
        address _tokenAddress,
        uint256 _tokenId,
        address _grantor,
        address _grantee
    ) external view returns (uint64 expirationDate_);

    /// @notice Checks if the grantor approved the operator for all NFTs.
    /// @param _tokenAddress The token address.
    /// @param _grantor The user that approved the operator.
    /// @param _operator The user that can grant and revoke roles.
    function isRoleApprovedForAll(
        address _tokenAddress,
        address _grantor,
        address _operator
    ) external view returns (bool);

}



