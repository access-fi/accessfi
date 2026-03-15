// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {IAccessfiPool} from "../interfaces/IAccessfiPool.sol";
import {IAssetRegistry} from "../interfaces/IAssetRegistry.sol";
import {AccessFiPool} from "../AccessfiPool.sol";
import {User} from "../User.sol";
import {FactoryUser} from "./FactoryUser.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

contract FactoryAccessFiPool is Initializable, UUPSUpgradeable, AccessControlUpgradeable {
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    address public assetRegistry;
    address public zkVerifier;
    address public platformWallet;
    address public factoryUser;
    address public poolImplementation;
    uint256 public platformFeePercent;

    address[] public accessFiPools;
    mapping(address => address[]) public creatorPools;

    uint256[44] private __gap;

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

    event PoolCreated(address indexed creator, address indexed poolAddress, string name);
    event PlatformFeeCollected(address indexed creator, uint256 amount);
    event PlatformFeeUpdated(uint256 oldFee, uint256 newFee);

    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _assetRegistry,
        address _zkVerifier,
        address _platformWallet,
        address _factoryUser,
        address admin
    ) public initializer {
        __UUPSUpgradeable_init();
        __AccessControl_init();

        require(_assetRegistry != address(0), "Invalid registry address");
        require(_zkVerifier != address(0), "Invalid verifier address");
        require(_platformWallet != address(0), "Invalid platform wallet");
        require(_factoryUser != address(0), "Invalid factory user");

        assetRegistry = _assetRegistry;
        zkVerifier = _zkVerifier;
        platformWallet = _platformWallet;
        factoryUser = _factoryUser;
        platformFeePercent = 5;
        poolImplementation = address(new AccessFiPool());

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(UPGRADER_ROLE, admin);
    }

    function createAccessFiPool(IAccessfiPool.PoolInfo memory _poolInfo) external payable returns (address poolAddress) {
        address eoa;
        try User(payable(msg.sender)).owner() returns (address _owner) {
            eoa = _owner;
        } catch {
            revert InvalidUserContract();
        }

        if (FactoryUser(factoryUser).getUser(eoa) != msg.sender) {
            revert InvalidUserContract();
        }
        if (_poolInfo.creator != eoa) {
            revert CreatorMismatch();
        }
        if (_poolInfo.pricePerData == 0) revert InvalidPrice();
        if (_poolInfo.totalBudget == 0) revert InvalidBudget();
        if (_poolInfo.deadline <= block.timestamp) revert InvalidDeadline();
        if (msg.value < _poolInfo.totalBudget) revert InsufficientPayment();

        uint256 platformFee = (_poolInfo.totalBudget * platformFeePercent) / 100;
        uint256 poolBudget = _poolInfo.totalBudget - platformFee;

        _poolInfo.remainingBudget = poolBudget;
        _poolInfo.totalBudget = poolBudget;

        bytes memory initData = abi.encodeCall(
            AccessFiPool(payable(poolImplementation)).initialize,
            (_poolInfo, assetRegistry, zkVerifier, factoryUser, platformWallet, platformFeePercent, _poolInfo.creator)
        );

        ERC1967Proxy proxy = new ERC1967Proxy(poolImplementation, initData);
        poolAddress = address(proxy);

        IAssetRegistry(assetRegistry).authorizePool(poolAddress);

        accessFiPools.push(poolAddress);
        creatorPools[_poolInfo.creator].push(poolAddress);

        (bool feeSuccess, ) = payable(platformWallet).call{value: platformFee}("");
        if (!feeSuccess) revert PlatformFeeTransferFailed();
        emit PlatformFeeCollected(_poolInfo.creator, platformFee);

        (bool poolSuccess, ) = payable(poolAddress).call{value: poolBudget}("");
        if (!poolSuccess) revert PoolFundingFailed();

        uint256 totalUsed = poolBudget + platformFee;
        if (msg.value > totalUsed) {
            uint256 excess = msg.value - totalUsed;
            (bool refundSuccess, ) = payable(msg.sender).call{value: excess}("");
            if (!refundSuccess) revert RefundFailed();
        }

        emit PoolCreated(_poolInfo.creator, poolAddress, _poolInfo.name);
    }

    function getAccessFiPools() external view returns (address[] memory) {
        return accessFiPools;
    }

    function getAccessFiPool(uint256 _index) external view returns (address) {
        require(_index < accessFiPools.length, "Invalid index");
        return accessFiPools[_index];
    }

    function getAccessFiPoolCount() external view returns (uint256) {
        return accessFiPools.length;
    }

    function getCreatorPools(address _creator) external view returns (address[] memory) {
        return creatorPools[_creator];
    }

    function setPlatformFee(uint256 newFeePercent) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (newFeePercent > 100) revert InvalidFeePercent();
        uint256 oldFee = platformFeePercent;
        platformFeePercent = newFeePercent;
        emit PlatformFeeUpdated(oldFee, newFeePercent);
    }

    function setFactoryUser(address newFactoryUser) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newFactoryUser != address(0), "Invalid factory user address");
        factoryUser = newFactoryUser;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}
}
