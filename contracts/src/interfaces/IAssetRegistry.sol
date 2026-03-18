// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

interface IAssetRegistry {
    enum VerificationStatus {
        PENDING,
        VERIFIED,
        EXPIRED,
        REVOKED,
        FAILED
    }

    enum ResalePolicy {
        EXCLUSIVE,
        LIMITED_RESALE,
        OPEN_RESALE
    }

    struct Asset {
        address seller;
        string proofTypeId;
        string encryptedRef;
        bytes32 dataHash;
        VerificationStatus verificationStatus;
        ResalePolicy resalePolicy;
        uint256 basePrice;
        uint256 verifiedAt;
        uint256 expiresAt;
        bool isListed;
    }

    function authorizePool(address pool) external;
    function assetExists(bytes32 assetId) external view returns (bool);
    function getAsset(bytes32 assetId) external view returns (Asset memory);
    function hasAccess(bytes32 assetId, address buyer) external view returns (bool);
    function registerOrUpdateVerifiedAsset(
        bytes32 assetId,
        address seller,
        string calldata proofTypeId,
        string calldata encryptedRef,
        bytes32 dataHash,
        VerificationStatus verificationStatus,
        ResalePolicy resalePolicy,
        uint256 basePrice,
        uint256 expiresAt,
        bool isListed
    ) external;
    function grantAccess(bytes32 assetId, address buyer) external;
    function purchaseAsset(bytes32 assetId) external payable;
}
