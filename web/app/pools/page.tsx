"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useState } from "react";

export default function PoolsPage() {
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Background effects */}
      <div className="grid-pattern fixed inset-0 opacity-30" />
      <div className="fixed inset-0 bg-[url('/noise.png')] opacity-5 mix-blend-overlay" />

      <Navigation />

      <div className="relative z-10">
        <main className="container mx-auto px-6 py-12">
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
            className="mb-8 grid grid-cols-1 gap-px border border-border bg-border md:grid-cols-4"
          >
            <div className="bg-background p-6">
              <div className="font-mono text-2xl font-black text-foreground">
                127
              </div>
              <div className="font-mono text-xs text-muted-foreground">
                ACTIVE POOLS
              </div>
            </div>
            <div className="bg-background p-6">
              <div className="font-mono text-2xl font-black text-foreground">
                $2.4M
              </div>
              <div className="font-mono text-xs text-muted-foreground">
                TOTAL BUDGET
              </div>
            </div>
            <div className="bg-background p-6">
              <div className="font-mono text-2xl font-black text-foreground">
                1,284
              </div>
              <div className="font-mono text-xs text-muted-foreground">
                DATA VERIFIED
              </div>
            </div>
            <div className="bg-background p-6">
              <div className="font-mono text-2xl font-black text-foreground">
                892
              </div>
              <div className="font-mono text-xs text-muted-foreground">
                ACTIVE SELLERS
              </div>
            </div>
          </motion.div>

          {/* Filters and search */}
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
              <Link
                href="/pools/create"
                className="brutal-shadow border-2 border-primary bg-primary px-6 py-3 text-center font-mono text-sm font-bold uppercase text-primary-foreground transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
              >
                + CREATE POOL
              </Link>
            </div>

            {/* Filter tabs */}
            <div className="flex flex-wrap gap-2">
              <FilterButton
                label="ALL POOLS"
                active={activeFilter === "all"}
                onClick={() => setActiveFilter("all")}
                count={127}
              />
              <FilterButton
                label="HEALTH"
                active={activeFilter === "health"}
                onClick={() => setActiveFilter("health")}
                count={34}
              />
              <FilterButton
                label="LOCATION"
                active={activeFilter === "location"}
                onClick={() => setActiveFilter("location")}
                count={28}
              />
              <FilterButton
                label="SURVEY"
                active={activeFilter === "survey"}
                onClick={() => setActiveFilter("survey")}
                count={41}
              />
              <FilterButton
                label="FINANCIAL"
                active={activeFilter === "financial"}
                onClick={() => setActiveFilter("financial")}
                count={24}
              />
            </div>
          </motion.div>

          {/* Featured pools section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-12"
          >
            <div className="mb-6 flex items-center gap-3">
              <div className="h-2 w-2 bg-accent" />
              <h2 className="font-mono text-xl font-bold uppercase">
                FEATURED POOLS
              </h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FeaturedPoolCard
                name="GLOBAL HEALTH METRICS STUDY"
                poolId="#A4F2E9"
                description="Contribute anonymized health data for global wellness research. Requires fitness tracker data and basic health metrics."
                budget="15.5 ETH"
                pricePerData="0.25 ETH"
                progress={45}
                sellers="27/60"
                deadline="14 days"
                requirements={["AGE", "LOCATION", "FITNESS"]}
                status="active"
                featured={true}
              />
              <FeaturedPoolCard
                name="URBAN MOBILITY PATTERNS"
                poolId="#B7D3A1"
                description="Help improve city planning with your daily movement patterns. GPS data anonymized through zero-knowledge proofs."
                budget="12.8 ETH"
                pricePerData="0.32 ETH"
                progress={62}
                sellers="31/50"
                deadline="9 days"
                requirements={["GPS", "TIME", "ACTIVITY"]}
                status="active"
                featured={true}
              />
            </div>
          </motion.div>

          {/* All pools grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-mono text-xl font-bold uppercase">
                ALL POOLS ({127})
              </h2>
              <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
                <span>SORT BY:</span>
                <select className="border border-border bg-background px-3 py-2 uppercase focus:border-primary focus:outline-none">
                  <option>NEWEST</option>
                  <option>HIGHEST REWARD</option>
                  <option>ENDING SOON</option>
                  <option>BUDGET</option>
                </select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <PoolCard
                name="FITNESS TRACKER DATA"
                poolId="#C8F2E1"
                budget="8.5 ETH"
                pricePerData="0.14 ETH"
                progress={75}
                sellers="45/60"
                deadline="5 days"
                requirements={["STEPS", "HEART_RATE", "SLEEP"]}
                status="active"
              />
              <PoolCard
                name="SPENDING HABITS SURVEY"
                poolId="#D4A9F7"
                budget="4.2 ETH"
                pricePerData="0.11 ETH"
                progress={55}
                sellers="22/40"
                deadline="8 days"
                requirements={["INCOME", "EXPENSES", "CATEGORY"]}
                status="active"
              />
              <PoolCard
                name="SLEEP PATTERN ANALYSIS"
                poolId="#E9B8D3"
                budget="6.0 ETH"
                pricePerData="0.15 ETH"
                progress={85}
                sellers="34/40"
                deadline="2 days"
                requirements={["SLEEP_TIME", "QUALITY", "DURATION"]}
                status="ending"
              />
              <PoolCard
                name="NUTRITION TRACKING"
                poolId="#F1C7A4"
                budget="7.2 ETH"
                pricePerData="0.18 ETH"
                progress={30}
                sellers="12/40"
                deadline="12 days"
                requirements={["MEALS", "CALORIES", "MACROS"]}
                status="active"
              />
              <PoolCard
                name="COMMUTE PATTERNS"
                poolId="#A2D8F4"
                budget="5.8 ETH"
                pricePerData="0.12 ETH"
                progress={68}
                sellers="41/60"
                deadline="6 days"
                requirements={["ROUTE", "TIME", "MODE"]}
                status="active"
              />
              <PoolCard
                name="SCREEN TIME METRICS"
                poolId="#B9E7C3"
                budget="3.5 ETH"
                pricePerData="0.09 ETH"
                progress={40}
                sellers="16/40"
                deadline="10 days"
                requirements={["USAGE", "APPS", "DURATION"]}
                status="active"
              />
              <PoolCard
                name="MENTAL HEALTH CHECK-INS"
                poolId="#C4D9F2"
                budget="9.2 ETH"
                pricePerData="0.23 ETH"
                progress={20}
                sellers="8/40"
                deadline="18 days"
                requirements={["MOOD", "STRESS", "ACTIVITIES"]}
                status="active"
              />
              <PoolCard
                name="ENERGY CONSUMPTION DATA"
                poolId="#D8F3A7"
                budget="6.5 ETH"
                pricePerData="0.13 ETH"
                progress={50}
                sellers="25/50"
                deadline="7 days"
                requirements={["USAGE", "TIME", "DEVICES"]}
                status="active"
              />
              <PoolCard
                name="SHOPPING BEHAVIOR"
                poolId="#E6A8C9"
                budget="4.8 ETH"
                pricePerData="0.16 ETH"
                progress={90}
                sellers="27/30"
                deadline="1 day"
                requirements={["PURCHASES", "FREQUENCY", "AMOUNT"]}
                status="ending"
              />
            </div>
          </motion.div>
        </main>
      </div>
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

// Filter button component
function FilterButton({
  label,
  active,
  onClick,
  count,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`border-2 px-4 py-2 font-mono text-xs font-bold uppercase transition-all ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-muted-foreground hover:border-primary hover:text-foreground"
      }`}
    >
      {label} [{count}]
    </button>
  );
}

// Featured pool card component
function FeaturedPoolCard({
  name,
  poolId,
  description,
  budget,
  pricePerData,
  progress,
  sellers,
  deadline,
  requirements,
  status,
  featured,
}: {
  name: string;
  poolId: string;
  description: string;
  budget: string;
  pricePerData: string;
  progress: number;
  sellers: string;
  deadline: string;
  requirements: string[];
  status: string;
  featured: boolean;
}) {
  return (
    <div className="group relative cursor-pointer border-2 border-primary bg-card p-8 transition-all hover:border-accent hover:bg-primary/5">
      {/* Featured badge */}
      {featured && (
        <div className="absolute right-4 top-4 border border-accent bg-accent/10 px-3 py-1 font-mono text-xs text-accent">
          ★ FEATURED
        </div>
      )}

      {/* Header */}
      <div className="mb-4">
        <div className="mb-2 font-mono text-xs text-muted-foreground">
          {poolId}
        </div>
        <h3 className="mb-3 font-mono text-xl font-bold uppercase leading-tight">
          {name}
        </h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      {/* Requirements */}
      <div className="mb-4 flex flex-wrap gap-2">
        {requirements.map((req) => (
          <span
            key={req}
            className="border border-border bg-background px-2 py-1 font-mono text-xs"
          >
            {req}
          </span>
        ))}
      </div>

      {/* Stats grid */}
      <div className="mb-4 grid grid-cols-2 gap-4 border-t border-border pt-4">
        <div>
          <div className="mb-1 font-mono text-xs text-muted-foreground">
            TOTAL BUDGET
          </div>
          <div className="font-mono text-lg font-bold text-foreground">
            {budget}
          </div>
        </div>
        <div>
          <div className="mb-1 font-mono text-xs text-muted-foreground">
            PER DATA
          </div>
          <div className="font-mono text-lg font-bold text-primary">
            {pricePerData}
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-4">
        <div className="mb-2 flex justify-between font-mono text-xs">
          <span className="text-muted-foreground">SELLERS: {sellers}</span>
          <span className="text-foreground">{progress}%</span>
        </div>
        <div className="h-2 w-full bg-muted">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-border pt-4">
        <div className="font-mono text-xs">
          <span className="text-muted-foreground">ENDS IN: </span>
          <span className="text-foreground">{deadline}</span>
        </div>
        <button className="border-2 border-primary bg-primary px-4 py-2 font-mono text-xs font-bold uppercase text-primary-foreground transition-all hover:bg-primary/90">
          JOIN POOL →
        </button>
      </div>
    </div>
  );
}

