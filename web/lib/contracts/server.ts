import { createPublicClient, http } from 'viem';
import AssetRegistryABI from './AssetRegistry.abi.json';
import { getContractAddresses } from './addresses';

export function getRpcUrl(chainId: number): string {
  const rpcUrl =
    process.env[`RPC_URL_${chainId}`] ||
    process.env.TEE_RPC_URL ||
    process.env.NEXT_PUBLIC_RPC_URL;

  if (!rpcUrl) {
    throw new Error(`RPC URL not configured for chain ${chainId}`);
  }

  return rpcUrl;
}

export function getAssetRegistryConfig(chainId: number) {
  const addresses = getContractAddresses(chainId);
  const registryAddress = addresses?.ASSET_REGISTRY;
  if (!registryAddress) {
    throw new Error(`Asset registry not configured for chain ${chainId}`);
  }

  return {
    address: registryAddress as `0x${string}`,
    abi: AssetRegistryABI,
  };
}

export function getServerPublicClient(chainId: number) {
  return createPublicClient({
    transport: http(getRpcUrl(chainId)),
  });
}
