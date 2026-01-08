// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {User} from "../User.sol";

/**
 * @title FactoryUser
 * @notice Factory for creating User contracts
 */
contract FactoryUser {
    mapping(address => address) public users;
    address[] public allUsers;

    address public immutable poolFactory;
    address public immutable dataToken;

    event UserCreated(address indexed wallet, address indexed userContract);

    constructor(address _poolFactory, address _dataToken) {
        poolFactory = _poolFactory;
        dataToken = _dataToken;
    }

    function createUser() external {
        require(users[msg.sender] == address(0), "User exists");

        User newUser = new User(msg.sender, poolFactory, dataToken);
        users[msg.sender] = address(newUser);
        allUsers.push(address(newUser));

        emit UserCreated(msg.sender, address(newUser));
    }

    function getUser(address _wallet) external view returns (address) {
        return users[_wallet];
    }

    function userExists(address _wallet) external view returns (bool) {
        return users[_wallet] != address(0);
    }

    function getAllUsers() external view returns (address[] memory) {
        return allUsers;
    }

    function getTotalUsers() external view returns (uint256) {
        return allUsers.length;
    }
}
