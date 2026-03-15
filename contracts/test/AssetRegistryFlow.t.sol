// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Test} from "forge-std/Test.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

import {AssetRegistry} from "../src/AssetRegistry.sol";
import {FactoryAccessFiPool} from "../src/factories/FactoryAccessFiPool.sol";
import {FactoryUser} from "../src/factories/FactoryUser.sol";
import {IAssetRegistry} from "../src/interfaces/IAssetRegistry.sol";
import {IAccessfiPool} from "../src/interfaces/IAccessfiPool.sol";
import {User} from "../src/User.sol";
import {verifyProof} from "../src/VerifyProof.sol";

contract MockAggregationVerifier {
    function verifyProofAggregation(
        uint256,
        uint256,
        bytes32,
        bytes32[] calldata,
        uint256,
        uint256
    ) external pure returns (bool) {
        return true;
    }
}

contract AssetRegistryFlowTest is Test {
    AssetRegistry internal registry;
    FactoryAccessFiPool internal poolFactory;
    FactoryUser internal userFactory;
    verifyProof internal verifier;

    address internal admin = address(0xA11CE);
    address internal platform = address(0xBEEF);
    address internal buyer = address(0x1001);
    address internal seller = address(0x1002);
    address internal secondBuyer = address(0x1003);

    function setUp() external {
        vm.deal(admin, 100 ether);
        vm.deal(buyer, 100 ether);
        vm.deal(seller, 100 ether);
        vm.deal(secondBuyer, 100 ether);

        vm.startPrank(admin);
        registry = new AssetRegistry(admin, platform);
        verifier = new verifyProof(address(new MockAggregationVerifier()));

        FactoryUser tempFactory = new FactoryUser(address(0), address(registry));

        FactoryAccessFiPool poolFactoryImpl = new FactoryAccessFiPool();
        bytes memory initData = abi.encodeCall(
            poolFactoryImpl.initialize,
            (address(registry), address(verifier), platform, address(tempFactory), admin)
        );
        poolFactory = FactoryAccessFiPool(payable(address(new ERC1967Proxy(address(poolFactoryImpl), initData))));

        userFactory = new FactoryUser(address(poolFactory), address(registry));
        poolFactory.setFactoryUser(address(userFactory));
        registry.setFactoryUser(address(userFactory));
        registry.setPoolFactory(address(poolFactory));
        vm.stopPrank();

        vm.prank(buyer);
        userFactory.createUser();
        vm.prank(seller);
        userFactory.createUser();
        vm.prank(secondBuyer);
        userFactory.createUser();
    }

    function testPoolFulfillmentRegistersAssetAndGrantsBuyerAccess() external {
        (address buyerUser, address sellerUser, address poolAddress, bytes32 assetId) =
            _createVerifiedAsset("prime_email", "cid-prime-1", keccak256("proof-1"), keccak256("encrypted-data-1"), IAccessfiPool.ResalePolicy.OPEN_RESALE, 5 ether);

        assertTrue(registry.hasAccess(assetId, buyer));
        assertEq(User(payable(buyerUser)).getPurchasedAssetsCount(), 1);
        assertEq(User(payable(sellerUser)).getProvidedAssetsCount(), 1);

        (uint256 remaining,,,) = IAccessfiPool(poolAddress).getBudgetStatus();
        assertEq(remaining, 4 ether);
    }

    function testInventoryPurchaseFlowsThroughUserContract() external {
        _createVerifiedAsset("prime_email", "cid-prime-1", keccak256("proof-1"), keccak256("encrypted-data-1"), IAccessfiPool.ResalePolicy.OPEN_RESALE, 5 ether);

        address secondBuyerUser = userFactory.getUser(secondBuyer);
        bytes32 assetId = _computeAssetId(seller, "zkemail:prime_email@v1", "prime_email");

        uint256 sellerBalanceBefore = seller.balance;
        uint256 platformBalanceBefore = platform.balance;

        vm.prank(secondBuyer);
        User(payable(secondBuyerUser)).buyAsset{value: 1 ether}(assetId);

        assertTrue(registry.hasAccess(assetId, secondBuyer));
        assertEq(User(payable(secondBuyerUser)).getPurchasedAssetsCount(), 1);
        assertEq(seller.balance, sellerBalanceBefore + 0.95 ether);
        assertEq(platform.balance, platformBalanceBefore + 0.05 ether);
    }

    function testExclusiveAssetCannotBeListedAgain() external {
        bytes32 dataHash = keccak256("encrypted-exclusive");
        _createVerifiedAsset("exclusive_email", "cid-exclusive", keccak256("proof-exclusive"), dataHash, IAccessfiPool.ResalePolicy.EXCLUSIVE, 2 ether);
        bytes32 assetId = _computeAssetId(seller, "zkemail:exclusive_email@v1", "exclusive_email");
        IAssetRegistry.Asset memory asset = registry.getAsset(assetId);
        assertFalse(asset.isListed);
    }

    function _createVerifiedAsset(
        string memory dataType,
        string memory encryptedCid,
        bytes32 proofHash,
        bytes32 dataHash,
        IAccessfiPool.ResalePolicy resalePolicy,
        uint256 budget
    ) internal returns (address buyerUser, address sellerUser, address poolAddress, bytes32 assetId) {
        buyerUser = userFactory.getUser(buyer);
        sellerUser = userFactory.getUser(seller);

        bytes32[] memory proofRequirements = new bytes32[](1);
        string memory proofTypeId = string.concat("zkemail:", dataType, "@v1");
        proofRequirements[0] = keccak256(bytes(proofTypeId));

        IAccessfiPool.PoolInfo memory info = IAccessfiPool.PoolInfo({
            name: dataType,
            description: "test pool",
            dataType: dataType,
            proofRequirements: proofRequirements,
            pricePerData: 1 ether,
            totalBudget: budget,
            remainingBudget: 0,
            creator: buyer,
            isActive: true,
            createdAt: block.timestamp,
            deadline: block.timestamp + 7 days
        });

        vm.prank(buyer);
        User(payable(buyerUser)).createPool{value: budget}(info);
        poolAddress = User(payable(buyerUser)).getCreatedPools()[User(payable(buyerUser)).getCreatedPoolsCount() - 1];

        vm.prank(seller);
        User(payable(sellerUser)).joinPool(poolAddress);

        IAccessfiPool.VerificationParams memory params = IAccessfiPool.VerificationParams({
            aggregationId: 1,
            domainId: 175,
            merklePath: new bytes32[](0),
            leaf: proofHash,
            leafCount: 1,
            index: 0
        });

        vm.prank(seller);
        User(payable(sellerUser)).submitProofAsSeller(
            poolAddress,
            proofRequirements[0],
            proofHash,
            encryptedCid,
            dataHash,
            _computeAssetId(seller, proofTypeId, dataType),
            params,
            resalePolicy
        );

        assetId = _computeAssetId(seller, proofTypeId, dataType);
    }

    function _computeAssetId(address sellerAddress, string memory proofTypeId, string memory normalizedKey)
        internal
        pure
        returns (bytes32)
    {
        return keccak256(bytes(string.concat(_toLowerHexString(sellerAddress), "::", proofTypeId, "::", normalizedKey)));
    }

    function _toLowerHexString(address account) internal pure returns (string memory) {
        bytes memory alphabet = "0123456789abcdef";
        bytes20 value = bytes20(account);
        bytes memory str = new bytes(42);
        str[0] = "0";
        str[1] = "x";

        for (uint256 i = 0; i < 20; i++) {
            str[2 + i * 2] = alphabet[uint8(value[i] >> 4)];
            str[3 + i * 2] = alphabet[uint8(value[i] & 0x0f)];
        }

        return string(str);
    }
}
