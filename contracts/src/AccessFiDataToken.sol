// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";

/**
 * @title AccessFiDataToken
 * @notice Global ERC721 token contract for verified seller data across all AccessFi pools
 * @dev Implements UUPS upgradeability pattern with role-based access control
 */
contract AccessFiDataToken is
    Initializable,
    ERC721Upgradeable,
    UUPSUpgradeable,
    AccessControlUpgradeable,
    ReentrancyGuardUpgradeable
{
    // ==============================================================
    //                            ROLES
    // ==============================================================

    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    bytes32 public constant FACTORY_ROLE = keccak256("FACTORY_ROLE");

    // ==============================================================
    //                            STORAGE
    // ==============================================================

    struct TokenMetadata {
        string encryptedCID;      // IPFS/Lighthouse CID for encrypted data
        bytes32 dataHash;         // Hash of encrypted data for integrity
        address seller;           // Original data provider
        address pool;             // Pool that minted this token
        uint256 mintedAt;         // Timestamp of minting
        bool transferred;         // Whether token has been transferred to buyer
    }

    uint256 private _tokenIdCounter;

    mapping(uint256 => TokenMetadata) public tokenMetadata;
    mapping(address => bool) public authorizedPools;
    mapping(address => uint256[]) public sellerTokens;
    mapping(address => uint256[]) public buyerTokens;
    mapping(bytes32 => bool) public usedDataHashes;

    // Duplicate tracking for buyer tokens
    mapping(uint256 => mapping(address => bool)) private _buyerHasToken;

    // Storage gap for future upgrades
    uint256[43] private __gap;

    // ==============================================================
    //                            EVENTS
    // ==============================================================

    event PoolAuthorized(address indexed pool);
    event PoolRevoked(address indexed pool);
    event TokenMinted(uint256 indexed tokenId, address indexed seller, address indexed pool);
    event TokenTransferred(uint256 indexed tokenId, address indexed from, address indexed to);

    // ==============================================================
    //                            ERRORS
    // ==============================================================

    error OnlyFactory();
    error OnlyAuthorizedPool();
    error DuplicateData();
    error InvalidMetadata();

    // ==============================================================
    //                            CONSTRUCTOR
    // ==============================================================

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    // ==============================================================
    //                            INITIALIZER
    // ==============================================================

    /**
     * @notice Initialize the contract (replaces constructor for upgradeable pattern)
     * @param admin Address that receives all initial roles
     */
    function initialize(address admin) public initializer {
        __ERC721_init("AccessFi Data Token", "AFDT");
        __UUPSUpgradeable_init();
        __AccessControl_init();
        __ReentrancyGuard_init();

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(UPGRADER_ROLE, admin);
        _grantRole(FACTORY_ROLE, admin);
    }

    // ==============================================================
    //                            MODIFIERS
    // ==============================================================

    modifier onlyFactory() {
        if (!hasRole(FACTORY_ROLE, msg.sender)) revert OnlyFactory();
        _;
    }

    modifier onlyAuthorizedPool() {
        if (!authorizedPools[msg.sender]) revert OnlyAuthorizedPool();
        _;
    }

    // ==============================================================
    //                        POOL AUTHORIZATION
    // ==============================================================

    /**
     * @notice Authorize a pool to mint tokens (called by factory)
     * @param pool Address of pool to authorize
     */
    function authorizePool(address pool) external onlyFactory {
        authorizedPools[pool] = true;
        emit PoolAuthorized(pool);
    }

    /**
     * @notice Revoke pool authorization
     * @param pool Address of pool to revoke
     */
    function revokePool(address pool) external onlyFactory {
        authorizedPools[pool] = false;
        emit PoolRevoked(pool);
    }

    // ==============================================================
    //                        TOKEN MINTING
    // ==============================================================

    /**
     * @notice Mint token to seller (called by authorized pool)
     * @param seller Address of verified seller
     * @param encryptedCID IPFS/Lighthouse CID of encrypted data
     * @param dataHash Hash of encrypted data
     * @return tokenId The minted token ID
     */
    function mintToSeller(
        address seller,
        string calldata encryptedCID,
        bytes32 dataHash
    ) external onlyAuthorizedPool nonReentrant returns (uint256) {
        // encryptedCID is optional (can be empty for proof-only pools)
        if (usedDataHashes[dataHash]) revert DuplicateData();

        uint256 tokenId = ++_tokenIdCounter;

        _safeMint(seller, tokenId);

        tokenMetadata[tokenId] = TokenMetadata({
            encryptedCID: encryptedCID,
            dataHash: dataHash,
            seller: seller,
            pool: msg.sender,
            mintedAt: block.timestamp,
            transferred: false
        });

        sellerTokens[seller].push(tokenId);
        usedDataHashes[dataHash] = true;

        emit TokenMinted(tokenId, seller, msg.sender);
        return tokenId;
    }

    // ==============================================================
    //                        TOKEN TRANSFER
    // ==============================================================

    /**
     * @notice Transfer token to buyer (called by pool after payment)
     * @param tokenId ID of token to transfer
     * @param buyer Address of buyer
     */
    function transferToBuyer(uint256 tokenId, address buyer)
        external
        onlyAuthorizedPool
        nonReentrant
    {
        address currentOwner = ownerOf(tokenId);
        _transfer(currentOwner, buyer, tokenId);

        if (!tokenMetadata[tokenId].transferred) {
            tokenMetadata[tokenId].transferred = true;
        }

        // PROTECTION: Only add if not already in buyer's list
        if (!_buyerHasToken[tokenId][buyer]) {
            buyerTokens[buyer].push(tokenId);
            _buyerHasToken[tokenId][buyer] = true;
        }

        emit TokenTransferred(tokenId, currentOwner, buyer);
    }

    // ==============================================================
    //                        VIEW FUNCTIONS
    // ==============================================================

    /**
     * @notice Get all token IDs created by a seller
     * @param seller Address of seller
     * @return Array of token IDs
     */
    function getSellerTokens(address seller) external view returns (uint256[] memory) {
        return sellerTokens[seller];
    }

    /**
     * @notice Get all token IDs owned by a buyer
     * @param buyer Address of buyer
     * @return Array of token IDs
     */
    function getBuyerTokens(address buyer) external view returns (uint256[] memory) {
        return buyerTokens[buyer];
    }

    /**
     * @notice Get total number of tokens minted
     * @return Total supply
     */
    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter;
    }

    // ==============================================================
    //                        UPGRADE AUTHORIZATION
    // ==============================================================

    /**
     * @notice Authorize upgrade (only UPGRADER_ROLE can upgrade)
     * @param newImplementation Address of new implementation
     */
    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyRole(UPGRADER_ROLE)
    {}

    // ==============================================================
    //                        REQUIRED OVERRIDES
    // ==============================================================

    /**
     * @notice Check if contract supports an interface
     * @param interfaceId Interface identifier
     * @return bool True if supported
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721Upgradeable, AccessControlUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
