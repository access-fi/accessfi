/**
 * Contract ABIs for AccessFi Protocol
 * Auto-generated from compiled Solidity contracts
 */

import FactoryUserABI from './FactoryUser.abi.json';
import UserABI from './User.abi.json';
import FactoryAccessFiPoolABI from './FactoryAccessFiPool.abi.json';
import AccessFiPoolABI from './AccessFiPool.abi.json';
import AccessFiDataTokenABI from './AccessFiDataToken.abi.json';
import AssetRegistryABI from './AssetRegistry.abi.json';

export const ABIS = {
  FactoryUser: FactoryUserABI,
  User: UserABI,
  FactoryAccessFiPool: FactoryAccessFiPoolABI,
  AccessFiPool: AccessFiPoolABI,
  AccessFiDataToken: AccessFiDataTokenABI,
  AssetRegistry: AssetRegistryABI,
} as const;

// Export individual ABIs for convenience
export { FactoryUserABI, UserABI, FactoryAccessFiPoolABI, AccessFiPoolABI, AccessFiDataTokenABI, AssetRegistryABI };

// Export with lowercase names for wagmi hooks compatibility
export const factoryUserAbi = FactoryUserABI;
export const userAbi = UserABI;
export const factoryAccessFiPoolAbi = FactoryAccessFiPoolABI;
export const accessFiPoolAbi = AccessFiPoolABI;
export const accessFiDataTokenAbi = AccessFiDataTokenABI;
export const assetRegistryAbi = AssetRegistryABI;
