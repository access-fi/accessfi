"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useState } from "react";
import { CreatePoolModal } from "@/components/create-pool-modal";
import { useAllPools } from "@/hooks/usePools";
import { PoolCard } from "@/components/pool-card";

export default function PoolsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [createPoolOpen, setCreatePoolOpen] = useState(false);
  const { poolAddresses, poolCount, isLoading } = useAllPools();

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Background effects */}
      <div className="grid-pattern fixed inset-0 opacity-30" />
      <div className="fixed inset-0 bg-[url('/noise.png')] opacity-5 mix-blend-overlay" />

      <Navigation />

      <div className="relative z-10">
        <main className="container mx-auto px-4 py-8 md:px-6 md:py-12">
          {/* Page header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <div className="mb-6 flex items-center gap-3">
              <div className="h-3 w-3 bg-primary" />
              <h1 className="font-mono text-4xl font-black uppercase tracking-tight">
                DATA POOLS
              </h1>
            </div>
            <p className="text-muted-foreground">
              Browse and join active data collection pools. Earn by contributing
              verified data.
            </p>
          </motion.div>

          {/* Stats bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8 grid grid-cols-1 gap-px border border-border bg-border md:grid-cols-2"
          >
            <div className="bg-background p-6">
              <div className="font-mono text-2xl font-black text-foreground">
                {poolCount}
              </div>
              <div className="font-mono text-xs text-muted-foreground">
                TOTAL POOLS
              </div>
            </div>
            <div className="bg-background p-6">
              <div className="font-mono text-2xl font-black text-foreground">
                {poolAddresses.length}
              </div>
              <div className="font-mono text-xs text-muted-foreground">
                LOADED POOLS
              </div>
            </div>
          </motion.div>

          {/* Search and create */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              {/* Search bar */}
              <div className="flex-1 md:max-w-md">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="SEARCH POOLS..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full border-2 border-border bg-background px-4 py-3 font-mono text-sm uppercase placeholder-muted-foreground focus:border-primary focus:outline-none"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                    🔍
                  </div>
                </div>
              </div>

              {/* Create pool button */}
              <button
                onClick={() => setCreatePoolOpen(true)}
                className="brutal-shadow border-2 border-primary bg-primary px-6 py-3 text-center font-mono text-sm font-bold uppercase text-primary-foreground transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
              >
                + CREATE POOL
              </button>
            </div>
          </motion.div>

          {/* Pools grid */}
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="border border-border bg-card p-6 animate-pulse">
                  <div className="h-4 bg-muted mb-4 w-3/4" />
                  <div className="h-3 bg-muted mb-2 w-1/2" />
                  <div className="h-3 bg-muted w-2/3" />
                </div>
              ))}
            </div>
          ) : poolAddresses.length > 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              {poolAddresses
                .filter((address) =>
                  searchQuery
                    ? address.toLowerCase().includes(searchQuery.toLowerCase())
                    : true
                )
                .map((poolAddress) => (
                  <PoolCard key={poolAddress} poolAddress={poolAddress} />
                ))}
            </motion.div>
          ) : (
            /* Empty state */
            <div className="flex min-h-[400px] flex-col items-center justify-center border-2 border-dashed border-border p-12 text-center">
              <div className="mb-4 text-6xl opacity-20">📊</div>
              <h3 className="mb-2 font-mono text-xl font-bold uppercase">No Pools Yet</h3>
              <p className="mb-6 text-sm text-muted-foreground">
                Be the first to create a data pool and start collecting verified data
              </p>
              <button
                onClick={() => setCreatePoolOpen(true)}
                className="brutal-shadow border-2 border-primary bg-primary px-6 py-3 font-mono text-sm font-bold uppercase text-primary-foreground transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
              >
                + CREATE FIRST POOL
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Create Pool Modal */}
      <CreatePoolModal
        open={createPoolOpen}
        onClose={() => setCreatePoolOpen(false)}
        onSuccess={() => {
          setCreatePoolOpen(false);
        }}
      />
    </div>
  );
}

// Navigation component
function Navigation() {
  return (
    <nav className="container sticky top-0 z-50 mx-auto flex items-center justify-between border-b border-border bg-background/80 px-6 py-6 backdrop-blur-sm">
      <Link
        href="/"
        className="font-mono text-base font-bold uppercase tracking-wider"
      >
        <span className="text-primary">●</span> ACCESSFI
      </Link>
      <div className="flex items-center gap-8 font-mono text-sm uppercase">
        <Link
          href="/dashboard"
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          DASHBOARD
        </Link>
        <Link
          href="/pools"
          className="text-primary transition-colors hover:text-foreground"
        >
          POOLS
        </Link>
        <ConnectButton.Custom>
          {({
            account,
            chain,
            openAccountModal,
            openChainModal,
            openConnectModal,
            mounted: ready,
          }) => {
            const connected = ready && account && chain;

            return (
              <div
                {...(!ready && {
                  "aria-hidden": true,
                  style: {
                    opacity: 0,
                    pointerEvents: "none",
                    userSelect: "none",
                  },
                })}
              >
                {(() => {
                  if (!connected) {
                    return (
                      <button
                        onClick={openConnectModal}
                        type="button"
                        className="brutal-shadow border-2 border-primary bg-primary px-6 py-3 font-mono text-sm font-bold uppercase text-primary-foreground transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none"
                      >
                        CONNECT
                      </button>
                    );
                  }

                  if (chain.unsupported) {
                    return (
                      <button
                        onClick={openChainModal}
                        type="button"
                        className="brutal-shadow border-2 border-destructive bg-destructive px-4 py-2 font-mono text-xs font-bold uppercase text-destructive-foreground transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none"
                      >
                        WRONG NET
                      </button>
                    );
                  }

                  return (
                    <button
                      onClick={openAccountModal}
                      type="button"
                      className="brutal-shadow border-2 border-primary bg-primary px-6 py-3 font-mono text-sm font-bold uppercase text-primary-foreground transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none"
                    >
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
