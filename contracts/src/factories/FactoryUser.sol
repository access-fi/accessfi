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
    address public immutable assetRegistry;

    event UserCreated(address indexed wallet, address indexed userContract);

    constructor(address _poolFactory, address _assetRegistry) {
        poolFactory = _poolFactory;
        assetRegistry = _assetRegistry;
    }

    function createUser() external {
        require(users[msg.sender] == address(0), "User exists");
        require(msg.sender == tx.origin, "Only EOAs can create User contracts");

        User newUser = new User(msg.sender, poolFactory, assetRegistry);
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
