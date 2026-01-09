"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { useState } from "react";

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  if (!isConnected) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-background">
        <div className="grid-pattern fixed inset-0 opacity-30" />

        <TopNav />

        <div className="relative z-10 flex min-h-[80vh] items-center justify-center px-6">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <h1 className="mb-4 font-mono text-4xl font-black uppercase">
                CONNECT WALLET
              </h1>
              <p className="text-muted-foreground">
                Connect your wallet to access your dashboard
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <ConnectButton.Custom>
                {({ openConnectModal }) => (
                  <button
                    onClick={openConnectModal}
                    className="brutal-shadow border-2 border-primary bg-primary px-8 py-4 font-mono text-sm font-bold uppercase text-primary-foreground transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
                  >
                    CONNECT WALLET
                  </button>
                )}
              </ConnectButton.Custom>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-background">
      {/* Background effects */}
      <div className="grid-pattern fixed inset-0 opacity-30" />
      <div className="fixed inset-0 bg-[url('/noise.png')] opacity-5 mix-blend-overlay" />

      {/* Top nav */}
      <TopNav />

      <div className="relative z-10 flex">
        {/* Sidebar */}
        <motion.aside
          initial={{ x: -300 }}
          animate={{ x: 0 }}
          className={`fixed left-0 top-16 h-[calc(100vh-4rem)] border-r-2 border-border bg-background/95 backdrop-blur-sm transition-all duration-300 ${
            sidebarOpen ? "w-64" : "w-20"
          }`}
        >
          {/* Sidebar header */}
          <div className="border-b-2 border-border p-6">
            <div className="mb-4 flex items-center justify-between">
              {sidebarOpen && (
                <div className="font-mono text-xs text-muted-foreground">
                  NAVIGATION
                </div>
              )}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="ml-auto border border-border bg-background p-2 hover:border-primary"
              >
                <div className="h-4 w-4 text-foreground">
                  {sidebarOpen ? "←" : "→"}
                </div>
              </button>
            </div>
          </div>

          {/* Sidebar menu */}
          <nav className="p-4">
            <SidebarItem
              icon="■"
              label="OVERVIEW"
              active={activeTab === "overview"}
              onClick={() => setActiveTab("overview")}
              collapsed={!sidebarOpen}
            />
            <SidebarItem
              icon="+"
              label="MY POOLS"
              active={activeTab === "created"}
              onClick={() => setActiveTab("created")}
              collapsed={!sidebarOpen}
            />
            <SidebarItem
              icon="→"
              label="JOINED"
              active={activeTab === "joined"}
              onClick={() => setActiveTab("joined")}
              collapsed={!sidebarOpen}
            />
            <SidebarItem
              icon="⚡"
              label="ACTIVITY"
              active={activeTab === "activity"}
              onClick={() => setActiveTab("activity")}
              collapsed={!sidebarOpen}
            />

            <div className="my-4 border-t border-border" />

            <SidebarItem
              icon="○"
              label="BROWSE"
              href="/pools"
              collapsed={!sidebarOpen}
            />
            <SidebarItem
              icon="⌂"
              label="HOME"
              href="/"
              collapsed={!sidebarOpen}
            />
          </nav>

          {/* Sidebar footer - wallet info */}
          {sidebarOpen && (
            <div className="absolute bottom-0 left-0 right-0 border-t-2 border-border bg-background/95 p-4">
              <div className="mb-2 font-mono text-xs text-muted-foreground">
                CONNECTED
              </div>
              <div className="mb-2 font-mono text-xs font-bold text-foreground">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </div>
              <div className="font-mono text-xs text-primary">BASE NETWORK</div>
            </div>
          )}
        </motion.aside>

        {/* Main content */}
        <main
          className={`min-h-screen flex-1 transition-all duration-300 ${
            sidebarOpen ? "ml-64" : "ml-20"
          } mt-16`}
        >
          <div className="p-8">
            {activeTab === "overview" && <OverviewTab address={address} />}
            {activeTab === "created" && <CreatedPoolsTab />}
            {activeTab === "joined" && <JoinedPoolsTab />}
            {activeTab === "activity" && <ActivityTab />}
          </div>
        </main>
      </div>
    </div>
  );
}

