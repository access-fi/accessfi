// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {FactoryAccessFiPool as Factory} from "./factories/FactoryAccessFiPool.sol";
import {AccessFiDataToken} from "./AccessFiDataToken.sol";
import {IAccessfiPool} from "./interfaces/IAccessfiPool.sol";

/**
 * @title User
 * @notice User account contract for interacting with AccessFi pools
 * @dev Tracks pools and data tokens for each user
 */
contract User {
    address public immutable owner;
    address public immutable poolFactory;
    address public immutable dataToken;

    address[] public createdPools;
    address[] public joinedPools;

    uint256 public totalSpent;
    uint256 public totalEarned;

    Factory public factory;

    // Token tracking
    uint256[] public ownedDataTokens;      // Tokens owned (as buyer)
    uint256[] public createdDataTokens;    // Tokens created (as seller)

    mapping(uint256 => bool) private _hasOwnedToken;
    mapping(uint256 => bool) private _hasCreatedToken;

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

    function createPool(IAccessfiPool.PoolInfo memory _poolInfo) external payable {
        require(msg.sender == owner, "Only owner");
        address poolAddress = factory.createAccessFiPool{value: msg.value}(_poolInfo);
        createdPools.push(poolAddress);
        emit PoolCreated(poolAddress);
    }

    function joinPool(address _poolAddress) external {
        require(msg.sender == owner, "Only owner");
        IAccessfiPool(_poolAddress).joinPoolAsSeller();
        joinedPools.push(_poolAddress);
        emit PoolJoined(_poolAddress);
    }

    function submitProofAsSeller(
        address _poolAddress,
        IAccessfiPool.ProofType _proofType,
        bytes32 _proofHash,
        string calldata encryptedCID,
        bytes32 dataHash,
        IAccessfiPool.VerificationParams calldata zkParams
    ) external {
        require(msg.sender == owner, "Only owner");
        IAccessfiPool(_poolAddress).submitProofAsSeller(_proofType, _proofHash, encryptedCID, dataHash, zkParams);
    }

    // ==============================================================
    //                        TOKEN TRACKING
    // ==============================================================

    function syncOwnedTokens() external {
        require(msg.sender == owner, "Only owner");

        uint256[] memory tokens = AccessFiDataToken(dataToken).getBuyerTokens(owner);

        for (uint256 i = 0; i < tokens.length; i++) {
            if (!_hasOwnedToken[tokens[i]]) {
                ownedDataTokens.push(tokens[i]);
                _hasOwnedToken[tokens[i]] = true;
                emit DataTokenOwned(tokens[i]);
            }
        }
    }

    function syncCreatedTokens() external {
        require(msg.sender == owner, "Only owner");

        uint256[] memory tokens = AccessFiDataToken(dataToken).getSellerTokens(owner);

        for (uint256 i = 0; i < tokens.length; i++) {
            if (!_hasCreatedToken[tokens[i]]) {
                createdDataTokens.push(tokens[i]);
                _hasCreatedToken[tokens[i]] = true;
                emit DataTokenCreated(tokens[i]);
            }
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

    receive() external payable {}
}
