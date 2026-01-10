// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

import {AccessFiDataToken} from "../src/AccessFiDataToken.sol";
import {FactoryAccessFiPool} from "../src/factories/FactoryAccessFiPool.sol";
import {FactoryUser} from "../src/factories/FactoryUser.sol";
import {verifyProof} from "../src/VerifyProof.sol";

/**
 * @title Deploy
 * @notice Main deployment script for AccessFi protocol with UUPS proxies
 * @dev Deploys all core contracts in correct order with proper initialization
 *
 * Usage:
 *   Local: forge script script/Deploy.s.sol:Deploy --fork-url http://localhost:8545 --broadcast
 *   Testnet: forge script script/Deploy.s.sol:Deploy --rpc-url $SEPOLIA_RPC_URL --broadcast --verify
 *   Mainnet: forge script script/Deploy.s.sol:Deploy --rpc-url $MAINNET_RPC_URL --broadcast --verify --slow
 */
contract Deploy is Script {
    // Deployment addresses (will be set during deployment)
    address public dataTokenProxy;
    address public factoryPoolProxy;
    address public factoryUser;
    address public zkVerifier;

    function run() external {
        // Load environment variables
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        address platformWallet = vm.envOr("PLATFORM_WALLET", deployer); // Default to deployer
        address zkVerifyAddress = vm.envOr("ZK_VERIFY_ADDRESS", address(0));
        bytes32 vkey = vm.envOr("VERIFICATION_KEY", bytes32(0));

        console.log("=== AccessFi Deployment ===");
        console.log("Deployer:", deployer);
        console.log("Platform Wallet:", platformWallet);
        console.log("ZK Verify Address:", zkVerifyAddress);
        console.log("");

        vm.startBroadcast(deployerPrivateKey);

        // ============================================================
        //                    1. Deploy ZK Verifier
        // ============================================================

        console.log("1. Deploying ZK Verifier...");

        if (zkVerifyAddress == address(0)) {
            console.log("   WARNING: ZK_VERIFY_ADDRESS not set, deploying mock verifier");
            // Deploy verifyProof contract (wrapper around zkVerify)
            zkVerifier = address(new verifyProof(address(0), vkey));
        } else {
            zkVerifier = address(new verifyProof(zkVerifyAddress, vkey));
        }

        console.log("   ZK Verifier deployed:", zkVerifier);
        console.log("");

        // ============================================================
        //            2. Deploy AccessFiDataToken (Upgradeable)
        // ============================================================

        console.log("2. Deploying AccessFiDataToken...");

        // Deploy implementation
        AccessFiDataToken dataTokenImpl = new AccessFiDataToken();
        console.log("   Implementation:", address(dataTokenImpl));

        // Prepare initialization data
        bytes memory dataTokenInitData = abi.encodeCall(
            dataTokenImpl.initialize,
            (deployer) // Admin gets all initial roles
        );

        // Deploy proxy
        ERC1967Proxy dataTokenProxyContract = new ERC1967Proxy(
            address(dataTokenImpl),
            dataTokenInitData
        );
        dataTokenProxy = address(dataTokenProxyContract);

        console.log("   Proxy deployed:", dataTokenProxy);
        console.log("");

        // ============================================================
        //        3. Deploy FactoryUser (placeholder)
        // ============================================================

        console.log("3. Deploying FactoryUser (placeholder)...");
        address tempFactory = address(new FactoryUser(address(0), dataTokenProxy));
        console.log("   Temp FactoryUser:", tempFactory);
        console.log("");

        // ============================================================
        //        4. Deploy FactoryAccessFiPool (Upgradeable)
        // ============================================================

        console.log("4. Deploying FactoryAccessFiPool...");
        FactoryAccessFiPool factoryPoolImpl = new FactoryAccessFiPool();
        console.log("   Implementation:", address(factoryPoolImpl));

        bytes memory factoryInitData = abi.encodeCall(
            factoryPoolImpl.initialize,
            (dataTokenProxy, zkVerifier, platformWallet, tempFactory, deployer)
        );

        ERC1967Proxy factoryPoolProxyContract = new ERC1967Proxy(address(factoryPoolImpl), factoryInitData);
        factoryPoolProxy = address(factoryPoolProxyContract);
        console.log("   Proxy:", factoryPoolProxy);
        console.log("");

        // ============================================================
        //        5. Deploy Final FactoryUser & Setup Roles
        // ============================================================

        console.log("5. Deploying final FactoryUser & setting roles...");
        factoryUser = address(new FactoryUser(factoryPoolProxy, dataTokenProxy));
        console.log("   FactoryUser:", factoryUser);

        AccessFiDataToken(dataTokenProxy).grantRole(
            AccessFiDataToken(dataTokenProxy).FACTORY_ROLE(),
            factoryPoolProxy
        );
        console.log("   FACTORY_ROLE granted");
        console.log("");

        vm.stopBroadcast();

        // ============================================================
        //                    6. Deployment Summary
        // ============================================================

        console.log("=== DEPLOYMENT SUMMARY ===");
        console.log("");
        console.log("Core Contracts:");
        console.log("  AccessFiDataToken (Proxy):", dataTokenProxy);
        console.log("  FactoryAccessFiPool (Proxy):", factoryPoolProxy);
        console.log("  FactoryUser:", factoryUser);
        console.log("  ZK Verifier:", zkVerifier);
        console.log("");
        console.log("Admin & Platform:");
        console.log("  Admin:", deployer);
        console.log("  Platform Wallet:", platformWallet);
        console.log("  Platform Fee: 5%");
        console.log("");
        console.log("Next Steps:");
        console.log("  1. Verify contracts on Etherscan");
        console.log("  2. (Optional) Transfer admin roles to multi-sig");
        console.log("  3. Update frontend with deployed addresses");
        console.log("  4. Test end-to-end flows on testnet");
        console.log("");
        console.log("Save these addresses to .env:");
        console.log("  DATA_TOKEN=", dataTokenProxy);
        console.log("  FACTORY_POOL=", factoryPoolProxy);
        console.log("  FACTORY_USER=", factoryUser);
        console.log("  ZK_VERIFIER=", zkVerifier);
    }
}