// Top navigation component
function TopNav() {
  return (
    <nav className="fixed top-0 z-50 w-full border-b-2 border-border bg-background/95 backdrop-blur-sm">
      <div className="flex items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="font-mono text-lg font-black uppercase tracking-wider"
        >
          <span className="text-primary">●</span> ACCESSFI
        </Link>

        <div className="flex items-center gap-4">
          <Link
            href="/pools"
            className="font-mono text-xs uppercase text-muted-foreground transition-colors hover:text-foreground"
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
                          className="brutal-shadow border-2 border-primary bg-primary px-4 py-2 font-mono text-xs font-bold uppercase text-primary-foreground transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none"
                        >
                          CONNECT
                        </button>
                      );
                    }

                    if (chain.unsupported) {
                      return (
                        <button
                          onClick={openChainModal}
                          className="brutal-shadow border-2 border-destructive bg-destructive px-3 py-2 font-mono text-xs font-bold uppercase text-destructive-foreground"
                        >
                          WRONG NET
                        </button>
                      );
                    }

                    return (
                      <button
                        onClick={openAccountModal}
                        className="brutal-shadow border-2 border-primary bg-primary px-4 py-2 font-mono text-xs font-bold uppercase text-primary-foreground transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none"
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
      </div>
    </nav>
  );
}

// Sidebar item component
function SidebarItem({
  icon,
  label,
  active = false,
  onClick,
  href,
  collapsed,
}: {
  icon: string;
  label: string;
  active?: boolean;
  onClick?: () => void;
  href?: string;
  collapsed: boolean;
}) {
  const content = (
    <>
      <div
        className={`flex h-10 w-10 flex-shrink-0 items-center justify-center border-2 font-mono text-lg ${
          active
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border bg-background text-foreground group-hover:border-primary"
        }`}
      >
        {icon}
      </div>
      {!collapsed && (
        <span
          className={`font-mono text-xs font-bold uppercase ${
            active ? "text-primary" : "text-foreground"
          }`}
        >
          {label}
        </span>
      )}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="group mb-2 flex items-center gap-4 p-2 transition-all hover:bg-primary/5"
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      onClick={onClick}
      className="group mb-2 flex w-full items-center gap-4 p-2 transition-all hover:bg-primary/5"
    >
      {content}
    </button>
  );
}

