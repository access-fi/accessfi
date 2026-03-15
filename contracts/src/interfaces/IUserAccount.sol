// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

interface IUserAccount {
    function owner() external view returns (address);
    function notifyEarning(uint256 amount) external;
    function notifyAssetPurchased(bytes32 assetId) external;
    function notifyProvidedAsset(bytes32 assetId) external;
}
