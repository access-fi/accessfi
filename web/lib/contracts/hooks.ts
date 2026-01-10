/**
 * Wagmi Contract Hooks for AccessFi Protocol
 * Typed hooks for interacting with smart contracts
 */

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useAccount } from 'wagmi';
import { getContractAddresses } from './addresses';
import { FactoryUserABI, UserABI, FactoryAccessFiPoolABI, AccessFiPoolABI, AccessFiDataTokenABI } from './abis';
import type { PoolInfo, VerificationParams, ProofType } from './types';

// ============================================================
//                    FACTORY USER HOOKS
// ============================================================

export function useFactoryUser() {
  const { chainId } = useAccount();
  const addresses = chainId ? getContractAddresses(chainId) : null;

  return {
    address: addresses?.FACTORY_USER as `0x${string}`,
    abi: FactoryUserABI,
  };
}

export function useGetUserContract(walletAddress?: `0x${string}`) {
  const factory = useFactoryUser();

  return useReadContract({
    address: factory.address,
    abi: factory.abi,
    functionName: 'getUser',
    args: walletAddress ? [walletAddress] : undefined,
    query: {
      enabled: !!walletAddress && !!factory.address,
    },
  });
}

export function useUserExists(walletAddress?: `0x${string}`) {
  const factory = useFactoryUser();

  return useReadContract({
    address: factory.address,
    abi: factory.abi,
    functionName: 'userExists',
    args: walletAddress ? [walletAddress] : undefined,
    query: {
      enabled: !!walletAddress && !!factory.address,
    },
  });
}

export function useCreateUser() {
  const factory = useFactoryUser();
  const { writeContractAsync, data: hash, isPending, error } = useWriteContract();

  const createUser = async () => {
    if (!factory.address) throw new Error('Factory address not found');

    return await writeContractAsync({
      address: factory.address,
      abi: factory.abi,
      functionName: 'createUser',
    });
  };

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  return {
    createUser,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  };
}

// ============================================================
//                    USER CONTRACT HOOKS
// ============================================================

export function useUser(userContractAddress?: `0x${string}`) {
  return {
    address: userContractAddress,
    abi: UserABI,
  };
}

export function useUserStats(userContractAddress?: `0x${string}`) {
  const user = useUser(userContractAddress);

  const totalSpent = useReadContract({
    address: user.address,
    abi: user.abi,
    functionName: 'getTotalSpent',
    query: { enabled: !!user.address },
  });

  const totalEarned = useReadContract({
    address: user.address,
    abi: user.abi,
    functionName: 'getTotalEarned',
    query: { enabled: !!user.address },
  });

  const createdPoolsCount = useReadContract({
    address: user.address,
    abi: user.abi,
    functionName: 'getCreatedPoolsCount',
    query: { enabled: !!user.address },
  });

  const joinedPoolsCount = useReadContract({
    address: user.address,
    abi: user.abi,
    functionName: 'getJoinedPoolsCount',
    query: { enabled: !!user.address },
  });

  return {
    totalSpent: totalSpent.data,
    totalEarned: totalEarned.data,
    createdPoolsCount: createdPoolsCount.data,
    joinedPoolsCount: joinedPoolsCount.data,
    isLoading: totalSpent.isLoading || totalEarned.isLoading || createdPoolsCount.isLoading || joinedPoolsCount.isLoading,
    error: totalSpent.error || totalEarned.error || createdPoolsCount.error || joinedPoolsCount.error,
  };
}

export function useCreatePool(userContractAddress?: `0x${string}`) {
  const user = useUser(userContractAddress);
  const { writeContractAsync, data: hash, isPending, error } = useWriteContract();

  const createPool = async (poolInfo: PoolInfo, value: bigint) => {
    if (!user.address) throw new Error('User contract address not found');

    return await writeContractAsync({
      address: user.address,
      abi: user.abi,
      functionName: 'createPool',
      args: [poolInfo],
      value,
    });
  };

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  return {
    createPool,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  };
}

export function useFundPool(userContractAddress?: `0x${string}`) {
  const user = useUser(userContractAddress);
  const { writeContractAsync, data: hash, isPending, error } = useWriteContract();

  const fundPool = async (poolAddress: `0x${string}`, value: bigint) => {
    if (!user.address) throw new Error('User contract address not found');

    return await writeContractAsync({
      address: user.address,
      abi: user.abi,
      functionName: 'fundPool',
      args: [poolAddress],
      value,
    });
  };

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  return {
    fundPool,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  };
}

export function useStopPool(userContractAddress?: `0x${string}`) {
  const user = useUser(userContractAddress);
  const { writeContractAsync, data: hash, isPending, error } = useWriteContract();

  const stopPool = async (poolAddress: `0x${string}`) => {
    if (!user.address) throw new Error('User contract address not found');

    return await writeContractAsync({
      address: user.address,
      abi: user.abi,
      functionName: 'stopPool',
      args: [poolAddress],
    });
  };

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  return {
    stopPool,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  };
}

