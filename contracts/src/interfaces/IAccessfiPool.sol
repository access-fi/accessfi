// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

interface IAccessfiPool {

    enum ResalePolicy {
        EXCLUSIVE,
        LIMITED_RESALE,
        OPEN_RESALE
    }

    struct VerifiedData {
        string encryptedCID;
        bytes32 encryptedDataHash;
        bool isEncrypted;
        bool isAccessTransferred;
        uint256 timestamp;
        bytes32 assetId;
        ResalePolicy resalePolicy;
    }

    struct PoolInfo {
        string name;                  // Pool name
        string description;           // Pool description
        string dataType;              // Type of data being collected
        bytes32[] proofRequirements;  // Array of required proof type IDs
        uint256 pricePerData;         // Price per verified data submission
        uint256 totalBudget;          // Total pool budget (after platform fee)
        uint256 remainingBudget;      // Remaining budget
        address creator;              // Pool creator (buyer)
        bool isActive;                // Whether pool is active
        uint256 createdAt;            // Creation timestamp
        uint256 deadline;             // Pool expiration timestamp
    }

    struct VerificationParams {
        uint256 aggregationId;
        uint256 domainId;
        bytes32[] merklePath;
        bytes32 leaf;
        uint256 leafCount;
        uint256 index;
    }

    event PoolCreated(string name, string dataType, uint256 pricePerData, uint256 totalBudget);
    event SellerJoined(address indexed seller);
    event DataPurchased(address indexed buyer, uint256 amount, uint256 dataCount);
    event ProofSubmitted(address indexed seller, bytes32 proofTypeId, bool verified);
    event SellerFullyVerified(address indexed seller);
    event DataEncrypted(address indexed seller, string encryptedCID);
    event AccessTransferred(address indexed buyer, address indexed seller, string encryptedCID);
    event PoolStopped(uint256 remainingBudget);
    event PoolAutoStopped();
    event SellerPaid(address indexed seller, uint256 amount);
    event PoolFunded(address indexed funder, uint256 totalAmount, uint256 netAmount, uint256 platformFee, uint256 newBudget);
    event AssetRegistered(address indexed seller, bytes32 indexed assetId, ResalePolicy resalePolicy, bool listed);

    function joinPoolAsSeller() external;

    function submitProofAsSeller(
        bytes32 _proofTypeId,
        bytes32 _proofHash,
        string calldata encryptedCID,
        bytes32 dataHash,
        bytes32 assetId,
        VerificationParams calldata zkParams,
        ResalePolicy resalePolicy
    ) external;

    function stopPool() external;

    function getBudgetStatus() external view returns (
        uint256 remaining,
        uint256 spent,
        uint256 dataCollected,
        bool active
    );

    function getProofRequirements() external view returns (bytes32[] memory);
}
