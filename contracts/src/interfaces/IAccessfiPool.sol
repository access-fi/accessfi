// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

interface IAccessfiPool {
    enum ProofType {
        AGE_VERIFICATION,
        NATIONALITY,
        EMAIL_VERIFICATION,
        HACKERHOUSE_INVITATION
    }

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
        string name;
        string description;
        string dataType;
        ProofType[] proofRequirements;
        uint256 pricePerData;
        uint256 totalBudget;
        uint256 remainingBudget;
        address creator;
        bool isActive;
        uint256 createdAt;
        uint256 deadline;
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
    event ProofSubmitted(address indexed seller, ProofType proofType, bool verified);
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
        ProofType _proofType,
        bytes32 _proofHash,
        string calldata encryptedCID,
        bytes32 dataHash,
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
}
