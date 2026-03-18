// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {IAccessfiPool} from "./interfaces/IAccessfiPool.sol";
import {IAssetRegistry} from "./interfaces/IAssetRegistry.sol";
import {verifyProof} from "./VerifyProof.sol";
import {User} from "./User.sol";
import {FactoryUser} from "./factories/FactoryUser.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";

contract AccessFiPool is Initializable, IAccessfiPool, UUPSUpgradeable, AccessControlUpgradeable, ReentrancyGuardUpgradeable {
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    IAccessfiPool.PoolInfo public poolInfo;
    uint256 public totalDataCollected;

    address[] public joinedSellers;
    address[] public verifiedSellers;

    IAssetRegistry public assetRegistry;
    verifyProof public zkVerifier;
    address public factoryUser;
    address public factory;
    address public platformWallet;
    uint256 public platformFeePercent;

    mapping(address => bool) public isSellerJoined;
    mapping(address => bool) public isSellerVerified;
    mapping(address => mapping(bytes32 => bool)) public sellerProofs;
    mapping(address => bool) public isSellerFullyVerified;
    mapping(address => mapping(bytes32 => bytes32)) public sellerProofHashes;
    mapping(bytes32 => bool) public globalProofHashes;
    mapping(address => IAccessfiPool.VerifiedData) public verifiedSellerData;
    mapping(address => string[]) public buyerAccessibleCIDs;
    mapping(address => bytes32) public sellerToAssetId;
    mapping(bytes32 => bool) public requiredProofs;
    bool public isStopped;

    uint256[43] private __gap;

    error PoolNotActive();
    error PoolExpired();
    error NotCreator();
    error CreatorCannotBeSeller();
    error AlreadyJoined();
    error NotJoined();
    error AlreadyVerified();
    error InvalidProofType();
    error ProofAlreadySubmitted();
    error ProofReused();
    error ProofHashMismatch();
    error PaymentFailed();
    error WithdrawalFailed();
    error AlreadyStopped();
    error InvalidUserContract();
    error TooManyProofRequirements();
    error InvalidAssetId();
    error InvalidEncryptedCID();
    error InvalidDataHash();
    error BuyerAlreadyHasAccess();

    constructor() {
        _disableInitializers();
    }

    function initialize(
        IAccessfiPool.PoolInfo memory _poolInfo,
        address _assetRegistry,
        address _zkVerifier,
        address _factoryUser,
        address _platformWallet,
        uint256 _platformFeePercent,
        address admin
    ) public initializer {
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();
        __AccessControl_init();

        require(_poolInfo.remainingBudget == _poolInfo.totalBudget, "Budget mismatch");
        require(_factoryUser != address(0), "Invalid factory user");
        require(_platformWallet != address(0), "Invalid platform wallet");
        require(_assetRegistry != address(0), "Invalid asset registry");

        poolInfo = _poolInfo;
        assetRegistry = IAssetRegistry(_assetRegistry);
        zkVerifier = verifyProof(_zkVerifier);
        factoryUser = _factoryUser;
        factory = msg.sender;
        platformWallet = _platformWallet;
        platformFeePercent = _platformFeePercent;

        uint256 reqLength = _poolInfo.proofRequirements.length;
        if (reqLength > 10) revert TooManyProofRequirements();
        if (reqLength == 0) revert InvalidProofType();

        for (uint256 i = 0; i < reqLength;) {
            bytes32 proofTypeId = _poolInfo.proofRequirements[i];
            if (proofTypeId == bytes32(0)) revert InvalidProofType();
            requiredProofs[proofTypeId] = true;
            unchecked {
                ++i;
            }
        }

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(UPGRADER_ROLE, admin);

        emit PoolCreated(poolInfo.name, poolInfo.dataType, poolInfo.pricePerData, poolInfo.totalBudget);
    }

    modifier onlyCreator() {
        if (msg.sender != poolInfo.creator) revert NotCreator();
        _;
    }

    modifier notExpired() {
        if (block.timestamp > poolInfo.deadline) revert PoolExpired();
        _;
    }

    modifier poolActive() {
        if (!poolInfo.isActive || isStopped) revert PoolNotActive();
        _;
    }

    function joinPoolAsSeller() external poolActive notExpired {
        address eoa = _verifyUserContract(msg.sender);
        if (eoa == poolInfo.creator) revert CreatorCannotBeSeller();
        if (isSellerJoined[eoa]) revert AlreadyJoined();

        isSellerJoined[eoa] = true;
        joinedSellers.push(eoa);
        emit SellerJoined(eoa);
    }

    function submitProofAsSeller(
        bytes32 _proofTypeId,
        bytes32 _proofHash,
        string calldata encryptedCID,
        bytes32 dataHash,
        bytes32 assetId,
        IAccessfiPool.VerificationParams calldata zkParams,
        IAccessfiPool.ResalePolicy resalePolicy
    ) external poolActive notExpired nonReentrant {
        address seller = _verifyUserContract(msg.sender);

        if (!isSellerJoined[seller]) revert NotJoined();
        if (isSellerFullyVerified[seller]) revert AlreadyVerified();
        if (sellerProofs[seller][_proofTypeId]) revert ProofAlreadySubmitted();
        if (!_isValidProofType(_proofTypeId)) revert InvalidProofType();
        if (assetId == bytes32(0)) revert InvalidAssetId();
        if (bytes(encryptedCID).length == 0) revert InvalidEncryptedCID();
        if (dataHash == bytes32(0)) revert InvalidDataHash();

        zkVerifier.verify(
            zkParams.aggregationId,
            zkParams.domainId,
            zkParams.merklePath,
            zkParams.leaf,
            zkParams.leafCount,
            zkParams.index
        );

        if (_proofHash != zkParams.leaf) revert ProofHashMismatch();

        bytes32 uniqueProofHash = keccak256(
            abi.encode(seller, _proofTypeId, _proofHash, address(this))
        );
        if (globalProofHashes[uniqueProofHash]) revert ProofReused();

        sellerProofs[seller][_proofTypeId] = true;
        sellerProofHashes[seller][_proofTypeId] = uniqueProofHash;
        globalProofHashes[uniqueProofHash] = true;

        emit ProofSubmitted(seller, _proofTypeId, true);

        _checkFullVerificationAndSettle(
            seller,
            encryptedCID,
            dataHash,
            assetId,
            resalePolicy,
            _proofTypeId
        );
    }

    function stopPool() external nonReentrant {
        if (isStopped) revert AlreadyStopped();

        address eoa;
        try User(payable(msg.sender)).owner() returns (address _owner) {
            eoa = _owner;
        } catch {
            eoa = msg.sender;
        }

        if (eoa != poolInfo.creator) revert NotCreator();

        isStopped = true;
        poolInfo.isActive = false;

        uint256 remaining = poolInfo.remainingBudget;
        if (remaining > 0) {
            poolInfo.remainingBudget = 0;
            (bool success, ) = payable(poolInfo.creator).call{value: remaining}("");
            if (!success) revert WithdrawalFailed();
            emit PoolStopped(remaining);
        }
    }

    function getBudgetStatus() external view returns (uint256 remaining, uint256 spent, uint256 dataCollected, bool active) {
        return (
            poolInfo.remainingBudget,
            poolInfo.totalBudget - poolInfo.remainingBudget,
            totalDataCollected,
            poolInfo.isActive && !isStopped
        );
    }

    function getJoinedSellers() external view returns (address[] memory) {
        return joinedSellers;
    }

    function getVerifiedSellers() external view returns (address[] memory) {
        return verifiedSellers;
    }

    function getProofRequirements() external view returns (bytes32[] memory) {
        return poolInfo.proofRequirements;
    }

    function hasProof(address seller, bytes32 proofTypeId) external view returns (bool) {
        return sellerProofs[seller][proofTypeId];
    }

    function _verifyUserContract(address userContract) internal view returns (address eoa) {
        if (userContract == address(0)) revert InvalidUserContract();

        try User(payable(userContract)).owner() returns (address _owner) {
            eoa = _owner;
        } catch {
            revert InvalidUserContract();
        }

        if (eoa == address(0)) revert InvalidUserContract();
        if (FactoryUser(factoryUser).getUser(eoa) != userContract) {
            revert InvalidUserContract();
        }

        return eoa;
    }

    function _isValidProofType(bytes32 _proofTypeId) internal view returns (bool) {
        return requiredProofs[_proofTypeId];
    }

    function _checkFullVerificationAndSettle(
        address seller,
        string calldata encryptedCID,
        bytes32 dataHash,
        bytes32 assetId,
        IAccessfiPool.ResalePolicy resalePolicy,
        bytes32 proofTypeId
    ) internal {
        uint256 reqLength = poolInfo.proofRequirements.length;
        for (uint256 i = 0; i < reqLength;) {
            if (!sellerProofs[seller][poolInfo.proofRequirements[i]]) {
                return;
            }
            unchecked {
                ++i;
            }
        }

        if (isSellerFullyVerified[seller]) {
            return;
        }

        isSellerFullyVerified[seller] = true;
        isSellerVerified[seller] = true;
        verifiedSellers.push(seller);
        emit SellerFullyVerified(seller);

        _registerAssetAndSettle(
            seller,
            encryptedCID,
            dataHash,
            assetId,
            resalePolicy,
            proofTypeId
        );
    }

    function _registerAssetAndSettle(
        address seller,
        string calldata encryptedCID,
        bytes32 dataHash,
        bytes32 assetId,
        IAccessfiPool.ResalePolicy resalePolicy,
        bytes32 proofTypeId
    ) internal {
        uint256 remaining = poolInfo.remainingBudget;
        uint256 price = poolInfo.pricePerData;

        if (remaining < price) {
            poolInfo.isActive = false;
            emit PoolAutoStopped();
            return;
        }

        bool listed = resalePolicy != IAccessfiPool.ResalePolicy.EXCLUSIVE;

        poolInfo.remainingBudget = remaining - price;
        totalDataCollected += 1;
        sellerToAssetId[seller] = assetId;

        verifiedSellerData[seller] = IAccessfiPool.VerifiedData({
            encryptedCID: encryptedCID,
            encryptedDataHash: dataHash,
            isEncrypted: true,
            isAccessTransferred: true,
            timestamp: block.timestamp,
            assetId: assetId,
            resalePolicy: resalePolicy
        });

        buyerAccessibleCIDs[poolInfo.creator].push(encryptedCID);
        emit DataEncrypted(seller, encryptedCID);

        assetRegistry.registerOrUpdateVerifiedAsset(
            assetId,
            seller,
            _proofTypeIdToString(proofTypeId),
            encryptedCID,
            dataHash,
            IAssetRegistry.VerificationStatus.VERIFIED,
            _mapResalePolicy(resalePolicy),
            price,
            0,
            listed
        );
        if (assetRegistry.hasAccess(assetId, poolInfo.creator)) revert BuyerAlreadyHasAccess();
        assetRegistry.grantAccess(assetId, poolInfo.creator);

        emit AssetRegistered(seller, assetId, resalePolicy, listed);
        emit DataPurchased(poolInfo.creator, price, 1);
        emit AccessTransferred(poolInfo.creator, seller, encryptedCID);

        (bool paymentSuccess, ) = payable(seller).call{value: price}("");
        if (!paymentSuccess) revert PaymentFailed();
        emit SellerPaid(seller, price);

        address sellerUserContract = FactoryUser(factoryUser).getUser(seller);
        if (sellerUserContract != address(0)) {
            try User(payable(sellerUserContract)).notifyEarning(price) {} catch {}
        }
    }

    function _proofTypeIdToString(bytes32 proofTypeId) internal pure returns (string memory) {
        bytes memory alphabet = "0123456789abcdef";
        bytes memory str = new bytes(66);
        str[0] = "0";
        str[1] = "x";

        for (uint256 i = 0; i < 32; i++) {
            uint8 b = uint8(proofTypeId[i]);
            str[2 + (i * 2)] = alphabet[b >> 4];
            str[3 + (i * 2)] = alphabet[b & 0x0f];
        }

        return string(str);
    }

    function _mapResalePolicy(IAccessfiPool.ResalePolicy resalePolicy) internal pure returns (IAssetRegistry.ResalePolicy) {
        if (resalePolicy == IAccessfiPool.ResalePolicy.EXCLUSIVE) {
            return IAssetRegistry.ResalePolicy.EXCLUSIVE;
        }
        if (resalePolicy == IAccessfiPool.ResalePolicy.LIMITED_RESALE) {
            return IAssetRegistry.ResalePolicy.LIMITED_RESALE;
        }
        return IAssetRegistry.ResalePolicy.OPEN_RESALE;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}

    receive() external payable {
        require(msg.value > 0, "Cannot fund with zero");

        if (msg.sender == factory) {
            return;
        }

        address eoa;
        try User(payable(msg.sender)).owner() returns (address _owner) {
            eoa = _owner;
        } catch {
            eoa = msg.sender;
        }

        if (eoa != poolInfo.creator) revert NotCreator();

        uint256 platformFee = (msg.value * platformFeePercent) / 100;
        uint256 netFunding = msg.value - platformFee;

        poolInfo.remainingBudget += netFunding;
        poolInfo.totalBudget += netFunding;

        (bool feeSuccess, ) = payable(platformWallet).call{value: platformFee}("");
        require(feeSuccess, "Platform fee transfer failed");

        emit PoolFunded(msg.sender, msg.value, netFunding, platformFee, poolInfo.remainingBudget);
    }
}