export function useJoinPool(userContractAddress?: `0x${string}`) {
  const user = useUser(userContractAddress);
  const { writeContractAsync, data: hash, isPending, error } = useWriteContract();

  const joinPool = async (poolAddress: `0x${string}`) => {
    if (!user.address) throw new Error('User contract address not found');

    return await writeContractAsync({
      address: user.address,
      abi: user.abi,
      functionName: 'joinPool',
      args: [poolAddress],
    });
  };

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  return {
    joinPool,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  };
}

export function useSubmitProof(userContractAddress?: `0x${string}`) {
  const user = useUser(userContractAddress);
  const { writeContractAsync, data: hash, isPending, error } = useWriteContract();

  const submitProof = async (
    poolAddress: `0x${string}`,
    proofType: ProofType,
    proofHash: `0x${string}`,
    encryptedCID: string,
    dataHash: `0x${string}`,
    zkParams: VerificationParams
  ) => {
    if (!user.address) throw new Error('User contract address not found');

    return await writeContractAsync({
      address: user.address,
      abi: user.abi,
      functionName: 'submitProofAsSeller',
      args: [poolAddress, proofType, proofHash, encryptedCID, dataHash, zkParams],
    });
  };

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  return {
    submitProof,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  };
}

// ============================================================
//                    POOL HOOKS
// ============================================================

export function usePoolInfo(poolAddress?: `0x${string}`) {
  return useReadContract({
    address: poolAddress,
    abi: AccessFiPoolABI,
    functionName: 'poolInfo',
    query: { enabled: !!poolAddress },
  });
}

export function usePoolBudgetStatus(poolAddress?: `0x${string}`) {
  return useReadContract({
    address: poolAddress,
    abi: AccessFiPoolABI,
    functionName: 'getBudgetStatus',
    query: { enabled: !!poolAddress },
  });
}

export function useGetJoinedSellers(poolAddress?: `0x${string}`) {
  return useReadContract({
    address: poolAddress,
    abi: AccessFiPoolABI,
    functionName: 'getJoinedSellers',
    query: { enabled: !!poolAddress },
  });
}

export function useGetVerifiedSellers(poolAddress?: `0x${string}`) {
  return useReadContract({
    address: poolAddress,
    abi: AccessFiPoolABI,
    functionName: 'getVerifiedSellers',
    query: { enabled: !!poolAddress },
  });
}

// ============================================================
//                    FACTORY POOL HOOKS
// ============================================================

export function useFactoryPool() {
  const { chainId } = useAccount();
  const addresses = chainId ? getContractAddresses(chainId) : null;

  return {
    address: addresses?.FACTORY_POOL as `0x${string}`,
    abi: FactoryAccessFiPoolABI,
  };
}

export function useGetAllPools() {
  const factory = useFactoryPool();

  return useReadContract({
    address: factory.address,
    abi: factory.abi,
    functionName: 'getAccessFiPools',
    query: { enabled: !!factory.address },
  });
}

export function useGetCreatorPools(creatorAddress?: `0x${string}`) {
  const factory = useFactoryPool();

  return useReadContract({
    address: factory.address,
    abi: factory.abi,
    functionName: 'getCreatorPools',
    args: creatorAddress ? [creatorAddress] : undefined,
    query: { enabled: !!creatorAddress && !!factory.address },
  });
}

// ============================================================
//                    DATA TOKEN HOOKS
// ============================================================

export function useDataToken() {
  const { chainId } = useAccount();
  const addresses = chainId ? getContractAddresses(chainId) : null;

  return {
    address: addresses?.DATA_TOKEN as `0x${string}`,
    abi: AccessFiDataTokenABI,
  };
}

export function useTokenMetadata(tokenId?: bigint) {
  const dataToken = useDataToken();

  return useReadContract({
    address: dataToken.address,
    abi: dataToken.abi,
    functionName: 'tokenMetadata',
    args: tokenId !== undefined ? [tokenId] : undefined,
    query: { enabled: tokenId !== undefined && !!dataToken.address },
  });
}

export function useGetSellerTokens(sellerAddress?: `0x${string}`) {
  const dataToken = useDataToken();

  return useReadContract({
    address: dataToken.address,
    abi: dataToken.abi,
    functionName: 'getSellerTokens',
    args: sellerAddress ? [sellerAddress] : undefined,
    query: { enabled: !!sellerAddress && !!dataToken.address },
  });
}

export function useGetBuyerTokens(buyerAddress?: `0x${string}`) {
  const dataToken = useDataToken();

  return useReadContract({
    address: dataToken.address,
    abi: dataToken.abi,
    functionName: 'getBuyerTokens',
    args: buyerAddress ? [buyerAddress] : undefined,
    query: { enabled: !!buyerAddress && !!dataToken.address },
  });
}
