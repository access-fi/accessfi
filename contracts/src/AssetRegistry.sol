// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import {FactoryUser} from "./factories/FactoryUser.sol";
import {IUserAccount} from "./interfaces/IUserAccount.sol";
import {IAssetRegistry} from "./interfaces/IAssetRegistry.sol";

contract AssetRegistry is AccessControl, ReentrancyGuard, IAssetRegistry {
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    uint256 public platformFeePercent = 5;
    address public platformWallet;
    address public factoryUser;
    address public poolFactory;

    mapping(bytes32 => Asset) private assets;
    mapping(bytes32 => mapping(address => bool)) public hasAccess;
    mapping(bytes32 => PurchaseRecord[]) private purchaseHistory;
    mapping(address => bytes32[]) private sellerAssets;
    mapping(address => bytes32[]) private buyerAssets;
    mapping(address => mapping(bytes32 => bool)) private sellerHasAsset;
    mapping(address => mapping(bytes32 => bool)) private buyerHasAsset;
    mapping(address => bool) public authorizedPools;

    struct PurchaseRecord {
        address buyer;
        uint256 amount;
        uint256 platformFee;
        uint256 sellerPayout;
        uint256 purchasedAt;
    }

    event AssetRegistered(bytes32 indexed assetId, address indexed seller, string proofTypeId);
    event AssetAccessGranted(bytes32 indexed assetId, address indexed buyer);
    event AssetPurchased(bytes32 indexed assetId, address indexed buyer, uint256 amount);
    event AssetListingUpdated(bytes32 indexed assetId, bool isListed);
    event PoolAuthorized(address indexed pool);
    event PoolRevoked(address indexed pool);
    event FactoryUserUpdated(address indexed factoryUser);
    event PoolFactoryUpdated(address indexed poolFactory);

    error AssetNotFound();
    error AssetNotListed();
    error AccessAlreadyGranted();
    error InvalidAmount();
    error InvalidPlatformWallet();
    error PaymentFailed();
    error UnauthorizedListingManager();
    error OnlyAuthorizedBuyerPath();
    error InvalidFactoryUser();
    error InvalidPoolFactory();
    error PoolNotAuthorized();
    error InvalidListingForExclusive();

    constructor(address admin, address _platformWallet) {
        if (_platformWallet == address(0)) revert InvalidPlatformWallet();
        platformWallet = _platformWallet;
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(OPERATOR_ROLE, admin);
    }

    function setFactoryUser(address _factoryUser) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_factoryUser == address(0)) revert InvalidFactoryUser();
        factoryUser = _factoryUser;
        emit FactoryUserUpdated(_factoryUser);
    }

    function setPoolFactory(address _poolFactory) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_poolFactory == address(0)) revert InvalidPoolFactory();
        poolFactory = _poolFactory;
        emit PoolFactoryUpdated(_poolFactory);
    }

    function authorizePool(address pool) external {
        if (msg.sender != poolFactory && !hasRole(DEFAULT_ADMIN_ROLE, msg.sender)) {
            revert PoolNotAuthorized();
        }
        authorizedPools[pool] = true;
        emit PoolAuthorized(pool);
    }

    function revokePool(address pool) external onlyRole(DEFAULT_ADMIN_ROLE) {
        authorizedPools[pool] = false;
        emit PoolRevoked(pool);
    }

    function assetExists(bytes32 assetId) external view returns (bool) {
        return assets[assetId].seller != address(0);
    }

    function getAsset(bytes32 assetId) external view returns (Asset memory) {
        if (assets[assetId].seller == address(0)) revert AssetNotFound();
        return assets[assetId];
    }

    function getSellerAssets(address seller) external view returns (bytes32[] memory) {
        return sellerAssets[seller];
    }

    function getBuyerAssets(address buyer) external view returns (bytes32[] memory) {
        return buyerAssets[buyer];
    }

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
    ) external onlyTrustedPoolOrOperator {
        bool canList = resalePolicy != ResalePolicy.EXCLUSIVE && isListed;

        assets[assetId] = Asset({
            seller: seller,
            proofTypeId: proofTypeId,
            encryptedRef: encryptedRef,
            dataHash: dataHash,
            verificationStatus: verificationStatus,
            resalePolicy: resalePolicy,
            basePrice: basePrice,
            verifiedAt: block.timestamp,
            expiresAt: expiresAt,
            isListed: canList
        });

        if (!sellerHasAsset[seller][assetId]) {
            sellerAssets[seller].push(assetId);
            sellerHasAsset[seller][assetId] = true;
        }

        _notifyProvidedAsset(seller, assetId);
        emit AssetRegistered(assetId, seller, proofTypeId);
        emit AssetListingUpdated(assetId, canList);
    }

    function setAssetListing(bytes32 assetId, bool isListed) external {
        Asset storage asset = assets[assetId];
        if (asset.seller == address(0)) revert AssetNotFound();
        if (asset.resalePolicy == ResalePolicy.EXCLUSIVE && isListed) revert InvalidListingForExclusive();
        if (msg.sender != asset.seller && !hasRole(DEFAULT_ADMIN_ROLE, msg.sender)) {
            revert UnauthorizedListingManager();
        }

        asset.isListed = isListed;
        emit AssetListingUpdated(assetId, isListed);
    }

    function grantAccess(bytes32 assetId, address buyer) external onlyTrustedPoolOrOperator {
        _grantAccess(assetId, buyer);
    }

    function purchaseAsset(bytes32 assetId) external payable nonReentrant {
        Asset memory asset = assets[assetId];
        if (asset.seller == address(0)) revert AssetNotFound();
        if (!asset.isListed) revert AssetNotListed();
        if (asset.expiresAt != 0 && block.timestamp > asset.expiresAt) revert AssetNotListed();
        if (msg.value != asset.basePrice) revert InvalidAmount();

        address buyer = _resolveBuyer(msg.sender);
        if (hasAccess[assetId][buyer]) revert AccessAlreadyGranted();

        uint256 platformFee = (msg.value * platformFeePercent) / 100;
        uint256 sellerPayout = msg.value - platformFee;

        _grantAccess(assetId, buyer);
        purchaseHistory[assetId].push(PurchaseRecord({
            buyer: buyer,
            amount: msg.value,
            platformFee: platformFee,
            sellerPayout: sellerPayout,
            purchasedAt: block.timestamp
        }));

        (bool feePaid, ) = payable(platformWallet).call{value: platformFee}("");
        if (!feePaid) revert PaymentFailed();

        (bool sellerPaid, ) = payable(asset.seller).call{value: sellerPayout}("");
        if (!sellerPaid) revert PaymentFailed();

        _notifyEarning(asset.seller, sellerPayout);
        emit AssetPurchased(assetId, buyer, msg.value);
    }

    function getPurchaseCount(bytes32 assetId) external view returns (uint256) {
        return purchaseHistory[assetId].length;
    }

    function getPurchaseRecord(bytes32 assetId, uint256 index) external view returns (PurchaseRecord memory) {
        return purchaseHistory[assetId][index];
    }

    function _grantAccess(bytes32 assetId, address buyer) internal {
        if (assets[assetId].seller == address(0)) revert AssetNotFound();
        if (hasAccess[assetId][buyer]) revert AccessAlreadyGranted();

        hasAccess[assetId][buyer] = true;
        if (!buyerHasAsset[buyer][assetId]) {
            buyerAssets[buyer].push(assetId);
            buyerHasAsset[buyer][assetId] = true;
        }

        _notifyAssetPurchased(buyer, assetId);
        emit AssetAccessGranted(assetId, buyer);
    }

    function _resolveBuyer(address caller) internal view returns (address buyer) {
        if (factoryUser == address(0)) revert InvalidFactoryUser();

        try IUserAccount(caller).owner() returns (address resolvedOwner) {
            buyer = resolvedOwner;
        } catch {
            revert OnlyAuthorizedBuyerPath();
        }

        if (FactoryUser(factoryUser).getUser(buyer) != caller) {
            revert OnlyAuthorizedBuyerPath();
        }
    }

    function _notifyProvidedAsset(address seller, bytes32 assetId) internal {
        if (factoryUser == address(0)) return;
        address sellerUser = FactoryUser(factoryUser).getUser(seller);
        if (sellerUser != address(0)) {
            try IUserAccount(sellerUser).notifyProvidedAsset(assetId) {} catch {}
        }
    }

    function _notifyAssetPurchased(address buyer, bytes32 assetId) internal {
        if (factoryUser == address(0)) return;
        address buyerUser = FactoryUser(factoryUser).getUser(buyer);
        if (buyerUser != address(0)) {
            try IUserAccount(buyerUser).notifyAssetPurchased(assetId) {} catch {}
        }
    }

    function _notifyEarning(address seller, uint256 amount) internal {
        if (factoryUser == address(0)) return;
        address sellerUser = FactoryUser(factoryUser).getUser(seller);
        if (sellerUser != address(0)) {
            try IUserAccount(sellerUser).notifyEarning(amount) {} catch {}
        }
    }

    modifier onlyTrustedPoolOrOperator() {
        if (!authorizedPools[msg.sender] && !hasRole(OPERATOR_ROLE, msg.sender) && !hasRole(DEFAULT_ADMIN_ROLE, msg.sender)) {
            revert PoolNotAuthorized();
        }
        _;
    }
}
