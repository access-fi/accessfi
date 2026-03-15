// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

import {AccessFiDataToken} from "../src/AccessFiDataToken.sol";
import {AssetRegistry} from "../src/AssetRegistry.sol";
import {FactoryAccessFiPool} from "../src/factories/FactoryAccessFiPool.sol";
import {FactoryUser} from "../src/factories/FactoryUser.sol";
import {verifyProof} from "../src/VerifyProof.sol";

contract DeployRegistryFlow is Script {
    address public legacyDataToken;
    address public assetRegistry;
    address public factoryPoolProxy;
    address public factoryUser;
    address public zkVerifier;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        address platformWallet = vm.envOr("PLATFORM_WALLET", deployer);
        address zkVerifyAddress = 0xEA0A0f1EfB1088F4ff0Def03741Cb2C64F89361E;

        console.log("=== AccessFi Registry Deployment ===");
        console.log("Deployer:", deployer);
        console.log("Platform Wallet:", platformWallet);
        console.log("ZK Verify Address:", zkVerifyAddress);
        console.log("");

        vm.startBroadcast(deployerPrivateKey);

        console.log("1. Deploying ZK verifier wrapper...");
        zkVerifier = address(new verifyProof(zkVerifyAddress));
        console.log("   ZK Verifier:", zkVerifier);
        console.log("");

        console.log("2. Deploying legacy AccessFiDataToken (compat only)...");
        AccessFiDataToken legacyTokenImpl = new AccessFiDataToken();
        bytes memory legacyTokenInitData = abi.encodeCall(legacyTokenImpl.initialize, (deployer));
        legacyDataToken = address(new ERC1967Proxy(address(legacyTokenImpl), legacyTokenInitData));
        console.log("   Legacy Data Token:", legacyDataToken);
        console.log("");

        console.log("3. Deploying AssetRegistry...");
        assetRegistry = address(new AssetRegistry(deployer, platformWallet));
        console.log("   AssetRegistry:", assetRegistry);
        console.log("");

        console.log("4. Deploying temporary FactoryUser for pool factory init...");
        address tempFactoryUser = address(new FactoryUser(address(0), assetRegistry));
        console.log("   Temp FactoryUser:", tempFactoryUser);
        console.log("");

        console.log("5. Deploying FactoryAccessFiPool proxy...");
        FactoryAccessFiPool factoryPoolImpl = new FactoryAccessFiPool();
        bytes memory factoryInitData = abi.encodeCall(
            factoryPoolImpl.initialize,
            (assetRegistry, zkVerifier, platformWallet, tempFactoryUser, deployer)
        );
        factoryPoolProxy = address(new ERC1967Proxy(address(factoryPoolImpl), factoryInitData));
        console.log("   Factory Pool Proxy:", factoryPoolProxy);
        console.log("");

        console.log("6. Deploying final FactoryUser...");
        factoryUser = address(new FactoryUser(factoryPoolProxy, assetRegistry));
        console.log("   FactoryUser:", factoryUser);
        console.log("");

        console.log("7. Wiring registry + pool factory...");
        FactoryAccessFiPool(payable(factoryPoolProxy)).setFactoryUser(factoryUser);
        AssetRegistry(assetRegistry).setFactoryUser(factoryUser);
        AssetRegistry(assetRegistry).setPoolFactory(factoryPoolProxy);
        console.log("   Wiring complete");
        console.log("");

        vm.stopBroadcast();

        console.log("=== DEPLOYMENT SUMMARY ===");
        console.log("LEGACY_DATA_TOKEN=", legacyDataToken);
        console.log("ASSET_REGISTRY=", assetRegistry);
        console.log("FACTORY_POOL=", factoryPoolProxy);
        console.log("FACTORY_USER=", factoryUser);
        console.log("ZK_VERIFIER=", zkVerifier);
    }
}
