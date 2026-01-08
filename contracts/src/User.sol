// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {FactoryAccessFiPool as Factory } from "./factories/FactoryAccessFiPool.sol";
import {IAccessfiPool} from "./interfaces/IAccessfiPool.sol";

contract User {

    address public owner;
    address public poolFactory;
    address[] public createdPools;
    address[] public joinedPools;

    uint256 public totalSpent;
    uint256 public totalEarned;

    Factory public factory;

    event PoolCreated(address indexed poolAddress);
    event PoolJoined(address indexed poolAddress);

    constructor(address _owner, address _poolFactory) {
        owner = _owner;
        poolFactory = _poolFactory;
        factory = Factory(poolFactory);
    }

    function createPool(IAccessfiPool.PoolInfo memory _poolInfo) external {
        require(msg.sender == owner, "Only owner can create pools");
        address poolAddress = factory.createAccessFiPool{value: msg.value}(_poolInfo);
        createdPools.push(poolAddress);
        emit PoolCreated(poolAddress);
    }

    function joinPool(address _poolAddress) external {
        require(msg.sender == owner, "Only owner can join pools");
        factory.joinAccessFiPool(_poolAddress);
        joinedPools.push(_poolAddress);
        emit PoolJoined(_poolAddress);
    }

    function submitProofAsSeller(address _poolAddress, IAccessfiPool.ProofType _proofType, bytes32 _proofHash) external {
        require(msg.sender == owner, "Only owner can submit proofs");
        factory.submitProofAsSeller(_poolAddress, _proofType, _proofHash);
    }

    function recordSpending(uint256 _amount) external {
        totalSpent += _amount;
    }

    function recordEarning(uint256 _amount) external {
        totalEarned += _amount;
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