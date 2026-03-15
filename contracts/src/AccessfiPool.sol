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
    mapping(address => mapping(IAccessfiPool.ProofType => bool)) public sellerProofs;
    mapping(address => bool) public isSellerFullyVerified;
    mapping(address => mapping(IAccessfiPool.ProofType => bytes32)) public sellerProofHashes;
    mapping(bytes32 => bool) public globalProofHashes;
    mapping(address => IAccessfiPool.VerifiedData) public verifiedSellerData;
    mapping(address => string[]) public buyerAccessibleCIDs;
    mapping(address => bytes32) public sellerToAssetId;
    mapping(IAccessfiPool.ProofType => bool) public requiredProofs;
    bool public isStopped;

    uint256[37] private __gap;

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
    error InsufficientBudget();
    error PaymentFailed();
    error WithdrawalFailed();
    error AlreadyStopped();
    error InvalidUserContract();
    error TooManyProofRequirements();

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
            IAccessfiPool.ProofType proofType = _poolInfo.proofRequirements[i];
            if (!requiredProofs[proofType]) {
                requiredProofs[proofType] = true;
            }
            unchecked { ++i; }
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
        IAccessfiPool.ProofType _proofType,
        bytes32 _proofHash,
        string calldata encryptedCID,
        bytes32 dataHash,
        IAccessfiPool.VerificationParams calldata zkParams,
        IAccessfiPool.ResalePolicy resalePolicy
    ) external poolActive notExpired nonReentrant {
        address eoa = _verifyUserContract(msg.sender);

        if (!isSellerJoined[eoa]) revert NotJoined();
        if (isSellerFullyVerified[eoa]) revert AlreadyVerified();
        if (sellerProofs[eoa][_proofType]) revert ProofAlreadySubmitted();
        if (!_isValidProofType(_proofType)) revert InvalidProofType();

        zkVerifier.verify(
            zkParams.aggregationId,
            zkParams.domainId,
            zkParams.merklePath,
            zkParams.leaf,
            zkParams.leafCount,
            zkParams.index
        );

        if (_proofHash != zkParams.leaf) revert ProofHashMismatch();

        bytes32 uniqueProofHash = keccak256(abi.encode(eoa, _proofType, _proofHash, address(this)));
        if (globalProofHashes[uniqueProofHash]) revert ProofReused();

        sellerProofs[eoa][_proofType] = true;
        sellerProofHashes[eoa][_proofType] = uniqueProofHash;
        globalProofHashes[uniqueProofHash] = true;

        emit ProofSubmitted(eoa, _proofType, true);
        _checkFullVerificationAndSettle(eoa, encryptedCID, dataHash, resalePolicy, _proofType);
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

    function _isValidProofType(IAccessfiPool.ProofType _proofType) internal view returns (bool) {
        return requiredProofs[_proofType];
    }

    function _checkFullVerificationAndSettle(
        address seller,
        string calldata encryptedCID,
        bytes32 dataHash,
        IAccessfiPool.ResalePolicy resalePolicy,
        IAccessfiPool.ProofType proofType
    ) internal {
        uint256 reqLength = poolInfo.proofRequirements.length;
        for (uint256 i = 0; i < reqLength;) {
            if (!sellerProofs[seller][poolInfo.proofRequirements[i]]) {
                return;
            }
            unchecked { ++i; }
        }

        if (!isSellerFullyVerified[seller]) {
            isSellerFullyVerified[seller] = true;
            isSellerVerified[seller] = true;
            verifiedSellers.push(seller);
            emit SellerFullyVerified(seller);

            _registerAssetAndSettle(seller, encryptedCID, dataHash, resalePolicy, proofType);
        }
    }

    function _registerAssetAndSettle(
        address seller,
        string calldata encryptedCID,
        bytes32 dataHash,
        IAccessfiPool.ResalePolicy resalePolicy,
        IAccessfiPool.ProofType proofType
    ) internal {
        uint256 remaining = poolInfo.remainingBudget;
        uint256 price = poolInfo.pricePerData;

        if (remaining < price) {
            poolInfo.isActive = false;
            emit PoolAutoStopped();
            return;
        }

        bytes32 assetId = _deriveAssetId(seller, dataHash);
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
            _proofTypeToString(proofType),
            encryptedCID,
            dataHash,
            IAssetRegistry.VerificationStatus.VERIFIED,
            _mapResalePolicy(resalePolicy),
            price,
            0,
            listed
        );
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

    function _deriveAssetId(address seller, bytes32 dataHash) internal view returns (bytes32) {
        return keccak256(abi.encodePacked(seller, poolInfo.dataType, dataHash));
    }

    function _proofTypeToString(IAccessfiPool.ProofType proofType) internal pure returns (string memory) {
        if (proofType == IAccessfiPool.ProofType.AGE_VERIFICATION) return "age_verification";
        if (proofType == IAccessfiPool.ProofType.NATIONALITY) return "nationality";
        if (proofType == IAccessfiPool.ProofType.EMAIL_VERIFICATION) return "email_verification";
        if (proofType == IAccessfiPool.ProofType.HACKERHOUSE_INVITATION) return "hackerhouse_invitation";
        return "unknown";
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

    function getJoinedSellers() external view returns (address[] memory) {
        return joinedSellers;
    }

    function getVerifiedSellers() external view returns (address[] memory) {
        return verifiedSellers;
    }

    function hasProof(address seller, IAccessfiPool.ProofType proofType) external view returns (bool) {
        return sellerProofs[seller][proofType];
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
