'use client';

import Link from 'next/link';
import { formatEther } from 'viem';
import { usePoolInfo } from '@/hooks/usePools';

interface PoolCardProps {
  poolAddress: `0x${string}`;
}

export function PoolCard({ poolAddress }: PoolCardProps) {
  const { pool, isLoading } = usePoolInfo(poolAddress);

  if (isLoading || !pool) {
    return (
      <div className="border border-border bg-card p-6 animate-pulse">
        <div className="h-4 bg-muted mb-4 w-3/4" />
        <div className="h-3 bg-muted mb-2 w-1/2" />
        <div className="h-3 bg-muted w-2/3" />
      </div>
    );
  }

  // Calculate spent budget (how much has been used)
  const spentBudget = BigInt(pool.totalBudget) - BigInt(pool.remainingBudget);
  const percentFilled = pool.totalBudget > BigInt(0)
    ? Number((spentBudget * BigInt(100)) / BigInt(pool.totalBudget))
    : 0;

  const currentTime = Math.floor(Date.now() / 1000);
  const daysLeft = Math.max(0, Math.ceil((Number(pool.deadline) - currentTime) / 86400));
  const isActive = pool.isActive && Number(pool.deadline) > currentTime;

  // Get proof requirements count
  const proofCount = pool.proofRequirements?.length || 0;

  return (
    <Link href={`/pool/${poolAddress}`}>
      <div className="group cursor-pointer border-2 border-border bg-card p-6 transition-all hover:border-primary hover:shadow-lg h-full flex flex-col">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-mono text-lg font-bold uppercase flex-1 mr-2">{pool.name}</h3>
            <span
              className={`font-mono text-[10px] uppercase px-2 py-1 border ${
                isActive
                  ? "text-primary border-primary bg-primary/10"
                  : "text-muted-foreground border-muted-foreground bg-muted/10"
              }`}
            >
              {isActive ? "ACTIVE" : "ENDED"}
            </span>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">{pool.description}</p>
        </div>

        {/* Data Type & Proof Requirements */}
        <div className="mb-4 flex flex-wrap gap-2">
          <span className="border border-border bg-background px-3 py-1 font-mono text-[10px] uppercase">
            {pool.dataType}
          </span>
          <span className="border border-border bg-background px-3 py-1 font-mono text-[10px] uppercase">
            {proofCount} PROOF{proofCount !== 1 ? 'S' : ''}
          </span>
        </div>

        {/* Stats Grid */}
        <div className="mb-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="font-mono text-xs text-muted-foreground uppercase">Reward</span>
            <span className="font-mono text-sm font-bold text-primary">{formatEther(pool.pricePerData)} ETH</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-mono text-xs text-muted-foreground uppercase">Total Budget</span>
            <span className="font-mono text-sm font-bold">{formatEther(pool.totalBudget)} ETH</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-mono text-xs text-muted-foreground uppercase">Remaining</span>
            <span className="font-mono text-sm font-bold text-foreground">{formatEther(pool.remainingBudget)} ETH</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="mb-2 flex justify-between items-center">
            <span className="font-mono text-xs text-muted-foreground uppercase">Budget Used</span>
            <span className="font-mono text-sm font-bold">{percentFilled.toFixed(1)}%</span>
          </div>
          <div className="h-3 w-full bg-muted border border-border overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${Math.min(percentFilled, 100)}%` }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto pt-4 border-t border-border flex items-center justify-between">
          <span className="font-mono text-xs text-muted-foreground">
            {isActive ? `${daysLeft}D LEFT` : 'ENDED'}
          </span>
          <span className="font-mono text-xs font-bold text-foreground group-hover:text-primary transition-colors">
            VIEW DETAILS →
          </span>
        </div>
      </div>
    </Link>
  );
}