// Overview tab content
function OverviewTab({ address }: { address: string | undefined }) {
  return (
    <>
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="mb-2 font-mono text-3xl font-black uppercase">
          OVERVIEW
        </h1>
        <p className="font-mono text-sm text-muted-foreground">
          {address?.slice(0, 6)}...{address?.slice(-4)}
        </p>
      </motion.div>

      {/* Stats grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8 grid gap-4 md:grid-cols-4"
      >
        <StatCard label="POOLS CREATED" value="3" change="+1" positive />
        <StatCard label="POOLS JOINED" value="7" change="+2" positive />
        <StatCard label="DATA SOLD" value="12" change="+5" positive />
        <StatCard label="TOTAL EARNED" value="2.4 ETH" change="+0.8" positive />
      </motion.div>

      {/* Quick actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-8"
      >
        <h2 className="mb-4 font-mono text-lg font-bold uppercase">
          QUICK ACTIONS
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          <ActionCard
            icon="+"
            title="CREATE POOL"
            description="Start new data pool"
            href="/pools/create"
          />
          <ActionCard
            icon="→"
            title="BROWSE"
            description="Find pools to join"
            href="/pools"
          />
          <ActionCard
            icon="⚡"
            title="SUBMIT"
            description="Submit ZK proof"
            href="#"
          />
        </div>
      </motion.div>

      {/* Recent pools */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="mb-4 font-mono text-lg font-bold uppercase">
          RECENT ACTIVITY
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <PoolCard
            name="HEALTH DATA #A4F2"
            budget="5.2 ETH"
            progress={60}
            sellers="12/20"
            status="active"
          />
          <PoolCard
            name="FITNESS METRICS #D3A1"
            budget="8.5 ETH"
            progress={75}
            sellers="45/60"
            status="active"
          />
        </div>
      </motion.div>
    </>
  );
}

// Created pools tab
function CreatedPoolsTab() {
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between">
          <h1 className="font-mono text-3xl font-black uppercase">MY POOLS</h1>
          <Link
            href="/pools/create"
            className="brutal-shadow border-2 border-primary bg-primary px-6 py-3 font-mono text-xs font-bold uppercase text-primary-foreground hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
          >
            + CREATE
          </Link>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
      >
        <PoolCard
          name="HEALTH DATA POOL #A4F2"
          budget="5.2 ETH"
          remaining="2.1 ETH"
          progress={60}
          sellers="12/20"
          status="active"
        />
        <PoolCard
          name="LOCATION DATA #B7E9"
          budget="3.8 ETH"
          remaining="1.5 ETH"
          progress={40}
          sellers="8/15"
          status="active"
        />
        <PoolCard
          name="SURVEY RESPONSES #C1D4"
          budget="2.5 ETH"
          remaining="0.2 ETH"
          progress={92}
          sellers="18/20"
          status="ending"
        />
      </motion.div>
    </>
  );
}

// Joined pools tab
function JoinedPoolsTab() {
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="font-mono text-3xl font-black uppercase">
          JOINED POOLS
        </h1>
        <p className="mt-2 text-muted-foreground">
          Pools where you're contributing data
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
      >
        <PoolCard
          name="FITNESS METRICS #D3A1"
          budget="8.5 ETH"
          progress={75}
          sellers="45/60"
          status="verified"
          reward="0.14 ETH"
        />
        <PoolCard
          name="SPENDING HABITS #E2F8"
          budget="4.2 ETH"
          progress={55}
          sellers="22/40"
          status="pending"
          reward="0.11 ETH"
        />
        <PoolCard
          name="SLEEP PATTERNS #F4C9"
          budget="6.0 ETH"
          progress={85}
          sellers="34/40"
          status="submitted"
          reward="0.15 ETH"
        />
      </motion.div>
    </>
  );
}

// Activity tab
function ActivityTab() {
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="font-mono text-3xl font-black uppercase">ACTIVITY</h1>
        <p className="mt-2 text-muted-foreground">Your recent transactions</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="border-2 border-border bg-card"
      >
        <ActivityItem
          type="verified"
          pool="FITNESS METRICS #D3A1"
          time="2 hours ago"
          amount="0.14 ETH"
        />
        <ActivityItem type="joined" pool="SLEEP PATTERNS #F4C9" time="1 day ago" />
        <ActivityItem
          type="created"
          pool="HEALTH DATA POOL #A4F2"
          time="3 days ago"
        />
        <ActivityItem
          type="submitted"
          pool="SPENDING HABITS #E2F8"
          time="5 days ago"
        />
        <ActivityItem
          type="verified"
          pool="LOCATION DATA #B7E9"
          time="1 week ago"
          amount="0.16 ETH"
        />
      </motion.div>
    </>
  );
}

// Stat card component
function StatCard({
  label,
  value,
  change,
  positive,
}: {
  label: string;
  value: string;
  change: string;
  positive: boolean;
}) {
  return (
    <div className="border-2 border-border bg-card p-6 transition-all hover:border-primary">
      <div className="mb-2 font-mono text-xs text-muted-foreground">{label}</div>
      <div className="mb-2 font-mono text-3xl font-black">{value}</div>
      <div
        className={`font-mono text-xs ${positive ? "text-primary" : "text-destructive"}`}
      >
        {change}
      </div>
    </div>
  );
}

