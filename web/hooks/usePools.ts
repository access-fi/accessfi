import { useReadContract, useAccount } from 'wagmi';
import { factoryAccessFiPoolAbi } from '@/lib/contracts/abis';
import { accessFiPoolAbi } from '@/lib/contracts/abis';

const FACTORY_POOL_ADDRESS = process.env.NEXT_PUBLIC_FACTORY_POOL_ADDRESS as `0x${string}`;

export interface Pool {
  address: `0x${string}`;
  name: string;
  description: string;
  dataType: string;
  proofRequirements: `0x${string}`[];
  pricePerData: bigint;
  totalBudget: bigint;
  remainingBudget: bigint;
  creator: `0x${string}`;
  isActive: boolean;
  deadline: bigint;
  totalDataCollected: bigint;
}

type PoolInfoTuple = [
  string,
  string,
  string,
  bigint,
  bigint,
  bigint,
  `0x${string}`,
  boolean,
  bigint,
  bigint,
];

export function useAllPools() {
  // Get total pool count
  const { data: poolCount } = useReadContract({
    address: FACTORY_POOL_ADDRESS,
    abi: factoryAccessFiPoolAbi,
    functionName: 'getAccessFiPoolCount',
  });

  // Get all pool addresses
  const { data: poolAddresses, isLoading, error } = useReadContract({
    address: FACTORY_POOL_ADDRESS,
    abi: factoryAccessFiPoolAbi,
    functionName: 'getAccessFiPools',
  });

  return {
    poolAddresses: (poolAddresses as `0x${string}`[]) || [],
    poolCount: poolCount ? Number(poolCount) : 0,
    isLoading,
    error,
  };
}

export function usePoolInfo(poolAddress: `0x${string}` | undefined) {
  const { data: poolStats } = useReadContract({
    address: poolAddress,
    abi: accessFiPoolAbi,
    functionName: 'getBudgetStatus',
    query: {
      enabled: !!poolAddress,
    },
  });

  const { data: poolInfo, isLoading, error } = useReadContract({
    address: poolAddress,
    abi: accessFiPoolAbi,
    functionName: 'poolInfo',
    query: {
      enabled: !!poolAddress,
    },
  });

  const { data: totalDataCollected } = useReadContract({
    address: poolAddress,
    abi: accessFiPoolAbi,
    functionName: 'totalDataCollected',
    query: {
      enabled: !!poolAddress,
    },
  });

  if (!poolInfo || !poolAddress) {
    return { pool: null, isLoading, error };
  }

  const info = poolInfo as PoolInfoTuple;
  const stats = poolStats as [bigint, bigint, bigint, boolean] | undefined;

  // `poolInfo()` omits the dynamic `proofRequirements` array in the public getter.
  // ABI order is:
  // 0: name, 1: description, 2: dataType, 3: pricePerData, 4: totalBudget,
  // 5: remainingBudget, 6: creator, 7: isActive, 8: createdAt, 9: deadline.

  const pool: Pool = {
    address: poolAddress,
    name: info[0] as string,
    description: info[1] as string,
    dataType: info[2] as string,
    proofRequirements: [], // Not returned by poolInfo public getter
    pricePerData: BigInt(info[3]),
    totalBudget: BigInt(info[4]),
    remainingBudget: stats ? BigInt(stats[0]) : BigInt(info[5]),
    creator: info[6] as `0x${string}`,
    isActive: Boolean(info[7]),
    deadline: info[9],
    totalDataCollected: (totalDataCollected as bigint) || BigInt(0),
  };

  return { pool, isLoading, error };
}

export function useUserCreatedPools() {
  const { address } = useAccount();

  const { data: createdPoolAddresses, isLoading, error } = useReadContract({
    address: FACTORY_POOL_ADDRESS,
    abi: factoryAccessFiPoolAbi,
    functionName: 'getCreatorPools',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  return {
    poolAddresses: (createdPoolAddresses as `0x${string}`[]) || [],
    isLoading,
    error,
  };
}
