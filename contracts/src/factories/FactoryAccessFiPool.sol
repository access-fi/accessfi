// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {IAccessfiPool} from "../interfaces/IAccessfiPool.sol";
import {AccessFiPool} from "../AccessfiPool.sol";

contract FactoryAccessFiPool {

    address[] public accessFiPools;
    mapping(address => address[]) public creatorPools;

    // Custom errors
    error InvalidPrice();
    error InvalidBudget();
    error InvalidDeadline();

    event PoolCreated(address indexed creator, address indexed poolAddress, string name);

    function createAccessFiPool(IAccessfiPool.PoolInfo memory _poolInfo) external payable returns (address) {
        if (_poolInfo.pricePerData <= 0) revert InvalidPrice();
        if (_poolInfo.totalBudget <= 0) revert InvalidBudget();
        if (_poolInfo.deadline <= block.timestamp) revert InvalidDeadline();

        address poolAddress = address(new AccessFiPool(_poolInfo));
        accessFiPools.push(poolAddress);
        creatorPools[_poolInfo.creator].push(poolAddress);

        // Forward the ETH to the pool
        if (msg.value > 0) {
            (bool success, ) = payable(poolAddress).call{value: msg.value}("");
            require(success, "Failed to send ETH to pool");
        }
        emit PoolCreated(_poolInfo.creator, poolAddress, _poolInfo.name);
        return poolAddress;

    }

    function joinAccessFiPool(address _poolAddress) external {
        IAccessfiPool accessFiPool = IAccessfiPool(_poolAddress);
        accessFiPool.joinPoolAsSeller(msg.sender);
    }

    function submitProofAsSeller(address _poolAddress, IAccessfiPool.ProofType _proofType, bytes32 _proofHash) external {
        IAccessfiPool accessFiPool = IAccessfiPool(_poolAddress);
        accessFiPool.submitProofAsSeller(msg.sender, _proofType, _proofHash);
    }

    function getAccessFiPools() external view returns (address[] memory) {
        return accessFiPools;
    }

    function getAccessFiPool(uint256 _index) external view returns (IAccessfiPool) {
        require(_index < accessFiPools.length, "Invalid index");
        return IAccessfiPool(accessFiPools[_index]);
    }

    function getAccessFiPoolCount() external view returns (uint256) {
        return accessFiPools.length;
    }

    function getCreatorPools(address _creator) external view returns (address[] memory) {
        return creatorPools[_creator];
    }
}