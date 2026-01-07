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
    mapping(address => mapping(IAccessfiPool.ProofType => bool)) public sellerProofs;  // Track which proofs user has provided
    mapping(address => bool) public isSellerFullyVerified; // Track if user has all required proofs
    mapping(address => mapping(IAccessfiPool.ProofType => bytes32)) public sellerProofHashes; // Track unique proof hashes per user
    mapping(bytes32 => bool) public globalProofHashes; // Track global proof hashes to prevent duplicates
    mapping(address => VerifiedData) public verifiedSellerData; // Lighthouse encrypted data for each user
    mapping(address => string[]) public buyerAccessibleCIDs; // CIDs buyer can access


    constructor(IAccessfiPool.PoolInfo memory _poolInfo) {
        poolInfo = _poolInfo;
        emit PoolCreated(poolInfo.name, poolInfo.dataType, poolInfo.pricePerData, poolInfo.totalBudget);
    }

    /////////////////////////
    // External Functions///
    ////////////////////////

    function joinPoolAsSeller(address _seller) external override {
        require(_seller != poolInfo.creator && poolInfo.isActive && !isSellerJoined[_seller], "Invalid");
        isSellerJoined[_seller] = true;
        joinedSellers.push(_seller);
        emit SellerJoined(_seller);
    }

    function submitProofAsSeller(address _seller, IAccessfiPool.ProofType _proofType, bytes32 _proofHash) external override {
        require(poolInfo.isActive && isSellerJoined[_seller] && !isSellerFullyVerified[_seller], "Invalid");
        require(!sellerProofs[_seller][_proofType], "Already submitted");
        require(_isValidProofType(_proofType), "Proof type not required by pool");

        // we just generating unique proof hash to prevent reuse
        bytes32 uniqueProofHash = keccak256(abi.encodePacked(_seller, uint8(_proofType), _proofHash, address(this)));
        require(!globalProofHashes[uniqueProofHash], "Proof already used");

        sellerProofs[_seller][_proofType] = true;
        sellerProofHashes[_seller][_proofType] = uniqueProofHash;
        globalProofHashes[uniqueProofHash] = true;

        emit ProofSubmitted(_seller, _proofType, true);
        _checkFullVerification(_seller);
    }

    //////////////////////////
    /// Internal Functions ///
    //////////////////////////

    function _isValidProofType(IAccessfiPool.ProofType _proofType) internal view returns (bool) {
        for (uint256 i = 0; i < poolInfo.proofRequirements.length; i++) {
            if (poolInfo.proofRequirements[i] == _proofType) {
                return true;
            }
        }
        return false;
    }

    function _checkFullVerification(address _seller) internal {
        // Check if seller has submitted all required proofs
        for (uint256 i = 0; i < poolInfo.proofRequirements.length; i++) {
            if (!sellerProofs[_seller][poolInfo.proofRequirements[i]]) {
                return; // Not all proofs submitted yet
            }
        }

        // All proofs submitted
        if (!isSellerFullyVerified[_seller]) {
            isSellerFullyVerified[_seller] = true;
            if (!isSellerVerified[_seller]) {
                isSellerVerified[_seller] = true;
                verifiedSellers.push(_seller);
            }
            emit SellerFullyVerified(_seller);
            _transferPaymentToSeller(_seller);
        }
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
