// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

contract IAccessfiPool {
    
    enum ProofType {
        AGE_VERIFICATION,    // >18 years old
        NATIONALITY,          // Indian citizen
        EMAIL_VERIFICATION,       // Netflix subscription via .eml file
        HACKERHOUSE_INVITATION   // HackerHouse invitation
    }

    struct ProofRequirement {
        string name;
        string description;
        ProofType proofType;
        bool isRequired;
    }

    struct VerifiedData {
        string encryptedCID;        // encrypted data ID
        bytes32 encryptedDataHash; // encrypted data hash
        bool isEncrypted;          // Whether data is encrypted and stored
        bool isAccessTransferred;   // Whether access was given to buyer
        uint256 timestamp;         // Data storage timestamp
    }

    struct PoolInfo {
        string name;
        string description;
        string dataType;
        ProofRequirement[] proofRequirements;
        uint256 pricePerData;
        uint256 totalBudget;
        uint256 remainingBudget;
        address creator;
        bool isActive;
        uint256 createdAt;
        uint256 deadline;
    }

    event PoolCreated(string name, string dataType, uint256 pricePerData, uint256 totalBudget);
    event SellerJoined(address indexed seller);
    event DataPurchased(address indexed buyer, uint256 amount, uint256 dataCount);
    event ProofSubmitted(address indexed seller, string proofName, bool verified);
    event SellerFullyVerified(address indexed seller);
    event DataEncrypted(address indexed seller, string encryptedCID);
    event AccessTransferred(address indexed buyer, address indexed seller, string encryptedCID);

    function joinPoolAsSeller(address _seller) external {}
    function submitProofAsSeller(address _seller, string memory _proofName, bytes32 _proofHash) external {}
    function verifySeller(address _seller, bool _verified, bytes32) external {}
    function storeEncryptedData(string memory _encryptedCID, bytes32 _encryptedDataHash) external {}
    function transferAccessToBuyer() external {}

}