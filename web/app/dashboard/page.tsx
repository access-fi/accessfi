"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { useState, useEffect } from "react";
import { Header } from "@/components/header";
import { useUserProfile } from "@/hooks/useUserProfile";
import { Copy, ExternalLink, X, Menu } from "lucide-react";
import { CreatePoolModal } from "@/components/create-pool-modal";
import { useUserCreatedPools } from "@/hooks/usePools";
import { PoolCard as PoolCardComponent } from "@/components/pool-card";
import { useUserStats, useUserJoinedPools, useGetBuyerTokens, useTokenMetadata, usePoolInfo } from "@/lib/contracts/hooks";
import { formatEther } from "viem";

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const { profile, loading, needsOnboarding } = useUserProfile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [createPoolOpen, setCreatePoolOpen] = useState(false);

  // Open sidebar on desktop by default
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && !sidebarOpen) {
        setSidebarOpen(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-background">
        <div className="grid-pattern fixed inset-0 opacity-30" />
        <Header />
        <div className="relative z-10 flex min-h-[80vh] items-center justify-center px-6">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-4"
            >
              <div className="mx-auto h-12 w-12 animate-spin border-4 border-border border-t-primary"></div>
            </motion.div>
            <p className="font-mono text-sm text-muted-foreground">LOADING...</p>
          </div>
        </div>
      </div>
    );
  }

  // Not connected state
  if (!isConnected) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-background">
        <div className="grid-pattern fixed inset-0 opacity-30" />

        <Header />

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
                    className="border-2 border-primary bg-primary px-8 py-4 font-mono text-sm font-bold uppercase text-primary-foreground transition-all hover:bg-primary/90"
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

  // Profile not created state - CRITICAL: Block dashboard access
  if (needsOnboarding || !profile) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-background">
        <div className="grid-pattern fixed inset-0 opacity-30" />

        <Header />

        <div className="relative z-10 flex min-h-[80vh] items-center justify-center px-6">
          <div className="max-w-2xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              {/* Warning Icon */}
              <div className="mb-6 flex justify-center">
                <div className="flex h-20 w-20 items-center justify-center border-4 border-primary bg-primary/10">
                  <span className="font-mono text-4xl text-primary">!</span>
                </div>
              </div>

              <h1 className="mb-4 font-mono text-4xl font-black uppercase">
                ACCOUNT SETUP REQUIRED
              </h1>
              <p className="mb-6 text-lg text-muted-foreground">
                Please complete your account creation to access the dashboard.
              </p>

              {/* Instructions */}
              <div className="mb-8 border-2 border-border bg-card p-6 text-left">
                <h3 className="mb-4 font-mono text-sm font-bold uppercase text-primary">
                  WHAT YOU NEED TO DO:
                </h3>
                <ul className="space-y-3 font-mono text-sm text-muted-foreground">
                  <li className="flex items-start gap-3">
                    <span className="text-primary">1.</span>
                    <span>The onboarding modal should appear automatically</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary">2.</span>
                    <span>Fill in your profile information (name, role, data preferences)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary">3.</span>
                    <span>Confirm the transaction to create your user contract</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary">4.</span>
                    <span>Once complete, you&apos;ll automatically get access to the dashboard</span>
                  </li>
                </ul>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col gap-4 sm:flex-row sm:justify-center"
            >
              <Link
                href="/"
                className="border-2 border-border bg-background px-8 py-4 font-mono text-sm font-bold uppercase transition-all hover:border-foreground hover:bg-card"
              >
                ← BACK TO HOME
              </Link>
            </motion.div>

            {/* Status indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-8 font-mono text-xs text-muted-foreground"
            >
              WALLET CONNECTED: {address?.slice(0, 6)}...{address?.slice(-4)}
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

      {/* Top nav */}
      <Header />

      <div className="relative z-10 flex">
        {/* Sidebar Overlay for Mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 md:hidden top-16"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed left-0 top-16 h-[calc(100vh-4rem)] border-r-2 border-border bg-background transition-all duration-300 z-40 md:relative md:top-0 md:h-[calc(100vh-4rem)] overflow-y-auto ${
            sidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0 md:w-20'
          }`}
        >
          {/* Toggle button - Desktop only */}
          <div className="hidden md:flex justify-end p-2">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="border border-border bg-background p-1.5 transition-all hover:border-primary hover:bg-primary/5"
              title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            >
              <div className="h-3 w-3 text-foreground text-xs flex items-center justify-center">
                {sidebarOpen ? "←" : "→"}
              </div>
            </button>
          </div>

          {/* Close button - Mobile only */}
          {sidebarOpen && (
            <div className="md:hidden flex justify-end p-2">
              <button
                onClick={() => setSidebarOpen(false)}
                className="border border-border bg-background p-1.5 transition-all hover:border-destructive hover:bg-destructive/5"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Sidebar menu */}
          <nav className="px-3 pb-4">
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
              icon="◆"
              label="PURCHASES"
              active={activeTab === "purchases"}
              onClick={() => setActiveTab("purchases")}
              collapsed={!sidebarOpen}
            />
            <SidebarItem
              icon="⚡"
              label="ACTIVITY"
              active={activeTab === "activity"}
              onClick={() => setActiveTab("activity")}
              collapsed={!sidebarOpen}
            />

            <div className="my-3 border-t border-border" />

            <SidebarItem
              icon="⚙"
              label="ACCOUNT"
              active={activeTab === "account"}
              onClick={() => setActiveTab("account")}
              collapsed={!sidebarOpen}
            />

            <div className="my-3 border-t border-border" />

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
        </aside>

        {/* Main content */}
        <main
          className={`min-h-[calc(100vh-4rem)] flex-1 transition-all duration-300 ${
            sidebarOpen ? "" : "md:ml-0"
          }`}
        >
          <div className="p-4 md:p-8">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden fixed bottom-6 right-6 z-20 border-2 border-primary bg-primary p-4 shadow-lg transition-all hover:bg-primary/90"
            >
              <Menu className="h-6 w-6 text-primary-foreground" />
            </button>

            <AnimatePresence mode="wait">
              {activeTab === "overview" && <OverviewTab address={address} profile={profile} onCreatePool={() => setCreatePoolOpen(true)} />}
              {activeTab === "created" && <CreatedPoolsTab onCreatePool={() => setCreatePoolOpen(true)} />}
              {activeTab === "joined" && <JoinedPoolsTab profile={profile} />}
              {activeTab === "purchases" && <PurchasesTab address={address} />}
              {activeTab === "activity" && <ActivityTab />}
              {activeTab === "account" && <AccountDetailsTab address={address} profile={profile} />}
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Create Pool Modal */}
      <CreatePoolModal
        open={createPoolOpen}
        onClose={() => setCreatePoolOpen(false)}
        onSuccess={() => {
          setCreatePoolOpen(false);
          // Optionally refresh pools or navigate
        }}
      />
    </div>
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
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`flex h-10 w-10 flex-shrink-0 items-center justify-center border-2 font-mono text-lg transition-all ${
          active
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border bg-background text-foreground group-hover:border-primary"
        }`}
      >
        {icon}
      </motion.div>
      {!collapsed && (
        <span
          className={`font-mono text-xs font-bold uppercase transition-colors ${
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
function OverviewTab({ address, profile, onCreatePool }: { address: string | undefined; profile: { fullName: string; role: string; createdAt: Date; userContractAddress?: string } | null; onCreatePool: () => void }) {
  // Fetch real stats from blockchain
  const { totalEarned, createdPoolsCount, joinedPoolsCount, isLoading: statsLoading } = useUserStats(
    profile?.userContractAddress as `0x${string}` | undefined
  );

  // Format stats for display
  const poolsCreated = createdPoolsCount ? Number(createdPoolsCount) : 0;
  const poolsJoined = joinedPoolsCount ? Number(joinedPoolsCount) : 0;
  const earned = totalEarned ? formatEther(totalEarned as bigint) : "0";

  return (
    <motion.div
      key="overview"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      {/* Page header with greeting */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="mb-2 font-mono text-3xl font-black uppercase">
          HELLO, {profile?.fullName || "USER"}
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
        <StatCard label="POOLS CREATED" value={statsLoading ? "..." : String(poolsCreated)} change="—" positive={false} />
        <StatCard label="POOLS JOINED" value={statsLoading ? "..." : String(poolsJoined)} change="—" positive={false} />
        <StatCard label="DATA SOLD" value={statsLoading ? "..." : String(poolsJoined)} change="—" positive={false} />
        <StatCard label="TOTAL EARNED" value={statsLoading ? "..." : `${earned} ETH`} change="—" positive={parseFloat(earned) > 0} />
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
            onClick={onCreatePool}
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

      {/* Recent pools - TODO: Load from blockchain */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="mb-4 font-mono text-lg font-bold uppercase">
          RECENT ACTIVITY
        </h2>
        <div className="flex min-h-[200px] items-center justify-center border-2 border-dashed border-border p-8 text-center">
          <div>
            <div className="mb-3 text-4xl opacity-20">📊</div>
            <p className="font-mono text-sm text-muted-foreground">
              No recent activity yet
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Account Details Tab
function AccountDetailsTab({ address, profile }: { address: string | undefined; profile: { fullName: string; role: string; userContractAddress?: string; createdAt: Date; dataToBuy?: string | null; dataToSell?: string | null } | null }) {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <motion.div
      key="account"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="mb-2 font-mono text-3xl font-black uppercase">
          ACCOUNT DETAILS
        </h1>
        <p className="font-mono text-sm text-muted-foreground">
          Your profile and contract information
        </p>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profile Information */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="border-2 border-border bg-card p-6"
        >
          <h3 className="mb-6 font-mono text-sm font-bold uppercase text-primary">
            PROFILE INFORMATION
          </h3>

          <div className="space-y-4">
            <DetailRow label="Full Name" value={profile?.fullName || "Not set"} />
            <DetailRow
              label="Role"
              value={
                profile?.role
                  ? profile.role === "both"
                    ? "Buyer & Seller"
                    : profile.role.charAt(0).toUpperCase() + profile.role.slice(1)
                  : "Not set"
              }
            />
            <DetailRow
              label="Account Created"
              value={profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "N/A"}
            />
          </div>
        </motion.div>

        {/* Contract Addresses */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="border-2 border-border bg-card p-6"
        >
          <h3 className="mb-6 font-mono text-sm font-bold uppercase text-primary">
            CONTRACT ADDRESSES
          </h3>

          <div className="space-y-4">
            {/* EOA Address */}
            <div>
              <div className="mb-2 font-mono text-xs text-muted-foreground">
                EOA (WALLET ADDRESS)
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 break-all font-mono text-xs text-foreground">
                  {address}
                </code>
                <button
                  onClick={() => copyToClipboard(address!, "eoa")}
                  className="border border-border bg-background p-2 transition-all hover:border-primary hover:bg-primary/5"
                  title="Copy address"
                >
                  <Copy className="h-3 w-3" />
                </button>
              </div>
              {copied === "eoa" && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-1 font-mono text-xs text-primary"
                >
                  ✓ Copied
                </motion.div>
              )}
            </div>

            {/* User Contract Address */}
            <div>
              <div className="mb-2 font-mono text-xs text-muted-foreground">
                USER CONTRACT ADDRESS
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 break-all font-mono text-xs text-foreground">
                  {profile?.userContractAddress || "Not deployed"}
                </code>
                {profile?.userContractAddress && (
                  <>
                    <button
                      onClick={() => copyToClipboard(profile.userContractAddress!, "contract")}
                      className="border border-border bg-background p-2 transition-all hover:border-primary hover:bg-primary/5"
                      title="Copy address"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                    <a
                      href={`https://sepolia.basescan.org/address/${profile.userContractAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="border border-border bg-background p-2 transition-all hover:border-primary hover:bg-primary/5"
                      title="View on BaseScan"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </>
                )}
              </div>
              {copied === "contract" && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-1 font-mono text-xs text-primary"
                >
                  ✓ Copied
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Data Interests */}
        {profile?.dataToBuy && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="border-2 border-border bg-card p-6"
          >
            <h3 className="mb-6 font-mono text-sm font-bold uppercase text-primary">
              DATA INTERESTS
            </h3>
            <div className="flex flex-wrap gap-2">
              {profile.dataToBuy.split(",").map((item: string, idx: number) => (
                <span
                  key={idx}
                  className="border border-primary/50 bg-primary/10 px-3 py-1 font-mono text-xs uppercase text-primary"
                >
                  {item.trim()}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {/* Data Offerings */}
        {profile?.dataToSell && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="border-2 border-border bg-card p-6"
          >
            <h3 className="mb-6 font-mono text-sm font-bold uppercase text-primary">
              DATA OFFERINGS
            </h3>
            <div className="flex flex-wrap gap-2">
              {profile.dataToSell.split(",").map((item: string, idx: number) => (
                <span
                  key={idx}
                  className="border border-accent/50 bg-accent/10 px-3 py-1 font-mono text-xs uppercase text-accent"
                >
                  {item.trim()}
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="mb-1 font-mono text-xs text-muted-foreground">{label}</div>
      <div className="font-mono text-sm font-bold text-foreground">{value}</div>
    </div>
  );
}

// Created pools tab
function CreatedPoolsTab({ onCreatePool }: { onCreatePool: () => void }) {
  const { poolAddresses, isLoading } = useUserCreatedPools();

  return (
    <motion.div
      key="created"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-mono text-3xl font-black uppercase">MY POOLS</h1>
            <p className="mt-2 text-muted-foreground">
              Pools you&apos;ve created ({poolAddresses.length})
            </p>
          </div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <button
              onClick={onCreatePool}
              className="brutal-shadow border-2 border-primary bg-primary px-6 py-3 font-mono text-xs font-bold uppercase text-primary-foreground transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
            >
              + CREATE
            </button>
          </motion.div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border border-border bg-card p-6 animate-pulse">
                <div className="h-4 bg-muted mb-4 w-3/4" />
                <div className="h-3 bg-muted mb-2 w-1/2" />
                <div className="h-3 bg-muted w-2/3" />
              </div>
            ))}
          </div>
        ) : poolAddresses.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {poolAddresses.map((poolAddress) => (
              <PoolCardComponent key={poolAddress} poolAddress={poolAddress} />
            ))}
          </div>
        ) : (
          <div className="flex min-h-[300px] flex-col items-center justify-center border-2 border-dashed border-border p-12 text-center">
            <div className="mb-4 text-6xl opacity-20">💼</div>
            <h3 className="mb-2 font-mono text-xl font-bold uppercase">No Pools Created</h3>
            <p className="mb-6 text-sm text-muted-foreground">
              Create your first data pool to start collecting verified data
            </p>
            <button
              onClick={onCreatePool}
              className="brutal-shadow border-2 border-primary bg-primary px-6 py-3 font-mono text-sm font-bold uppercase text-primary-foreground transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
            >
              + CREATE FIRST POOL
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// Joined pools tab
function JoinedPoolsTab({ profile }: { profile: { userContractAddress?: string } | null }) {
  const { poolAddresses, isLoading } = useUserJoinedPools(
    profile?.userContractAddress as `0x${string}` | undefined
  );

  return (
    <motion.div
      key="joined"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="font-mono text-3xl font-black uppercase">
          JOINED POOLS
        </h1>
        <p className="mt-2 text-muted-foreground">
          Pools where you&apos;re contributing data ({poolAddresses.length})
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border border-border bg-card p-6 animate-pulse">
                <div className="h-4 bg-muted mb-4 w-3/4" />
                <div className="h-3 bg-muted mb-2 w-1/2" />
                <div className="h-3 bg-muted w-2/3" />
              </div>
            ))}
          </div>
        ) : poolAddresses.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {poolAddresses.map((poolAddress) => (
              <PoolCardComponent key={poolAddress} poolAddress={poolAddress} />
            ))}
          </div>
        ) : (
          <div className="flex min-h-[300px] flex-col items-center justify-center border-2 border-dashed border-border p-12 text-center">
            <div className="mb-4 text-6xl opacity-20">🤝</div>
            <h3 className="mb-2 font-mono text-xl font-bold uppercase">No Pools Joined</h3>
            <p className="mb-6 text-sm text-muted-foreground">
              Browse available pools and join to start selling your data
            </p>
            <Link
              href="/pools"
              className="brutal-shadow border-2 border-primary bg-primary px-6 py-3 font-mono text-sm font-bold uppercase text-primary-foreground transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
            >
              BROWSE POOLS
            </Link>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// Activity tab
function ActivityTab() {
  return (
    <motion.div
      key="activity"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="mb-2 font-mono text-3xl font-black uppercase">ACTIVITY</h1>
        <p className="font-mono text-sm text-muted-foreground">Your recent transactions</p>
      </motion.div>

      {/* TODO: Load activity from blockchain */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex min-h-[300px] flex-col items-center justify-center border-2 border-dashed border-border p-12 text-center">
          <div className="mb-4 text-6xl opacity-20">⚡</div>
          <h3 className="mb-2 font-mono text-xl font-bold uppercase">No Activity Yet</h3>
          <p className="text-sm text-muted-foreground">
            Your transaction history will appear here
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Purchases tab - Shows data grouped by pools
function PurchasesTab({ address }: { address: string | undefined }) {
  const { data: tokenIds, isLoading } = useGetBuyerTokens(address as `0x${string}` | undefined);
  const [selectedPool, setSelectedPool] = useState<string | null>(null);
  const [selectedToken, setSelectedToken] = useState<bigint | null>(null);

  const tokens = (tokenIds as bigint[]) || [];

  return (
    <motion.div
      key="purchases"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="font-mono text-3xl font-black uppercase">
          MY DATA
        </h1>
        <p className="mt-2 text-muted-foreground">
          Verified data collected from your pools
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="border-2 border-border bg-card p-6 animate-pulse">
                <div className="h-6 bg-muted mb-4 w-1/3" />
                <div className="h-4 bg-muted mb-2 w-1/4" />
              </div>
            ))}
          </div>
        ) : tokens.length > 0 ? (
          <TokensByPoolView
            tokenIds={tokens}
            onSelectPool={setSelectedPool}
            onSelectToken={setSelectedToken}
          />
        ) : (
          <div className="flex min-h-[300px] flex-col items-center justify-center border-2 border-dashed border-border p-12 text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center border-2 border-border">
              <span className="text-4xl opacity-20">◆</span>
            </div>
            <h3 className="mb-2 font-mono text-xl font-bold uppercase">No Data Yet</h3>
            <p className="mb-6 text-sm text-muted-foreground max-w-md">
              When sellers submit verified data to your pools, it will appear here organized by pool
            </p>
            <Link
              href="/pools"
              className="brutal-shadow border-2 border-primary bg-primary px-6 py-3 font-mono text-sm font-bold uppercase text-primary-foreground transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
            >
              BROWSE POOLS
            </Link>
          </div>
        )}
      </motion.div>

      {/* Pool Data Modal */}
      {selectedPool && (
        <PoolDataModal
          poolAddress={selectedPool as `0x${string}`}
          tokenIds={tokens}
          onClose={() => setSelectedPool(null)}
          onSelectToken={setSelectedToken}
        />
      )}

      {/* Single Token Data Viewer */}
      {selectedToken !== null && (
        <EmailDataModal
          tokenId={selectedToken}
          onClose={() => setSelectedToken(null)}
        />
      )}
    </motion.div>
  );
}

// Groups tokens by pool and displays pool cards
function TokensByPoolView({
  tokenIds,
  onSelectPool,
  onSelectToken
}: {
  tokenIds: bigint[];
  onSelectPool: (pool: string) => void;
  onSelectToken: (token: bigint) => void;
}) {
  // We need to fetch metadata for each token to group by pool
  // For now, we'll render individual token fetchers that report back
  const [poolGroups, setPoolGroups] = useState<Record<string, bigint[]>>({});

  return (
    <div className="space-y-6">
      {/* Token metadata fetchers - hidden, just for grouping */}
      {tokenIds.map((tokenId) => (
        <TokenPoolGrouper
          key={tokenId.toString()}
          tokenId={tokenId}
          onPoolIdentified={(pool) => {
            setPoolGroups((prev) => {
              const existing = prev[pool] || [];
              if (!existing.find(t => t === tokenId)) {
                return { ...prev, [pool]: [...existing, tokenId] };
              }
              return prev;
            });
          }}
        />
      ))}

      {/* Pool cards */}
      {Object.keys(poolGroups).length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2">
          {Object.entries(poolGroups).map(([poolAddress, poolTokens]) => (
            <PoolDataCard
              key={poolAddress}
              poolAddress={poolAddress as `0x${string}`}
              tokenCount={poolTokens.length}
              onViewData={() => onSelectPool(poolAddress)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="h-8 w-8 animate-spin border-4 border-border border-t-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading pool data...</p>
        </div>
      )}
    </div>
  );
}

// Hidden component that fetches token metadata and reports pool
function TokenPoolGrouper({
  tokenId,
  onPoolIdentified
}: {
  tokenId: bigint;
  onPoolIdentified: (pool: string) => void;
}) {
  const { data: metadata } = useTokenMetadata(tokenId);

  useEffect(() => {
    if (metadata) {
      const tokenData = metadata as [string, string, string, string, bigint, boolean];
      const poolAddress = tokenData[3];
      if (poolAddress) {
        onPoolIdentified(poolAddress);
      }
    }
  }, [metadata, onPoolIdentified]);

  return null; // Hidden component
}

// Pool card showing pool name and data count
function PoolDataCard({
  poolAddress,
  tokenCount,
  onViewData
}: {
  poolAddress: `0x${string}`;
  tokenCount: number;
  onViewData: () => void;
}) {
  const { data: poolInfo, isLoading } = usePoolInfo(poolAddress);

  // Pool info tuple: [name, dataType, pricePerData, totalBudget, deadline, creator, proofRequirements, isActive]
  const poolData = poolInfo as [string, string, bigint, bigint, bigint, string, number[], boolean] | undefined;
  const poolName = poolData?.[0] || 'Unknown Pool';
  const dataType = poolData?.[1] || 'Data';

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className="border-2 border-border bg-card overflow-hidden transition-all hover:border-primary"
    >
      {/* Pool Header */}
      <div className="bg-primary/5 border-b-2 border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center border-2 border-primary bg-primary text-primary-foreground font-mono text-lg font-bold">
              {tokenCount}
            </div>
            <div>
              <h3 className="font-mono text-sm font-bold uppercase">
                {isLoading ? '...' : poolName}
              </h3>
              <p className="text-xs text-muted-foreground">
                {tokenCount} {tokenCount === 1 ? 'record' : 'records'} collected
              </p>
            </div>
          </div>
          <span className="font-mono text-xs text-primary uppercase">
            [{dataType}]
          </span>
        </div>
      </div>

      {/* Pool Stats */}
      <div className="p-4 space-y-3">
        <div className="flex justify-between font-mono text-xs">
          <span className="text-muted-foreground">POOL ADDRESS</span>
          <span className="text-foreground">
            {poolAddress.slice(0, 6)}...{poolAddress.slice(-4)}
          </span>
        </div>
        <div className="flex justify-between font-mono text-xs">
          <span className="text-muted-foreground">STATUS</span>
          <span className="text-primary">VERIFIED DATA</span>
        </div>
      </div>

      {/* Action */}
      <div className="border-t-2 border-border p-4">
        <button
          onClick={onViewData}
          className="w-full border-2 border-primary bg-primary px-4 py-3 font-mono text-xs font-bold uppercase text-primary-foreground transition-all hover:bg-primary/90"
        >
          VIEW ALL DATA →
        </button>
      </div>
    </motion.div>
  );
}

// Modal showing all data tokens from a specific pool
function PoolDataModal({
  poolAddress,
  tokenIds,
  onClose,
  onSelectToken
}: {
  poolAddress: `0x${string}`;
  tokenIds: bigint[];
  onClose: () => void;
  onSelectToken: (token: bigint) => void;
}) {
  const { data: poolInfo } = usePoolInfo(poolAddress);
  const poolData = poolInfo as [string, string, bigint, bigint, bigint, string, number[], boolean] | undefined;
  const poolName = poolData?.[0] || 'Pool Data';

  // Filter tokens that belong to this pool
  const [poolTokens, setPoolTokens] = useState<bigint[]>([]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative max-h-[85vh] w-full max-w-5xl overflow-hidden border-2 border-border bg-background"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-border bg-card p-6">
          <div>
            <h2 className="font-mono text-2xl font-black uppercase">
              {poolName}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {poolAddress.slice(0, 10)}...{poolAddress.slice(-8)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="border-2 border-border bg-background p-2 transition-all hover:border-destructive hover:bg-destructive/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto p-6">
          <div className="space-y-4">
            {tokenIds.map((tokenId) => (
              <PoolTokenRow
                key={tokenId.toString()}
                tokenId={tokenId}
                poolAddress={poolAddress}
                onView={() => {
                  onClose();
                  onSelectToken(tokenId);
                }}
                onBelongsToPool={(belongs) => {
                  if (belongs && !poolTokens.find(t => t === tokenId)) {
                    setPoolTokens(prev => [...prev, tokenId]);
                  }
                }}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t-2 border-border bg-card p-4">
          <div className="flex justify-between items-center">
            <span className="font-mono text-xs text-muted-foreground">
              {poolTokens.length} verified records
            </span>
            <button
              onClick={onClose}
              className="border-2 border-border bg-background px-6 py-2 font-mono text-xs font-bold uppercase transition-all hover:border-foreground"
            >
              CLOSE
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// Individual token row in pool data modal
function PoolTokenRow({
  tokenId,
  poolAddress,
  onView,
  onBelongsToPool
}: {
  tokenId: bigint;
  poolAddress: `0x${string}`;
  onView: () => void;
  onBelongsToPool: (belongs: boolean) => void;
}) {
  const { data: metadata, isLoading } = useTokenMetadata(tokenId);

  const tokenData = metadata as [string, string, string, string, bigint, boolean] | undefined;
  const encryptedCID = tokenData?.[0];
  const seller = tokenData?.[2];
  const tokenPool = tokenData?.[3];
  const mintedAt = tokenData?.[4];

  // Check if this token belongs to the current pool
  const belongsToPool = tokenPool?.toLowerCase() === poolAddress.toLowerCase();

  useEffect(() => {
    if (tokenPool) {
      onBelongsToPool(belongsToPool);
    }
  }, [tokenPool, belongsToPool, onBelongsToPool]);

  // Don't render if not from this pool
  if (!belongsToPool && tokenPool) return null;
  if (isLoading) return (
    <div className="border-2 border-border bg-card p-4 animate-pulse">
      <div className="h-4 bg-muted w-1/3" />
    </div>
  );

  // Parse email headers for preview
  const emailPreview = parseEmailPreview(encryptedCID || '');

  return (
    <motion.div
      whileHover={{ borderColor: "var(--color-primary)" }}
      className="border-2 border-border bg-card p-4 transition-all"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Token ID & Date */}
          <div className="flex items-center gap-3 mb-2">
            <span className="font-mono text-xs bg-primary/10 text-primary px-2 py-1 border border-primary/30">
              #{tokenId.toString()}
            </span>
            <span className="font-mono text-xs text-muted-foreground">
              {mintedAt ? new Date(Number(mintedAt) * 1000).toLocaleDateString() : ''}
            </span>
          </div>

          {/* Email Preview */}
          {emailPreview.from && (
            <div className="mb-2">
              <span className="font-mono text-xs text-muted-foreground">FROM: </span>
              <span className="font-mono text-xs text-foreground">{emailPreview.from}</span>
            </div>
          )}
          {emailPreview.subject && (
            <div className="mb-2">
              <span className="font-mono text-xs text-muted-foreground">SUBJECT: </span>
              <span className="font-mono text-xs text-foreground truncate">{emailPreview.subject}</span>
            </div>
          )}
          {!emailPreview.from && !emailPreview.subject && (
            <p className="font-mono text-xs text-muted-foreground">
              Email data ({encryptedCID?.length || 0} chars)
            </p>
          )}

          {/* Seller */}
          <div className="mt-2">
            <span className="font-mono text-xs text-muted-foreground">SELLER: </span>
            <span className="font-mono text-xs text-foreground">
              {seller ? `${seller.slice(0, 6)}...${seller.slice(-4)}` : 'Unknown'}
            </span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={onView}
          className="border-2 border-primary bg-primary/10 px-4 py-2 font-mono text-xs font-bold uppercase text-primary transition-all hover:bg-primary hover:text-primary-foreground whitespace-nowrap"
        >
          VIEW
        </button>
      </div>
    </motion.div>
  );
}

// Parse email headers for preview
function parseEmailPreview(content: string): { from?: string; subject?: string; date?: string } {
  if (!content) return {};

  const lines = content.split('\n');
  const result: { from?: string; subject?: string; date?: string } = {};

  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    if (lowerLine.startsWith('from:') && !result.from) {
      result.from = line.substring(5).trim().slice(0, 50);
    } else if (lowerLine.startsWith('subject:') && !result.subject) {
      result.subject = line.substring(8).trim().slice(0, 60);
    } else if (lowerLine.startsWith('date:') && !result.date) {
      result.date = line.substring(5).trim();
    }
    // Stop after headers (empty line marks end of headers)
    if (line.trim() === '' && (result.from || result.subject)) break;
  }

  return result;
}

// Modal to view formatted email data
function EmailDataModal({ tokenId, onClose }: { tokenId: bigint; onClose: () => void }) {
  const { data: metadata, isLoading } = useTokenMetadata(tokenId);

  const tokenData = metadata as [string, string, string, string, bigint, boolean] | undefined;
  const encryptedCID = tokenData?.[0] || '';
  const seller = tokenData?.[2];
  const poolAddress = tokenData?.[3];
  const mintedAt = tokenData?.[4];

  // Parse email content
  const emailData = parseEmailContent(encryptedCID);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative max-h-[90vh] w-full max-w-4xl overflow-hidden border-2 border-border bg-background"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-border bg-primary p-6">
          <div className="text-primary-foreground">
            <h2 className="font-mono text-xl font-black uppercase">
              EMAIL DATA
            </h2>
            <p className="mt-1 text-xs opacity-80">
              Token #{tokenId.toString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="border-2 border-primary-foreground/30 bg-primary-foreground/10 p-2 transition-all hover:bg-primary-foreground/20"
          >
            <X className="h-5 w-5 text-primary-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[65vh] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin border-4 border-border border-t-primary"></div>
            </div>
          ) : (
            <div className="divide-y-2 divide-border">
              {/* Metadata Section */}
              <div className="p-6 bg-card">
                <h3 className="font-mono text-xs font-bold uppercase text-muted-foreground mb-4">
                  RECORD INFO
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="font-mono text-xs text-muted-foreground block mb-1">SELLER</span>
                    <span className="font-mono text-sm text-foreground">
                      {seller ? `${seller.slice(0, 8)}...${seller.slice(-6)}` : 'Unknown'}
                    </span>
                  </div>
                  <div>
                    <span className="font-mono text-xs text-muted-foreground block mb-1">COLLECTED</span>
                    <span className="font-mono text-sm text-foreground">
                      {mintedAt ? new Date(Number(mintedAt) * 1000).toLocaleString() : 'Unknown'}
                    </span>
                  </div>
                  <div>
                    <span className="font-mono text-xs text-muted-foreground block mb-1">POOL</span>
                    <span className="font-mono text-sm text-foreground">
                      {poolAddress ? `${poolAddress.slice(0, 8)}...${poolAddress.slice(-6)}` : 'Unknown'}
                    </span>
                  </div>
                  <div>
                    <span className="font-mono text-xs text-muted-foreground block mb-1">DATA SIZE</span>
                    <span className="font-mono text-sm text-foreground">
                      {encryptedCID.length.toLocaleString()} characters
                    </span>
                  </div>
                </div>
              </div>

              {/* Email Headers Section */}
              {(emailData.from || emailData.to || emailData.subject || emailData.date) && (
                <div className="p-6">
                  <h3 className="font-mono text-xs font-bold uppercase text-muted-foreground mb-4">
                    EMAIL HEADERS
                  </h3>
                  <div className="space-y-3 border-2 border-border bg-card p-4">
                    {emailData.from && (
                      <div>
                        <span className="font-mono text-xs text-primary font-bold">FROM:</span>
                        <p className="font-mono text-sm text-foreground mt-1">{emailData.from}</p>
                      </div>
                    )}
                    {emailData.to && (
                      <div>
                        <span className="font-mono text-xs text-primary font-bold">TO:</span>
                        <p className="font-mono text-sm text-foreground mt-1">{emailData.to}</p>
                      </div>
                    )}
                    {emailData.subject && (
                      <div>
                        <span className="font-mono text-xs text-primary font-bold">SUBJECT:</span>
                        <p className="font-mono text-sm text-foreground mt-1">{emailData.subject}</p>
                      </div>
                    )}
                    {emailData.date && (
                      <div>
                        <span className="font-mono text-xs text-primary font-bold">DATE:</span>
                        <p className="font-mono text-sm text-foreground mt-1">{emailData.date}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Email Body Section */}
              <div className="p-6">
                <h3 className="font-mono text-xs font-bold uppercase text-muted-foreground mb-4">
                  {emailData.body ? 'EMAIL BODY' : 'RAW CONTENT'}
                </h3>
                <div className="border-2 border-border bg-card">
                  <pre className="p-4 font-mono text-xs whitespace-pre-wrap break-words max-h-[300px] overflow-auto">
                    {emailData.body || encryptedCID || 'No content available'}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t-2 border-border bg-card p-4">
          <div className="flex justify-between items-center">
            <span className="font-mono text-xs text-muted-foreground">
              Verified on-chain • zkEmail proof
            </span>
            <button
              onClick={onClose}
              className="border-2 border-primary bg-primary px-6 py-2 font-mono text-xs font-bold uppercase text-primary-foreground transition-all hover:bg-primary/90"
            >
              CLOSE
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// Parse full email content into structured data
function parseEmailContent(content: string): {
  from?: string;
  to?: string;
  subject?: string;
  date?: string;
  body?: string;
} {
  if (!content) return {};

  const result: {
    from?: string;
    to?: string;
    subject?: string;
    date?: string;
    body?: string;
  } = {};

  const lines = content.split('\n');
  let headersDone = false;
  const bodyLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (!headersDone) {
      const lowerLine = line.toLowerCase();

      if (lowerLine.startsWith('from:')) {
        result.from = line.substring(5).trim();
      } else if (lowerLine.startsWith('to:')) {
        result.to = line.substring(3).trim();
      } else if (lowerLine.startsWith('subject:')) {
        result.subject = line.substring(8).trim();
      } else if (lowerLine.startsWith('date:')) {
        result.date = line.substring(5).trim();
      } else if (line.trim() === '') {
        headersDone = true;
      }
    } else {
      bodyLines.push(line);
    }
  }

  if (bodyLines.length > 0) {
    result.body = bodyLines.join('\n').trim();
  }

  return result;
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
    <motion.div
      whileHover={{ scale: 1.02, borderColor: "var(--color-primary)" }}
      transition={{ type: "spring", stiffness: 300 }}
      className="border-2 border-border bg-card p-6 transition-colors"
    >
      <div className="mb-2 font-mono text-xs text-muted-foreground">{label}</div>
      <div className="mb-2 font-mono text-3xl font-black">{value}</div>
      <div
        className={`font-mono text-xs ${positive ? "text-primary" : "text-destructive"}`}
      >
        {change}
      </div>
    </motion.div>
  );
}

// Action card component
function ActionCard({
  icon,
  title,
  description,
  href,
  onClick,
}: {
  icon: string;
  title: string;
  description: string;
  href?: string;
  onClick?: () => void;
}) {
  const content = (
    <motion.div
      whileHover={{ scale: 1.02, borderColor: "var(--color-primary)" }}
      whileTap={{ scale: 0.98 }}
      className="group border-2 border-border bg-card p-6 transition-all hover:bg-primary/5"
    >
      <motion.div
        whileHover={{ rotate: [0, -10, 10, -10, 0] }}
        transition={{ duration: 0.5 }}
        className="mb-4 flex h-12 w-12 items-center justify-center border-2 border-foreground bg-foreground font-mono text-2xl text-background transition-all group-hover:border-primary group-hover:bg-primary"
      >
        {icon}
      </motion.div>
      <h3 className="mb-2 font-mono text-sm font-bold uppercase">{title}</h3>
      <p className="text-xs text-muted-foreground">{description}</p>
    </motion.div>
  );

  if (onClick) {
    return (
      <button onClick={onClick} className="w-full text-left">
        {content}
      </button>
    );
  }

  return <Link href={href || "#"}>{content}</Link>;
}

// Pool card component (reserved for future use)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    <motion.div
      whileHover={{ scale: 1.02, borderColor: "var(--color-primary)" }}
      className="group cursor-pointer border-2 border-border bg-card p-6 transition-all hover:bg-primary/5"
    >
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
        <div className="h-1 w-full bg-muted overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full bg-primary"
          />
        </div>
      </div>
    </motion.div>
  );
}

// Activity item component (reserved for future use)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ backgroundColor: "var(--color-primary)/0.05" }}
      className="flex items-center justify-between border-b-2 border-border p-4 last:border-b-0 transition-colors"
    >
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
    </motion.div>
  );
}
