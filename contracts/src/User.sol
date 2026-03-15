// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {FactoryAccessFiPool as Factory} from "./factories/FactoryAccessFiPool.sol";
import {IAccessfiPool} from "./interfaces/IAccessfiPool.sol";
import {IAssetRegistry} from "./interfaces/IAssetRegistry.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title User
 * @notice User account contract for interacting with AccessFi pools and inventory
 */
contract User is ReentrancyGuard {
    address public immutable owner;
    address public immutable poolFactory;
    address public immutable assetRegistry;

    address[] private createdPools;
    address[] private joinedPools;
    bytes32[] private purchasedAssets;
    bytes32[] private providedAssets;

    uint256 public totalSpent;
    uint256 public totalEarned;

    Factory public factory;

    mapping(address => bool) private _hasJoinedPool;
    mapping(address => bool) private _hasCreatedPool;
    mapping(bytes32 => bool) private _hasPurchasedAsset;
    mapping(bytes32 => bool) private _hasProvidedAsset;

    error AlreadyJoinedPool();
    error AlreadyCreatedPool();
    error InvalidPoolAddress();
    error OnlyOwner();
    error NoFunds();
    error TransferFailed();
    error OnlyAssetRegistry();
    error OnlyAssetRegistryOrPool();

    event PoolCreated(address indexed poolAddress);
    event PoolJoined(address indexed poolAddress);
    event AssetPurchased(bytes32 indexed assetId);
    event AssetProvided(bytes32 indexed assetId);

    constructor(address _owner, address _poolFactory, address _assetRegistry) {
        owner = _owner;
        poolFactory = _poolFactory;
        assetRegistry = _assetRegistry;
        factory = Factory(poolFactory);
    }

    function createPool(IAccessfiPool.PoolInfo memory _poolInfo) external payable nonReentrant {
        if (msg.sender != owner) revert OnlyOwner();

        address poolAddress = factory.createAccessFiPool{value: msg.value}(_poolInfo);
        if (_hasCreatedPool[poolAddress]) revert AlreadyCreatedPool();

        createdPools.push(poolAddress);
        _hasCreatedPool[poolAddress] = true;
        totalSpent += msg.value;

        emit PoolCreated(poolAddress);
    }

    function fundPool(address _poolAddress) external payable nonReentrant {
        if (msg.sender != owner) revert OnlyOwner();
        if (_poolAddress == address(0)) revert InvalidPoolAddress();
        require(msg.value > 0, "Cannot fund with zero");

        (bool success, ) = payable(_poolAddress).call{value: msg.value}("");
        require(success, "Pool funding failed");

        totalSpent += msg.value;
    }

    function stopPool(address _poolAddress) external nonReentrant {
        if (msg.sender != owner) revert OnlyOwner();
        if (_poolAddress == address(0)) revert InvalidPoolAddress();

        IAccessfiPool(_poolAddress).stopPool();
    }

    function joinPool(address _poolAddress) external nonReentrant {
        if (msg.sender != owner) revert OnlyOwner();
        if (_poolAddress == address(0)) revert InvalidPoolAddress();
        if (_hasJoinedPool[_poolAddress]) revert AlreadyJoinedPool();

        IAccessfiPool(_poolAddress).joinPoolAsSeller();

        joinedPools.push(_poolAddress);
        _hasJoinedPool[_poolAddress] = true;

        emit PoolJoined(_poolAddress);
    }

    function submitProofAsSeller(
        address _poolAddress,
        IAccessfiPool.ProofType _proofType,
        bytes32 _proofHash,
        string calldata encryptedCID,
        bytes32 dataHash,
        IAccessfiPool.VerificationParams calldata zkParams,
        IAccessfiPool.ResalePolicy resalePolicy
    ) external nonReentrant {
        if (msg.sender != owner) revert OnlyOwner();
        IAccessfiPool(_poolAddress).submitProofAsSeller(
            _proofType,
            _proofHash,
            encryptedCID,
            dataHash,
            zkParams,
            resalePolicy
        );
    }

    function buyAsset(bytes32 assetId) external payable nonReentrant {
        if (msg.sender != owner) revert OnlyOwner();

        IAssetRegistry(assetRegistry).purchaseAsset{value: msg.value}(assetId);
        totalSpent += msg.value;
    }

    function notifyAssetPurchased(bytes32 assetId) external {
        if (msg.sender != assetRegistry) revert OnlyAssetRegistry();
        if (_hasPurchasedAsset[assetId]) return;

        purchasedAssets.push(assetId);
        _hasPurchasedAsset[assetId] = true;
        emit AssetPurchased(assetId);
    }

    function notifyProvidedAsset(bytes32 assetId) external {
        if (msg.sender != assetRegistry) revert OnlyAssetRegistry();
        if (_hasProvidedAsset[assetId]) return;

        providedAssets.push(assetId);
        _hasProvidedAsset[assetId] = true;
        emit AssetProvided(assetId);
    }

    function notifyEarning(uint256 amount) external {
        if (msg.sender != assetRegistry && !_isValidPool(msg.sender)) {
            revert OnlyAssetRegistryOrPool();
        }

        totalEarned += amount;
    }

    function getCreatedPools() external view returns (address[] memory) {
        return createdPools;
    }

    function getJoinedPools() external view returns (address[] memory) {
        return joinedPools;
    }

    function getPurchasedAssets() external view returns (bytes32[] memory) {
        return purchasedAssets;
    }

    function getProvidedAssets() external view returns (bytes32[] memory) {
        return providedAssets;
    }

    function getCreatedPoolsCount() external view returns (uint256) {
        return createdPools.length;
    }

    function getJoinedPoolsCount() external view returns (uint256) {
        return joinedPools.length;
    }

    function getPurchasedAssetsCount() external view returns (uint256) {
        return purchasedAssets.length;
    }

    function getProvidedAssetsCount() external view returns (uint256) {
        return providedAssets.length;
    }

    function getTotalSpent() external view returns (uint256) {
        return totalSpent;
    }

    function getTotalEarned() external view returns (uint256) {
        return totalEarned;
    }

    function withdrawFunds() external nonReentrant {
        if (msg.sender != owner) revert OnlyOwner();

        uint256 balance = address(this).balance;
        if (balance == 0) revert NoFunds();

        (bool success, ) = payable(owner).call{value: balance}("");
        if (!success) revert TransferFailed();
    }

    function _isValidPool(address caller) internal view returns (bool) {
        address[] memory allPools = factory.getAccessFiPools();
        for (uint256 i = 0; i < allPools.length;) {
            if (allPools[i] == caller) {
                return true;
            }
            unchecked { ++i; }
        }
        return false;
    }

    receive() external payable {}
}