// Action card component
function ActionCard({
  icon,
  title,
  description,
  href,
}: {
  icon: string;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group border-2 border-border bg-card p-6 transition-all hover:border-primary hover:bg-primary/5"
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center border-2 border-foreground bg-foreground font-mono text-2xl text-background transition-all group-hover:border-primary group-hover:bg-primary">
        {icon}
      </div>
      <h3 className="mb-2 font-mono text-sm font-bold uppercase">{title}</h3>
      <p className="text-xs text-muted-foreground">{description}</p>
    </Link>
  );
}

// Pool card component
function PoolCard({
  name,
  budget,
  remaining,
  progress,
  sellers,
  status,
  reward,
}: {
  name: string;
  budget: string;
  remaining?: string;
  progress: number;
  sellers: string;
  status: string;
  reward?: string;
}) {
  return (
    <div className="group cursor-pointer border-2 border-border bg-card p-6 transition-all hover:border-primary hover:bg-primary/5">
      <div className="mb-4 flex items-start justify-between">
        <h3 className="font-mono text-sm font-bold uppercase">{name}</h3>
        <span
          className={`font-mono text-xs uppercase ${
            status === "active"
              ? "text-primary"
              : status === "verified"
                ? "text-primary"
                : status === "ending"
                  ? "text-accent"
                  : status === "submitted"
                    ? "text-accent"
                    : "text-muted-foreground"
          }`}
        >
          [{status}]
        </span>
      </div>

      <div className="mb-4 space-y-2">
        <div className="flex justify-between font-mono text-xs">
          <span className="text-muted-foreground">BUDGET</span>
          <span className="text-foreground">{budget}</span>
        </div>
        {remaining && (
          <div className="flex justify-between font-mono text-xs">
            <span className="text-muted-foreground">REMAINING</span>
            <span className="text-accent">{remaining}</span>
          </div>
        )}
        {reward && (
          <div className="flex justify-between font-mono text-xs">
            <span className="text-muted-foreground">REWARD</span>
            <span className="text-primary">{reward}</span>
          </div>
        )}
      </div>

      <div className="mb-4">
        <div className="mb-2 flex justify-between font-mono text-xs text-muted-foreground">
          <span>{sellers}</span>
          <span>{progress}%</span>
        </div>
        <div className="h-1 w-full bg-muted">
          <div
            className="h-full bg-primary"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// Activity item component
function ActivityItem({
  type,
  pool,
  time,
  amount,
}: {
  type: string;
  pool: string;
  time: string;
  amount?: string;
}) {
  const getIcon = () => {
    switch (type) {
      case "verified":
        return "✓";
      case "joined":
        return "→";
      case "created":
        return "+";
      case "submitted":
        return "↑";
      default:
        return "•";
    }
  };

  const getLabel = () => {
    switch (type) {
      case "verified":
        return "PROOF VERIFIED";
      case "joined":
        return "JOINED POOL";
      case "created":
        return "CREATED POOL";
      case "submitted":
        return "SUBMITTED PROOF";
      default:
        return "ACTIVITY";
    }
  };

  return (
    <div className="flex items-center justify-between border-b-2 border-border p-4 last:border-b-0">
      <div className="flex items-center gap-4">
        <div
          className={`flex h-10 w-10 items-center justify-center border-2 font-mono text-sm ${
            type === "verified"
              ? "border-primary bg-primary/10 text-primary"
              : "border-border bg-background text-muted-foreground"
          }`}
        >
          {getIcon()}
        </div>
        <div>
          <div className="font-mono text-xs font-bold uppercase">{getLabel()}</div>
          <div className="font-mono text-xs text-muted-foreground">{pool}</div>
        </div>
      </div>
      <div className="text-right">
        {amount && (
          <div className="font-mono text-sm font-bold text-primary">+{amount}</div>
        )}
        <div className="font-mono text-xs text-muted-foreground">{time}</div>
      </div>
    </div>
  );
}
