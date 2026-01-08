// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {IAccessfiPool} from "./interfaces/IAccessfiPool.sol";
import {AccessFiDataToken} from "./AccessFiDataToken.sol";
import {verifyProof} from "./VerifyProof.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";

/**
 * @title AccessFiPool
 * @notice Manages data collection pools where buyers can acquire verified seller data
 * @dev Implements UUPS upgradeability with automatic token minting on proof verification
 */
contract AccessFiPool is
    Initializable,
    IAccessfiPool,
    UUPSUpgradeable,
    AccessControlUpgradeable,
    ReentrancyGuardUpgradeable
{
    // ==============================================================
    //                            ROLES
    // ==============================================================

    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    // ==============================================================
    //                            STORAGE
    // ==============================================================

    IAccessfiPool.PoolInfo public poolInfo;
    uint256 public totalDataCollected;

    address[] public joinedSellers;
    address[] public verifiedSellers;

    AccessFiDataToken public dataToken;
    verifyProof public zkVerifier;

    mapping(address => bool) public isSellerJoined;
    mapping(address => bool) public isSellerVerified;
    mapping(address => mapping(IAccessfiPool.ProofType => bool)) public sellerProofs;
    mapping(address => bool) public isSellerFullyVerified;
    mapping(address => mapping(IAccessfiPool.ProofType => bytes32)) public sellerProofHashes;
    mapping(bytes32 => bool) public globalProofHashes;
    mapping(address => IAccessfiPool.VerifiedData) public verifiedSellerData;
    mapping(address => string[]) public buyerAccessibleCIDs;

    // New storage for token system
    mapping(address => uint256) public sellerToTokenId;
    mapping(address => bool) public hasClaimedToken;
    bool public isStopped;

    // Storage gap for future upgrades
    uint256[40] private __gap;

    // ==============================================================
    //                            ERRORS
    // ==============================================================

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
    error TokenAlreadyClaimed();
    error InsufficientBudget();
    error InvalidCID();
    error PaymentFailed();
    error WithdrawalFailed();
    error AlreadyStopped();

    // ==============================================================
    //                            EVENTS
    // ==============================================================

    // Events are inherited from IAccessfiPool interface

    // ==============================================================
    //                            CONSTRUCTOR
    // ==============================================================

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    // ==============================================================
    //                            INITIALIZER
    // ==============================================================

    /**
     * @notice Initialize the pool (replaces constructor)
     * @param _poolInfo Pool configuration
     * @param _dataToken Global data token contract
     * @param _zkVerifier ZK proof verifier contract
     * @param admin Address receiving admin roles
     */
    function initialize(
        IAccessfiPool.PoolInfo memory _poolInfo,
        address _dataToken,
        address _zkVerifier,
        address admin
    ) public initializer {
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();
        __AccessControl_init();

        require(_poolInfo.remainingBudget == _poolInfo.totalBudget, "Budget mismatch");

        poolInfo = _poolInfo;
        dataToken = AccessFiDataToken(_dataToken);
        zkVerifier = verifyProof(_zkVerifier);

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(UPGRADER_ROLE, admin);

        emit PoolCreated(
            poolInfo.name,
            poolInfo.dataType,
            poolInfo.pricePerData,
            poolInfo.totalBudget
        );
    }

    // ==============================================================
    //                            MODIFIERS
    // ==============================================================

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

    // ==============================================================
    //                        SELLER FUNCTIONS
    // ==============================================================

    /**
     * @notice Join pool as a seller (SECURITY FIX: uses msg.sender)
     */
    function joinPoolAsSeller() external poolActive notExpired {
        if (msg.sender == poolInfo.creator) revert CreatorCannotBeSeller();
        if (isSellerJoined[msg.sender]) revert AlreadyJoined();

        isSellerJoined[msg.sender] = true;
        joinedSellers.push(msg.sender);

        emit SellerJoined(msg.sender);
    }

    /**
     * @notice Submit proof for verification (CRITICAL: automatic minting on completion)
     * @param _proofType Type of proof being submitted
     * @param _proofHash Hash of the proof
     * @param encryptedCID IPFS CID of encrypted data
     * @param dataHash Hash of encrypted data
     * @param zkParams ZK verification parameters
     */
    function submitProofAsSeller(
        IAccessfiPool.ProofType _proofType,
        bytes32 _proofHash,
        string calldata encryptedCID,
        bytes32 dataHash,
        IAccessfiPool.VerificationParams calldata zkParams
    ) external poolActive notExpired nonReentrant {
        if (!isSellerJoined[msg.sender]) revert NotJoined();
        if (isSellerFullyVerified[msg.sender]) revert AlreadyVerified();
        if (sellerProofs[msg.sender][_proofType]) revert ProofAlreadySubmitted();
        if (!_isValidProofType(_proofType)) revert InvalidProofType();

        // CRITICAL: Verify ZK proof via zkVerify
        zkVerifier.verify(
            zkParams.aggregationId,
            zkParams.domainId,
            zkParams.merklePath,
            zkParams.leaf,
            zkParams.leafCount,
            zkParams.index
        );

        // Validate proof hash matches
        if (_proofHash != zkParams.leaf) revert ProofHashMismatch();

        // Store unique proof hash to prevent reuse
        bytes32 uniqueProofHash = keccak256(
            abi.encodePacked(msg.sender, uint8(_proofType), _proofHash, address(this))
        );
        if (globalProofHashes[uniqueProofHash]) revert ProofReused();

        sellerProofs[msg.sender][_proofType] = true;
        sellerProofHashes[msg.sender][_proofType] = uniqueProofHash;
        globalProofHashes[uniqueProofHash] = true;

        emit ProofSubmitted(msg.sender, _proofType, true);

        // Check if all proofs submitted → trigger automatic token minting
        _checkFullVerificationAndMint(msg.sender, encryptedCID, dataHash);
    }

    // ==============================================================
    //                        CREATOR FUNCTIONS
    // ==============================================================

    /**
     * @notice Stop pool early and withdraw remaining budget
     */
    function stopPool() external onlyCreator nonReentrant {
        if (!poolInfo.isActive && isStopped) revert AlreadyStopped();

        isStopped = true;
        poolInfo.isActive = false;

        // Withdraw remaining budget to creator
        uint256 remaining = poolInfo.remainingBudget;
        if (remaining > 0) {
            poolInfo.remainingBudget = 0;
            (bool success, ) = payable(poolInfo.creator).call{value: remaining}("");
            if (!success) revert WithdrawalFailed();

            emit PoolStopped(remaining);
        }
    }

    /**
     * @notice Get current budget status
     * @return remaining Remaining budget
     * @return spent Amount spent so far
     * @return dataCollected Number of data items collected
     * @return active Whether pool is active
     */
    function getBudgetStatus() external view returns (
        uint256 remaining,
        uint256 spent,
        uint256 dataCollected,
        bool active
    ) {
        return (
            poolInfo.remainingBudget,
            poolInfo.totalBudget - poolInfo.remainingBudget,
            totalDataCollected,
            poolInfo.isActive && !isStopped
        );
    }

    // ==============================================================
    //                        INTERNAL FUNCTIONS
    // ==============================================================

    /**
     * @notice Check if proof type is required by pool
     */
    function _isValidProofType(IAccessfiPool.ProofType _proofType) internal view returns (bool) {
        uint256 reqLength = poolInfo.proofRequirements.length;
        for (uint256 i = 0; i < reqLength;) {
            if (poolInfo.proofRequirements[i] == _proofType) {
                return true;
            }
            unchecked { ++i; }
        }
        return false;
    }

    /**
     * @notice Check if seller has all required proofs and trigger minting
     */
    function _checkFullVerificationAndMint(
        address seller,
        string calldata encryptedCID,
        bytes32 dataHash
    ) internal {
        // Check all required proofs submitted
        uint256 reqLength = poolInfo.proofRequirements.length;
        for (uint256 i = 0; i < reqLength;) {
            if (!sellerProofs[seller][poolInfo.proofRequirements[i]]) {
                return; // Not all proofs submitted yet
            }
            unchecked { ++i; }
        }

        // All proofs verified - mark as fully verified
        if (!isSellerFullyVerified[seller]) {
            isSellerFullyVerified[seller] = true;
            if (!isSellerVerified[seller]) {
                isSellerVerified[seller] = true;
                verifiedSellers.push(seller);
            }
            emit SellerFullyVerified(seller);

            // AUTOMATIC: Mint token and process payment
            _mintAndTransferToken(seller, encryptedCID, dataHash);
        }
    }

    /**
     * @notice Atomic function: mint token + pay seller + transfer to buyer
     * @dev Follows CEI pattern for security
     */
    function _mintAndTransferToken(
        address seller,
        string calldata encryptedCID,
        bytes32 dataHash
    ) internal {
        // CHECKS
        if (hasClaimedToken[seller]) revert TokenAlreadyClaimed();
        // encryptedCID is optional (can be empty for proof-only pools)

        // Check if pool should auto-stop (budget exhausted)
        if (poolInfo.remainingBudget < poolInfo.pricePerData) {
            poolInfo.isActive = false;
            emit PoolAutoStopped();
            return;
        }

        if (poolInfo.remainingBudget < poolInfo.pricePerData) revert InsufficientBudget();

        // EFFECTS
        hasClaimedToken[seller] = true;
        poolInfo.remainingBudget -= poolInfo.pricePerData;
        totalDataCollected += 1;

        // Store verified data reference
        verifiedSellerData[seller] = IAccessfiPool.VerifiedData({
            encryptedCID: encryptedCID,
            encryptedDataHash: dataHash,
            isEncrypted: true,
            isAccessTransferred: true,
            timestamp: block.timestamp
        });

        // INTERACTIONS (safe order with CEI pattern)

        // 1. Mint token to seller
        uint256 tokenId = dataToken.mintToSeller(seller, encryptedCID, dataHash);
        sellerToTokenId[seller] = tokenId;
        emit DataTokenMinted(seller, tokenId);

        // 2. Pay seller
        (bool paymentSuccess, ) = payable(seller).call{value: poolInfo.pricePerData}("");
        if (!paymentSuccess) revert PaymentFailed();

        // 3. Transfer token to buyer (pool creator)
        dataToken.transferToBuyer(tokenId, poolInfo.creator);
        emit DataTokenTransferred(tokenId, poolInfo.creator);

        emit DataPurchased(poolInfo.creator, poolInfo.pricePerData, 1);
        emit AccessTransferred(poolInfo.creator, seller, encryptedCID);
    }

    // ==============================================================
    //                        VIEW FUNCTIONS
    // ==============================================================

    /**
     * @notice Get all joined sellers
     */
    function getJoinedSellers() external view returns (address[] memory) {
        return joinedSellers;
    }

    /**
     * @notice Get all verified sellers
     */
    function getVerifiedSellers() external view returns (address[] memory) {
        return verifiedSellers;
    }

    /**
     * @notice Check if seller has submitted specific proof type
     */
    function hasProof(address seller, IAccessfiPool.ProofType proofType) external view returns (bool) {
        return sellerProofs[seller][proofType];
    }

    // ==============================================================
    //                        UPGRADE AUTHORIZATION
    // ==============================================================

    /**
     * @notice Authorize upgrade (only UPGRADER_ROLE)
     */
    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyRole(UPGRADER_ROLE)
    {}

    // ==============================================================
    //                        RECEIVE FUNCTION
    // ==============================================================

    /**
     * @notice Accept ETH deposits (for funding pool)
     */
    receive() external payable {}
}
