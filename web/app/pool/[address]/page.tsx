"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { use, useState } from "react";
import { formatEther } from "viem";
import { usePoolInfo } from "@/hooks/usePools";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { JoinPoolModal } from "@/components/join-pool-modal";

export const dynamic = 'force-dynamic';

export default function PoolDetailPage({
  params,
}: {
  params: Promise<{ address: string }>;
}) {
  const resolvedParams = use(params);
  const { pool, isLoading } = usePoolInfo(resolvedParams.address as `0x${string}`);
  const [joinModalOpen, setJoinModalOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="font-mono text-sm text-muted-foreground">Loading pool...</p>
        </div>
      </div>
    );
  }

  if (!pool) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-mono text-2xl font-bold mb-4">Pool Not Found</h1>
          <Link href="/pools" className="text-primary hover:underline">
            Back to Pools
          </Link>
        </div>
      </div>
    );
  }

  const progress = pool.totalBudget > BigInt(0)
    ? Number((BigInt(pool.totalBudget) - BigInt(pool.remainingBudget)) * BigInt(100) / BigInt(pool.totalBudget))
    : 0;

    const percentFilled = pool.totalBudget > BigInt(0)
    ? Number((BigInt(pool.totalBudget) - BigInt(pool.remainingBudget)) * BigInt(100) / BigInt(pool.totalBudget))
    : 0;

  const daysLeft = Math.max(0, Math.ceil((Number(pool.deadline) - Date.now() / 1000) / 86400));
  const isActive = pool.isActive && Number(pool.deadline) > Date.now() / 1000;

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="grid-pattern fixed inset-0 opacity-30" />
      <div className="fixed inset-0 bg-[url('/noise.png')] opacity-5 mix-blend-overlay" />

      <Navigation />

      <div className="relative z-10">
        <main className="container mx-auto px-6 py-12 max-w-5xl">
          <Link
            href="/pools"
            className="inline-flex items-center gap-2 font-mono text-sm text-muted-foreground hover:text-primary mb-8"
          >
            ← BACK TO POOLS
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="h-3 w-3 bg-primary" />
              <span className={`font-mono text-sm uppercase ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                [{isActive ? "ACTIVE" : "ENDED"}]
              </span>
            </div>
            <h1 className="font-mono text-4xl font-black uppercase mb-4">{pool.name}</h1>
            <p className="text-muted-foreground mb-4">{pool.description}</p>
            <div className="flex flex-wrap gap-2">
              <span className="border border-border bg-background px-3 py-1 font-mono text-xs uppercase">
                {pool.dataType}
              </span>
              <span className="border border-border bg-background px-3 py-1 font-mono text-xs">
                {resolvedParams.address.slice(0, 6)}...{resolvedParams.address.slice(-4)}
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8 grid grid-cols-1 gap-px border border-border bg-border md:grid-cols-4"
          >
            <div className="bg-background p-6">
              <div className="mb-1 font-mono text-xs text-muted-foreground">REWARD PER DATA</div>
              <div className="font-mono text-2xl font-black text-primary">
                {formatEther(pool.pricePerData)} ETH
              </div>
            </div>
            <div className="bg-background p-6">
              <div className="mb-1 font-mono text-xs text-muted-foreground">TOTAL BUDGET</div>
              <div className="font-mono text-2xl font-black text-foreground">
                {formatEther(pool.totalBudget)} ETH
              </div>
            </div>
            <div className="bg-background p-6">
              <div className="mb-1 font-mono text-xs text-muted-foreground">REMAINING</div>
              <div className="font-mono text-2xl font-black text-foreground">
                {formatEther(pool.remainingBudget)} ETH
              </div>
            </div>
            <div className="bg-background p-6">
              <div className="mb-1 font-mono text-xs text-muted-foreground">DATA COLLECTED</div>
              <div className="font-mono text-2xl font-black text-foreground">
                {Number(pool.totalDataCollected)}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8 border-2 border-border bg-card p-6"
          >
            <div className="mb-4 flex justify-between font-mono text-sm">
              <span className="text-muted-foreground">POOL PROGRESS</span>
              <span className="text-foreground">{progress}% FILLED</span>
            </div>
            <div className="h-4 w-full bg-muted">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="mt-4 flex justify-between font-mono text-xs text-muted-foreground">
              <span>{isActive ? `${daysLeft} days remaining` : "Pool ended"}</span>
              <span>Deadline: {new Date(Number(pool.deadline) * 1000).toLocaleDateString()}</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-8 border-2 border-border bg-card p-6"
          >
            <h2 className="font-mono text-xl font-bold uppercase mb-4">Pool Details</h2>
            <div className="space-y-3 font-mono text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Creator:</span>
                <span className="text-foreground">{String(pool.creator).slice(0, 6)}...{String(pool.creator).slice(-4)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <span className={isActive ? "text-primary" : "text-muted-foreground"}>
                  {isActive ? "Active" : "Ended"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Data Type:</span>
                <span className="text-foreground uppercase">{pool.dataType}</span>
              </div>
            </div>
          </motion.div>

          {isActive && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-center"
            >
              <button
                onClick={() => setJoinModalOpen(true)}
                className="brutal-shadow border-2 border-primary bg-primary px-12 py-4 font-mono text-sm font-bold uppercase text-primary-foreground transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
              >
                JOIN POOL & SUBMIT DATA
              </button>
              <p className="mt-4 text-xs text-muted-foreground">
                Submit your verified data to earn {formatEther(pool.pricePerData)} ETH
              </p>

              {/* Join Pool Modal */}
              <JoinPoolModal
                open={joinModalOpen}
                onClose={() => setJoinModalOpen(false)}
                poolAddress={resolvedParams.address as `0x${string}`}
                poolName={pool.name}
                pricePerData={pool.pricePerData}
              />
            </motion.div>
          )}
        </main>
      </div>
    </div>
  );
}

function Navigation() {
  return (
    <nav className="container sticky top-0 z-50 mx-auto flex items-center justify-between border-b border-border bg-background/80 px-6 py-6 backdrop-blur-sm">
      <Link href="/" className="font-mono text-base font-bold uppercase tracking-wider">
        <span className="text-primary">●</span> ACCESSFI
      </Link>
      <div className="flex items-center gap-8 font-mono text-sm uppercase">
        <Link href="/dashboard" className="text-muted-foreground transition-colors hover:text-foreground">
          DASHBOARD
        </Link>
        <Link href="/pools" className="text-muted-foreground transition-colors hover:text-foreground">
          POOLS
        </Link>
        <ConnectButton.Custom>
          {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted: ready }) => {
            const connected = ready && account && chain;
            return (
              <div {...(!ready && { "aria-hidden": true, style: { opacity: 0, pointerEvents: "none", userSelect: "none" } })}>
                {(() => {
                  if (!connected) {
                    return (
                      <button onClick={openConnectModal} type="button" className="brutal-shadow border-2 border-primary bg-primary px-6 py-3 font-mono text-sm font-bold uppercase text-primary-foreground transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none">
                        CONNECT
                      </button>
                    );
                  }
                  if (chain.unsupported) {
                    return (
                      <button onClick={openChainModal} type="button" className="brutal-shadow border-2 border-destructive bg-destructive px-4 py-2 font-mono text-xs font-bold uppercase text-destructive-foreground transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none">
                        WRONG NET
                      </button>
                    );
                  }
                  return (
                    <button onClick={openAccountModal} type="button" className="brutal-shadow border-2 border-primary bg-primary px-6 py-3 font-mono text-sm font-bold uppercase text-primary-foreground transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none">
                      {account.displayName}
                    </button>
                  );
                })()}
              </div>
            );
          }}
        </ConnectButton.Custom>
      </div>
    </nav>
  );
}