// Regular pool card component
function PoolCard({
  name,
  poolId,
  budget,
  pricePerData,
  progress,
  sellers,
  deadline,
  requirements,
  status,
}: {
  name: string;
  poolId: string;
  budget: string;
  pricePerData: string;
  progress: number;
  sellers: string;
  deadline: string;
  requirements: string[];
  status: string;
}) {
  return (
    <div className="group cursor-pointer border border-border bg-card p-6 transition-all hover:border-primary hover:bg-primary/5">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <div className="mb-1 font-mono text-xs text-muted-foreground">
            {poolId}
          </div>
          <h3 className="font-mono text-sm font-bold uppercase">{name}</h3>
        </div>
        <span
          className={`font-mono text-xs uppercase ${
            status === "active"
              ? "text-primary"
              : status === "ending"
                ? "text-accent"
                : "text-muted-foreground"
          }`}
        >
          [{status}]
        </span>
      </div>

      {/* Requirements */}
      <div className="mb-4 flex flex-wrap gap-1">
        {requirements.slice(0, 3).map((req) => (
          <span
            key={req}
            className="border border-border bg-background px-2 py-1 font-mono text-[10px]"
          >
            {req}
          </span>
        ))}
      </div>

      {/* Stats */}
      <div className="mb-4 space-y-2">
        <div className="flex justify-between font-mono text-xs">
          <span className="text-muted-foreground">REWARD</span>
          <span className="text-primary">{pricePerData}</span>
        </div>
        <div className="flex justify-between font-mono text-xs">
          <span className="text-muted-foreground">BUDGET</span>
          <span className="text-foreground">{budget}</span>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-4">
        <div className="mb-2 flex justify-between font-mono text-xs text-muted-foreground">
          <span>{sellers}</span>
          <span>{progress}%</span>
        </div>
        <div className="h-1 w-full bg-muted">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-border pt-4 font-mono text-xs">
        <span className="text-muted-foreground">{deadline} left</span>
        <span className="text-foreground group-hover:text-primary">
          JOIN →
        </span>
      </div>
    </div>
  );
}
