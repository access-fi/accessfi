/**
 * AccessFi Smart Contract Addresses
 * Network: Base Sepolia
 *
 * Update these addresses after deployment
 */

export const CONTRACT_ADDRESSES = {
  // Base Sepolia (Chain ID: 84532)
  84532: {
    DATA_TOKEN: process.env.NEXT_PUBLIC_DATA_TOKEN_ADDRESS || '',
    FACTORY_POOL: process.env.NEXT_PUBLIC_FACTORY_POOL_ADDRESS || '',
    FACTORY_USER: process.env.NEXT_PUBLIC_FACTORY_USER_ADDRESS || '',
    ZK_VERIFIER: process.env.NEXT_PUBLIC_ZK_VERIFIER_ADDRESS || '',
  },
  // Localhost (Chain ID: 31337) - for Anvil testing
  31337: {
    DATA_TOKEN: '',
    FACTORY_POOL: '',
    FACTORY_USER: '',
    ZK_VERIFIER: '',
  },
} as const;

export type SupportedChainId = keyof typeof CONTRACT_ADDRESSES;

export function getContractAddresses(chainId: number) {
  const addresses = CONTRACT_ADDRESSES[chainId as SupportedChainId];

  if (!addresses) {
    throw new Error(`Unsupported chain ID: ${chainId}. Supported chains: ${Object.keys(CONTRACT_ADDRESSES).join(', ')}`);
  }

  return addresses;
}

export function isChainSupported(chainId: number): chainId is SupportedChainId {
  return chainId in CONTRACT_ADDRESSES;
}
