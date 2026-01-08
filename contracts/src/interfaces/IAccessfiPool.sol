// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

interface IAccessfiPool {

    // ==============================================================
    //                            ENUMS
    // ==============================================================

    enum ProofType {
        AGE_VERIFICATION,          // >18 years old
        NATIONALITY,               // Citizenship verification
        EMAIL_VERIFICATION,        // Email-based service subscription
        HACKERHOUSE_INVITATION     // HackerHouse invitation proof
    }

    // ==============================================================
    //                            STRUCTS
    // ==============================================================

    struct VerifiedData {
        string encryptedCID;          // Encrypted data CID (IPFS/Lighthouse)
        bytes32 encryptedDataHash;    // Hash of encrypted data
        bool isEncrypted;             // Whether data is encrypted
        bool isAccessTransferred;     // Whether access transferred to buyer
        uint256 timestamp;            // When data was stored
    }

    struct PoolInfo {
        string name;                  // Pool name
        string description;           // Pool description
        string dataType;              // Type of data being collected
        ProofType[] proofRequirements;// Array of required proof types
        uint256 pricePerData;         // Price per verified data submission
        uint256 totalBudget;          // Total pool budget (after platform fee)
        uint256 remainingBudget;      // Remaining budget
        address creator;              // Pool creator (buyer)
        bool isActive;                // Whether pool is active
        uint256 createdAt;            // Creation timestamp
        uint256 deadline;             // Pool expiration timestamp
    }

    struct VerificationParams {
        uint256 aggregationId;        // zkVerify aggregation ID
        uint256 domainId;             // zkVerify domain ID
        bytes32[] merklePath;         // Merkle proof path
        bytes32 leaf;                 // Proof leaf hash
        uint256 leafCount;            // Number of leaves
        uint256 index;                // Leaf index in tree
    }

    // ==============================================================
    //                            EVENTS
    // ==============================================================

    event PoolCreated(string name, string dataType, uint256 pricePerData, uint256 totalBudget);
    event SellerJoined(address indexed seller);
    event DataPurchased(address indexed buyer, uint256 amount, uint256 dataCount);
    event ProofSubmitted(address indexed seller, ProofType proofType, bool verified);
    event SellerFullyVerified(address indexed seller);
    event DataEncrypted(address indexed seller, string encryptedCID);
    event AccessTransferred(address indexed buyer, address indexed seller, string encryptedCID);
    event DataTokenMinted(address indexed seller, uint256 indexed tokenId);
    event DataTokenTransferred(uint256 indexed tokenId, address indexed buyer);
    event PoolStopped(uint256 remainingBudget);
    event PoolAutoStopped();

    // ==============================================================
    //                        EXTERNAL FUNCTIONS
    // ==============================================================

    function joinPoolAsSeller() external;

    function submitProofAsSeller(
        ProofType _proofType,
        bytes32 _proofHash,
        string calldata encryptedCID,
        bytes32 dataHash,
        VerificationParams calldata zkParams
    ) external;

    function stopPool() external;

    function getBudgetStatus() external view returns (
        uint256 remaining,
        uint256 spent,
        uint256 dataCollected,
        bool active
    );
}
