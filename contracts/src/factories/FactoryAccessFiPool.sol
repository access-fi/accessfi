// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {IAccessfiPool} from "../interfaces/IAccessfiPool.sol";
import {AccessFiPool} from "../AccessfiPool.sol";

contract FactoryAccessFiPool {
    
    address[] public accessFiPools;

    function createAccessFiPool(IAccessfiPool.PoolInfo memory _poolInfo) external  returns (IAccessfiPool){
        AccessFiPool accessFiPool = new AccessFiPool(_poolInfo);
        accessFiPools.push(address(accessFiPool));
        return accessFiPool;
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
}