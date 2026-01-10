// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {IAccessfiPool} from "../interfaces/IAccessfiPool.sol";
import {AccessFiPool} from "../AccessfiPool.sol";
import {AccessFiDataToken} from "../AccessFiDataToken.sol";
import {User} from "../User.sol";
import {FactoryUser} from "./FactoryUser.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

/**
 * @title FactoryAccessFiPool
 * @notice Factory for creating AccessFi pools with platform fee collection
 * @dev Implements UUPS upgradeability and manages pool deployment with proxies
 */
contract FactoryAccessFiPool is
    Initializable,
    UUPSUpgradeable,
    AccessControlUpgradeable
{
    // ==============================================================
    //                            ROLES
    // ==============================================================

    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    // ==============================================================
    //                            STORAGE
    // ==============================================================

    address public dataToken;           // Global data token contract
    address public zkVerifier;          // ZK verification contract
    address public platformWallet;      // Platform fee recipient
    address public factoryUser;         // FactoryUser contract for verification
    address public poolImplementation;  // Reusable pool implementation
    uint256 public platformFeePercent;  // Platform fee percentage (default 5%)

    address[] public accessFiPools;
    mapping(address => address[]) public creatorPools;

    // Storage gap for future upgrades
    uint256[44] private __gap;

    // ==============================================================
    //                            ERRORS
    // ==============================================================

    error InvalidPrice();
    error InvalidBudget();
    error InvalidDeadline();
    error InsufficientPayment();
    error PlatformFeeTransferFailed();
    error PoolFundingFailed();
    error RefundFailed();
    error InvalidFeePercent();
    error InvalidUserContract();
    error CreatorMismatch();

    // ==============================================================
    //                            EVENTS
    // ==============================================================

    event PoolCreated(address indexed creator, address indexed poolAddress, string name);
    event PlatformFeeCollected(address indexed creator, uint256 amount);
    event PlatformFeeUpdated(uint256 oldFee, uint256 newFee);

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
     * @notice Initialize the factory
     * @param _dataToken Address of global data token contract
     * @param _zkVerifier Address of ZK verifier contract
     * @param _platformWallet Address receiving platform fees
     * @param _factoryUser Address of FactoryUser contract
     * @param admin Address receiving admin roles
     */
    function initialize(
        address _dataToken,
        address _zkVerifier,
        address _platformWallet,
        address _factoryUser,
        address admin
    ) public initializer {
        __UUPSUpgradeable_init();
        __AccessControl_init();

        require(_dataToken != address(0), "Invalid token address");
        require(_zkVerifier != address(0), "Invalid verifier address");
        require(_platformWallet != address(0), "Invalid platform wallet");
        require(_factoryUser != address(0), "Invalid factory user");

        dataToken = _dataToken;
        zkVerifier = _zkVerifier;
        platformWallet = _platformWallet;
        factoryUser = _factoryUser;
        platformFeePercent = 5; // Default 5%

        // Deploy pool implementation once for gas efficiency
        poolImplementation = address(new AccessFiPool());

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(UPGRADER_ROLE, admin);
    }

    // ==============================================================
    //                        POOL CREATION
    // ==============================================================

    /**
     * @notice Create new AccessFi pool with platform fee deduction
     * @param _poolInfo Pool configuration
     * @return poolAddress Address of created pool
     */
    function createAccessFiPool(
        IAccessfiPool.PoolInfo memory _poolInfo
    ) external payable returns (address poolAddress) {
        // CRITICAL: Verify caller is a valid User contract
        address eoa;
        try User(payable(msg.sender)).owner() returns (address _owner) {
            eoa = _owner;
        } catch {
            revert InvalidUserContract();
        }

        // Verify User contract is registered in FactoryUser
        if (FactoryUser(factoryUser).getUser(eoa) != msg.sender) {
            revert InvalidUserContract();
        }

        // Verify _poolInfo.creator matches the User's owner
        if (_poolInfo.creator != eoa) {
            revert CreatorMismatch();
        }

        // Validations
        if (_poolInfo.pricePerData <= 0) revert InvalidPrice();
        if (_poolInfo.totalBudget <= 0) revert InvalidBudget();
        if (_poolInfo.deadline <= block.timestamp) revert InvalidDeadline();

        // Verify msg.value covers total budget
        if (msg.value < _poolInfo.totalBudget) revert InsufficientPayment();


        // Calculate platform fee
        uint256 platformFee = (_poolInfo.totalBudget * platformFeePercent) / 100;
        uint256 poolBudget = _poolInfo.totalBudget - platformFee;


        // Update pool info with net budget (after platform fee)
        _poolInfo.remainingBudget = poolBudget;
        _poolInfo.totalBudget = poolBudget;

        // Prepare initialization data using reusable implementation
        bytes memory initData = abi.encodeCall(
            AccessFiPool(payable(poolImplementation)).initialize,
            (_poolInfo, dataToken, zkVerifier, factoryUser, platformWallet, platformFeePercent, _poolInfo.creator)
        );

        // Deploy proxy using reusable implementation (gas efficient)
        ERC1967Proxy proxy = new ERC1967Proxy(poolImplementation, initData);
        poolAddress = address(proxy);

        // Authorize pool to mint data tokens
        AccessFiDataToken(dataToken).authorizePool(poolAddress);

        // Track pool
        accessFiPools.push(poolAddress);
        creatorPools[_poolInfo.creator].push(poolAddress);

        // Transfer platform fee
        (bool feeSuccess, ) = payable(platformWallet).call{value: platformFee}("");
        if (!feeSuccess) revert PlatformFeeTransferFailed();
        emit PlatformFeeCollected(_poolInfo.creator, platformFee);

        // Transfer pool budget to pool contract
        (bool poolSuccess, ) = payable(poolAddress).call{value: poolBudget}("");
        if (!poolSuccess) revert PoolFundingFailed();

        // Refund excess if any
        uint256 totalUsed = poolBudget + platformFee;
        if (msg.value > totalUsed) {
            uint256 excess = msg.value - totalUsed;
            (bool refundSuccess, ) = payable(msg.sender).call{value: excess}("");
            if (!refundSuccess) revert RefundFailed();
        }

        emit PoolCreated(_poolInfo.creator, poolAddress, _poolInfo.name);
        return poolAddress;
    }

    // ==============================================================
    //                        VIEW FUNCTIONS
    // ==============================================================

    /**
     * @notice Get all pool addresses
     */
    function getAccessFiPools() external view returns (address[] memory) {
        return accessFiPools;
    }

    /**
     * @notice Get pool at specific index
     */
    function getAccessFiPool(uint256 _index) external view returns (address) {
        require(_index < accessFiPools.length, "Invalid index");
        return accessFiPools[_index];
    }

    /**
     * @notice Get total number of pools
     */
    function getAccessFiPoolCount() external view returns (uint256) {
        return accessFiPools.length;
    }

    /**
     * @notice Get all pools created by specific address
     */
    function getCreatorPools(address _creator) external view returns (address[] memory) {
        return creatorPools[_creator];
    }

    // ==============================================================
    //                        ADMIN FUNCTIONS
    // ==============================================================

    /**
     * @notice Update platform fee percentage (only admin)
     * @param newFeePercent New fee percentage (0-100)
     */
    function setPlatformFee(uint256 newFeePercent) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (newFeePercent > 100) revert InvalidFeePercent();

        uint256 oldFee = platformFeePercent;
        platformFeePercent = newFeePercent;

        emit PlatformFeeUpdated(oldFee, newFeePercent);
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
}
