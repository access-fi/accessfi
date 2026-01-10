// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {FactoryAccessFiPool as Factory} from "./factories/FactoryAccessFiPool.sol";
import {AccessFiDataToken} from "./AccessFiDataToken.sol";
import {IAccessfiPool} from "./interfaces/IAccessfiPool.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title User
 * @notice User account contract for interacting with AccessFi pools
 * @dev Tracks pools and data tokens for each user
 */
contract User is ReentrancyGuard {
    address public immutable owner;
    address public immutable poolFactory;
    address public immutable dataToken;

    address[] private createdPools;
    address[] private joinedPools;

    uint256 public totalSpent;
    uint256 public totalEarned;

    Factory public factory;

    // Token tracking
    uint256[] private ownedDataTokens;      // Tokens owned (as buyer)
    uint256[] private createdDataTokens;    // Tokens created (as seller)

    mapping(uint256 => bool) private _hasOwnedToken;
    mapping(uint256 => bool) private _hasCreatedToken;
    mapping(address => bool) private _hasJoinedPool;
    mapping(address => bool) private _hasCreatedPool;

    error AlreadyJoinedPool();
    error AlreadyCreatedPool();
    error InvalidPoolAddress();
    error OnlyOwner();
    error NoFunds();
    error TransferFailed();

    event PoolCreated(address indexed poolAddress);
    event PoolJoined(address indexed poolAddress);
    event DataTokenOwned(uint256 indexed tokenId);
    event DataTokenCreated(uint256 indexed tokenId);

    constructor(address _owner, address _poolFactory, address _dataToken) {
        owner = _owner;
        poolFactory = _poolFactory;
        dataToken = _dataToken;
        factory = Factory(poolFactory);
    }

    // ==============================================================
    //                        POOL FUNCTIONS
    // ==============================================================

    function createPool(IAccessfiPool.PoolInfo memory _poolInfo) external payable nonReentrant {
        if (msg.sender != owner) revert OnlyOwner();

        address poolAddress = factory.createAccessFiPool{value: msg.value}(_poolInfo);

        if (_hasCreatedPool[poolAddress]) revert AlreadyCreatedPool();

        createdPools.push(poolAddress);
        _hasCreatedPool[poolAddress] = true;

        // Track total spending (Issue #10 SOLVED)
        totalSpent += msg.value;

        emit PoolCreated(poolAddress);
    }

    /**
     * @notice Fund an existing pool with additional ETH
     * @dev Forwards ETH to pool's receive() function which deducts platform fee
     * @param _poolAddress Address of the pool to fund
     */
    function fundPool(address _poolAddress) external payable nonReentrant {
        if (msg.sender != owner) revert OnlyOwner();
        if (_poolAddress == address(0)) revert InvalidPoolAddress();
        require(msg.value > 0, "Cannot fund with zero");

        // Forward funds to pool (triggers pool's receive() function)
        (bool success, ) = payable(_poolAddress).call{value: msg.value}("");
        require(success, "Pool funding failed");

        // Track total spending
        totalSpent += msg.value;
    }

    /**
     * @notice Stop a pool and withdraw remaining budget
     * @dev Only the pool creator can stop their own pools
     * @param _poolAddress Address of the pool to stop
     */
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
        IAccessfiPool.VerificationParams calldata zkParams
    ) external nonReentrant {
        if (msg.sender != owner) revert OnlyOwner();
        IAccessfiPool(_poolAddress).submitProofAsSeller(_proofType, _proofHash, encryptedCID, dataHash, zkParams);
    }

    // ==============================================================
    //                        TOKEN TRACKING
    // ==============================================================

    function syncOwnedTokens() external {
        if (msg.sender != owner) revert OnlyOwner();

        uint256[] memory tokens = AccessFiDataToken(dataToken).getBuyerTokens(owner);

        for (uint256 i = 0; i < tokens.length;) {
            if (!_hasOwnedToken[tokens[i]]) {
                ownedDataTokens.push(tokens[i]);
                _hasOwnedToken[tokens[i]] = true;
                emit DataTokenOwned(tokens[i]);
            }
            unchecked { ++i; }
        }
    }

    function syncCreatedTokens() external {
        if (msg.sender != owner) revert OnlyOwner();

        uint256[] memory tokens = AccessFiDataToken(dataToken).getSellerTokens(owner);

        for (uint256 i = 0; i < tokens.length;) {
            if (!_hasCreatedToken[tokens[i]]) {
                createdDataTokens.push(tokens[i]);
                _hasCreatedToken[tokens[i]] = true;
                emit DataTokenCreated(tokens[i]);
            }
            unchecked { ++i; }
        }
    }

    // ==============================================================
    //                        VIEW FUNCTIONS
    // ==============================================================

    function getOwnedDataTokens() external view returns (uint256[] memory) {
        return ownedDataTokens;
    }

    function getCreatedDataTokens() external view returns (uint256[] memory) {
        return createdDataTokens;
    }

    function getCreatedPools() external view returns (address[] memory) {
        return createdPools;
    }

    function getJoinedPools() external view returns (address[] memory) {
        return joinedPools;
    }

    function getCreatedPoolsCount() external view returns (uint256) {
        return createdPools.length;
    }

    function getJoinedPoolsCount() external view returns (uint256) {
        return joinedPools.length;
    }

    function getTotalSpent() external view returns (uint256) {
        return totalSpent;
    }

    function getTotalEarned() external view returns (uint256) {
        return totalEarned;
    }

    /**
     * @notice Called by pool when owner receives payment as seller
     * @dev Only callable by authorized pools (prevents fake earnings)
     * @param amount Amount earned
     */
    function notifyEarning(uint256 amount) external {
        // Verify caller is a valid pool
        bool isValidPool = false;
        address[] memory allPools = factory.getAccessFiPools();

        for (uint256 i = 0; i < allPools.length;) {
            if (allPools[i] == msg.sender) {
                isValidPool = true;
                break;
            }
            unchecked { ++i; }
        }

        require(isValidPool, "Only pools can notify earnings");

        totalEarned += amount;
    }

    /**
     * @notice Withdraw all ETH from contract (only owner)
     */
    function withdrawFunds() external nonReentrant {
        if (msg.sender != owner) revert OnlyOwner();

        uint256 balance = address(this).balance;
        if (balance == 0) revert NoFunds();

        (bool success, ) = payable(owner).call{value: balance}("");
        if (!success) revert TransferFailed();
    }

    receive() external payable {}
}
