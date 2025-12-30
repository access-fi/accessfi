// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {IAccessfiPool} from "./interfaces/IAccessfiPool.sol";

contract AccessFiPool is IAccessfiPool {

    IAccessfiPool.PoolInfo public poolInfo;

    uint256 public totalDataCollected;

    address[] public joinedSellers;
    address[] public verifiedSellers;

    mapping(address => bool) public isSellerJoined;
    mapping(address => bool) public isSellerVerified;
    mapping(address => mapping(string => bool)) public sellerProofs;  // Track which proofs user has provided
    mapping(address => bool) public isSellerFullyVerified; // Track if user has all required proofs
    mapping(address => mapping(string => bytes32)) public sellerProofHashes; // Track unique proof hashes per user
    mapping(bytes32 => bool) public globalProofHashes; // Track global proof hashes to prevent duplicates
    mapping(address => VerifiedData) public verifiedSellerData; // Lighthouse encrypted data for each user
    mapping(address => string[]) public buyerAccessibleCIDs; // CIDs buyer can access


    constructor(IAccessfiPool.PoolInfo memory _poolInfo) {
        poolInfo = _poolInfo;
        emit PoolCreated(poolInfo.name, poolInfo.dataType, poolInfo.pricePerData, poolInfo.totalBudget);
    }

    // External Functions

    function joinPoolAsSeller(address _seller) external override {
        require(_seller != poolInfo.creator && poolInfo.isActive && !isSellerJoined[_seller], "Invalid");
        isSellerJoined[_seller] = true;
        joinedSellers.push(_seller);
        emit SellerJoined(_seller);
    }

    function submitProofAsSeller(address _seller, string memory _proofName, bytes32 _proofHash) external override {
        require(poolInfo.isActive && isSellerJoined[_seller] && !isSellerFullyVerified[_seller], "Invalid");
        require(!sellerProofs[_seller][_proofName], "Already submitted");

        // we just generating unique proof hash to prevent reuse
        bytes32 uniqueProofHash = keccak256(abi.encodePacked(_seller, _proofName, _proofHash, address(this)));
        require(!globalProofHashes[uniqueProofHash], "Proof already used");

        sellerProofs[_seller][_proofName] = true;
        sellerProofHashes[_seller][_proofName] = uniqueProofHash;
        globalProofHashes[uniqueProofHash] = true;

        emit ProofSubmitted(_seller, _proofName, true);
        _checkFullVerification(_seller);
    }


    //////////////////////////
    /// Internal Functions ///
    //////////////////////////

    function _checkFullVerification(address _seller) internal {
        if (!isSellerFullyVerified[_seller]) {
            isSellerFullyVerified[_seller] = true;
            if (!isSellerVerified[_seller]) {
                isSellerVerified[_seller] = true;
                verifiedSellers.push(_seller);
            }
        }
        emit SellerFullyVerified(_seller);
        _transferPaymentToSeller(_seller);
    }

    function _transferPaymentToSeller(address _seller) internal {
        if (poolInfo.remainingBudget >= poolInfo.pricePerData) {
            poolInfo.remainingBudget -= poolInfo.pricePerData;
            totalDataCollected += 1;
            (bool success, ) = payable(_seller).call{value: poolInfo.pricePerData}("");
            require(success, "Payment failed");
            emit DataPurchased(poolInfo.creator, poolInfo.pricePerData, 1);

            // Auto-transfer access if data is encrypted
            if (verifiedSellerData[_seller].isEncrypted && !verifiedSellerData[_seller].isAccessTransferred) {
                verifiedSellerData[_seller].isAccessTransferred = true;
                buyerAccessibleCIDs[poolInfo.creator].push(verifiedSellerData[_seller].encryptedCID);
                emit AccessTransferred(poolInfo.creator, _seller, verifiedSellerData[_seller].encryptedCID);
            }
        }
    }


}
