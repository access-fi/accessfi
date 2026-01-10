// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {IAccessfiPool} from "./interfaces/IAccessfiPool.sol";
import {AccessFiDataToken} from "./AccessFiDataToken.sol";
import {verifyProof} from "./VerifyProof.sol";
import {User} from "./User.sol";
import {FactoryUser} from "./factories/FactoryUser.sol";
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
    address public factoryUser;  // FactoryUser contract for verification
    address public platformWallet;  // Platform fee recipient
    uint256 public platformFeePercent;  // Platform fee percentage

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

    // Gas optimization: map required proof types for O(1) lookup
    mapping(IAccessfiPool.ProofType => bool) public requiredProofs;

    // Storage gap for future upgrades
    uint256[36] private __gap;

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
    error InvalidUserContract();
    error TooManyProofRequirements();

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
     * @param _factoryUser FactoryUser contract for User verification
     * @param _platformWallet Platform fee recipient
     * @param _platformFeePercent Platform fee percentage
     * @param admin Address receiving admin roles
     */
    function initialize(
        IAccessfiPool.PoolInfo memory _poolInfo,
        address _dataToken,
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

        poolInfo = _poolInfo;
        dataToken = AccessFiDataToken(_dataToken);
        zkVerifier = verifyProof(_zkVerifier);
        factoryUser = _factoryUser;
        platformWallet = _platformWallet;
        platformFeePercent = _platformFeePercent;

        // Populate requiredProofs mapping for O(1) lookup
        uint256 reqLength = _poolInfo.proofRequirements.length;

        // PROTECTION: Limit proof requirements to prevent DoS attacks
        if (reqLength > 10) revert TooManyProofRequirements();
        if (reqLength == 0) revert InvalidProofType();

        for (uint256 i = 0; i < reqLength;) {
            IAccessfiPool.ProofType proofType = _poolInfo.proofRequirements[i];

            // GAS OPTIMIZATION: Skip if already set (prevents duplicate writes)
            if (!requiredProofs[proofType]) {
                requiredProofs[proofType] = true;
            }

            unchecked { ++i; }
        }

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
     * @notice Join pool as a seller (MANDATORY: must call via User contract)
     * @dev Verifies caller is valid User contract and extracts EOA owner
     */
    function joinPoolAsSeller() external poolActive notExpired {
        // Verify caller is a valid User contract and get EOA owner
        address eoa = _verifyUserContract(msg.sender);

        if (eoa == poolInfo.creator) revert CreatorCannotBeSeller();
        if (isSellerJoined[eoa]) revert AlreadyJoined();

        isSellerJoined[eoa] = true;
        joinedSellers.push(eoa);

        emit SellerJoined(eoa);
    }

    /**
     * @notice Submit proof for verification (CRITICAL: automatic minting on completion)
     * @dev MANDATORY: must call via User contract
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
        // Verify caller is valid User contract and get EOA owner
        address eoa = _verifyUserContract(msg.sender);

        if (!isSellerJoined[eoa]) revert NotJoined();
        if (isSellerFullyVerified[eoa]) revert AlreadyVerified();
        if (sellerProofs[eoa][_proofType]) revert ProofAlreadySubmitted();
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
            abi.encode(eoa, _proofType, _proofHash, address(this))
        );
        if (globalProofHashes[uniqueProofHash]) revert ProofReused();

        sellerProofs[eoa][_proofType] = true;
        sellerProofHashes[eoa][_proofType] = uniqueProofHash;
        globalProofHashes[uniqueProofHash] = true;

        emit ProofSubmitted(eoa, _proofType, true);

        // Check if all proofs submitted → trigger automatic token minting
        _checkFullVerificationAndMint(eoa, encryptedCID, dataHash);
    }

    // ==============================================================
    //                        CREATOR FUNCTIONS
    // ==============================================================

    /**
     * @notice Stop pool early and withdraw remaining budget
     * @dev Accepts calls from creator's User contract OR directly from creator EOA
     */
    function stopPool() external nonReentrant {
        if (isStopped) revert AlreadyStopped();

        // Verify caller is creator's User contract OR creator EOA
        address eoa;
        try User(payable(msg.sender)).owner() returns (address _owner) {
            eoa = _owner;  // msg.sender is User contract, extract EOA
        } catch {
            eoa = msg.sender;  // msg.sender is EOA (direct call allowed)
        }

        // Only creator can stop the pool
        if (eoa != poolInfo.creator) revert NotCreator();

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
     * @notice Verify caller is valid User contract and return EOA owner
     * @param userContract Address claiming to be User contract
     * @return eoa The EOA owner of the User contract
     */
    function _verifyUserContract(address userContract) internal view returns (address eoa) {
        // Safety checks
        if (userContract == address(0)) revert InvalidUserContract();

        // Try to get owner from User contract (protects against malicious contracts)
        try User(payable(userContract)).owner() returns (address _owner) {
            eoa = _owner;
        } catch {
            revert InvalidUserContract();
        }

        // Additional safety check
        if (eoa == address(0)) revert InvalidUserContract();

        // CRITICAL: Verify FactoryUser recognizes this User contract
        // This prevents impersonation attacks
        if (FactoryUser(factoryUser).getUser(eoa) != userContract) {
            revert InvalidUserContract();
        }

        return eoa;
    }

    /**
     * @notice Check if proof type is required by pool (O(1) lookup)
     */
    function _isValidProofType(IAccessfiPool.ProofType _proofType) internal view returns (bool) {
        return requiredProofs[_proofType];
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
            isSellerVerified[seller] = true;
            verifiedSellers.push(seller);

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

        // Cache storage variables for gas efficiency
        uint256 remaining = poolInfo.remainingBudget;
        uint256 price = poolInfo.pricePerData;

        // Check if pool should auto-stop (budget exhausted)
        if (remaining < price) {
            poolInfo.isActive = false;
            emit PoolAutoStopped();
            return;
        }

        // EFFECTS
        hasClaimedToken[seller] = true;
        poolInfo.remainingBudget = remaining - price;
        totalDataCollected += 1;

        // Store verified data reference
        verifiedSellerData[seller] = IAccessfiPool.VerifiedData({
            encryptedCID: encryptedCID,
            encryptedDataHash: dataHash,
            isEncrypted: true,
            isAccessTransferred: true,
            timestamp: block.timestamp
        });

        // INTERACTIONS (CEI pattern - payment LAST to prevent re-entrancy)

        // 1. Mint token to seller
        uint256 tokenId = dataToken.mintToSeller(seller, encryptedCID, dataHash);
        sellerToTokenId[seller] = tokenId;
        emit DataTokenMinted(seller, tokenId);

        // 2. Transfer token to buyer (pool creator)
        address creator = poolInfo.creator;
        dataToken.transferToBuyer(tokenId, creator);
        emit DataTokenTransferred(tokenId, creator);

        emit DataPurchased(creator, price, 1);
        emit AccessTransferred(creator, seller, encryptedCID);

        // 3. Pay seller LAST (prevents re-entrancy attacks)
        (bool paymentSuccess, ) = payable(seller).call{value: price}("");
        if (!paymentSuccess) revert PaymentFailed();

        emit SellerPaid(seller, price);

        // 4. Notify seller's User contract of earnings (if exists)
        address sellerUserContract = FactoryUser(factoryUser).getUser(seller);
        if (sellerUserContract != address(0)) {
            try User(payable(sellerUserContract)).notifyEarning(price) {} catch {
                // Ignore if notification fails (doesn't block payment)
            }
        }
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
     * @notice Accept ETH deposits (for funding pool) - only creator can add funds
     * @dev Deducts 5% platform fee on every funding
     * @dev Accepts calls from creator's User contract OR directly from creator EOA
     */
    receive() external payable {
        require(msg.value > 0, "Cannot fund with zero");

        // Verify caller is creator's User contract OR creator EOA
        address eoa;
        try User(payable(msg.sender)).owner() returns (address _owner) {
            eoa = _owner;  // msg.sender is User contract, extract EOA
        } catch {
            eoa = msg.sender;  // msg.sender is EOA (direct funding allowed)
        }

        // Only creator can fund the pool
        if (eoa != poolInfo.creator) revert NotCreator();

        // Calculate platform fee (5% of funding amount)
        uint256 platformFee = (msg.value * platformFeePercent) / 100;
        uint256 netFunding = msg.value - platformFee;

        // Update pool budget with net amount (after fee)
        poolInfo.remainingBudget += netFunding;
        poolInfo.totalBudget += netFunding;

        // Transfer platform fee
        (bool feeSuccess, ) = payable(platformWallet).call{value: platformFee}("");
        require(feeSuccess, "Platform fee transfer failed");

        emit PoolFunded(msg.sender, msg.value, netFunding, platformFee, poolInfo.remainingBudget);
    }
}
