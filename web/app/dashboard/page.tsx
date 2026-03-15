"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useSignMessage } from "wagmi";
import { useState, useEffect } from "react";
import { Header } from "@/components/header";
import { useUserProfile } from "@/hooks/useUserProfile";
import { Copy, ExternalLink, X, Menu } from "lucide-react";
import { CreatePoolModal } from "@/components/create-pool-modal";
import { useUserCreatedPools } from "@/hooks/usePools";
import { PoolCard as PoolCardComponent } from "@/components/pool-card";
import { useUserStats, useUserJoinedPools } from "@/lib/contracts/hooks";
import { formatEther } from "viem";

export default function DashboardPage() {
  const { address, isConnected, chainId } = useAccount();
  const { profile, loading, needsOnboarding } = useUserProfile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [createPoolOpen, setCreatePoolOpen] = useState(false);

  // Open sidebar on desktop by default
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
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
              {activeTab === "purchases" && <PurchasesTab address={address} chainId={chainId} />}
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
  const { totalEarned, createdPoolsCount, joinedPoolsCount, purchasedAssetsCount, providedAssetsCount, isLoading: statsLoading } = useUserStats(
    profile?.userContractAddress as `0x${string}` | undefined
  );

  // Format stats for display
  const poolsCreated = createdPoolsCount ? Number(createdPoolsCount) : 0;
  const poolsJoined = joinedPoolsCount ? Number(joinedPoolsCount) : 0;
  const purchasedAssets = purchasedAssetsCount ? Number(purchasedAssetsCount) : 0;
  const providedAssets = providedAssetsCount ? Number(providedAssetsCount) : 0;
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
        <StatCard label="POOLS CREATED" value={statsLoading ? "..." : String(poolsCreated)} change="—" positive={poolsCreated > 0} />
        <StatCard label="POOLS JOINED" value={statsLoading ? "..." : String(poolsJoined)} change="—" positive={poolsJoined > 0} />
        <StatCard label="ASSETS SHARED" value={statsLoading ? "..." : String(providedAssets)} change={`Bought ${purchasedAssets}`} positive={providedAssets > 0 || purchasedAssets > 0} />
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
            title="INVENTORY"
            description="Browse verified assets"
            href="/inventory"
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

type DashboardAsset = {
  assetId: string;
  category: string;
  subtype: string | null;
  proofTypeId: string;
  encryptedCID: string;
  searchableAttributes: Record<string, unknown>;
  verifiedAt: string | null;
  grantedAt?: string | null;
  sellerAddress?: string;
  resalePolicy?: string;
  listingStatus?: string;
  basePrice?: string;
  poolAddress?: string | null;
};

function PurchasesTab({ address, chainId }: { address: string | undefined; chainId: number | undefined }) {
  const [purchasedAssets, setPurchasedAssets] = useState<DashboardAsset[]>([]);
  const [providedAssets, setProvidedAssets] = useState<DashboardAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState<DashboardAsset | null>(null);

  useEffect(() => {
    const loadAssets = async () => {
      if (!address || !chainId) {
        setPurchasedAssets([]);
        setProvidedAssets([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const [accessRes, providedRes] = await Promise.all([
          fetch(`/api/inventory/access?buyerAddress=${address}&chainId=${chainId}`),
          fetch(`/api/inventory/assets?sellerAddress=${address}&includeArchived=true`),
        ]);

        const accessJson = await accessRes.json();
        const providedJson = await providedRes.json();

        setPurchasedAssets(accessJson.items || []);
        setProvidedAssets(providedJson.items || []);
      } finally {
        setIsLoading(false);
      }
    };

    loadAssets().catch(() => setIsLoading(false));
  }, [address, chainId]);

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
          ASSET ACCESS
        </h1>
        <p className="mt-2 text-muted-foreground">
          Purchased verified assets and data you have contributed to the network
        </p>
      </motion.div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="border-2 border-border bg-card p-6 animate-pulse">
              <div className="h-6 bg-muted mb-4 w-1/3" />
              <div className="h-4 bg-muted mb-2 w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-8 xl:grid-cols-2">
          <AssetSection
            title="PURCHASED ASSETS"
            subtitle={`Assets you can decrypt now (${purchasedAssets.length})`}
            emptyTitle="No purchased assets yet"
            emptyDescription="Buy from verified inventory or fulfill your pool requests to see assets here."
            items={purchasedAssets}
            actionLabel="DECRYPT"
            onSelect={setSelectedAsset}
          />
          <AssetSection
            title="PROVIDED ASSETS"
            subtitle={`Assets you supplied as a seller (${providedAssets.length})`}
            emptyTitle="No provided assets yet"
            emptyDescription="Join a pool or submit verified data to start building reusable inventory."
            items={providedAssets}
            actionLabel="VIEW"
            onSelect={setSelectedAsset}
          />
        </div>
      )}

      {selectedAsset && (
        <AssetDetailModal
          asset={selectedAsset}
          chainId={chainId}
          canDecrypt={purchasedAssets.some((item) => item.assetId === selectedAsset.assetId)}
          onClose={() => setSelectedAsset(null)}
        />
      )}
    </motion.div>
  );
}

function AssetSection({
  title,
  subtitle,
  emptyTitle,
  emptyDescription,
  items,
  actionLabel,
  onSelect,
}: {
  title: string;
  subtitle: string;
  emptyTitle: string;
  emptyDescription: string;
  items: DashboardAsset[];
  actionLabel: string;
  onSelect: (asset: DashboardAsset) => void;
}) {
  return (
    <div>
      <div className="mb-4">
        <h2 className="font-mono text-lg font-bold uppercase">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>

      {items.length === 0 ? (
        <div className="flex min-h-[240px] flex-col items-center justify-center border-2 border-dashed border-border p-8 text-center">
          <div className="mb-4 text-5xl opacity-20">◆</div>
          <h3 className="mb-2 font-mono text-lg font-bold uppercase">{emptyTitle}</h3>
          <p className="max-w-md text-sm text-muted-foreground">{emptyDescription}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((asset) => (
            <div key={asset.assetId} className="border-2 border-border bg-card p-5 transition-all hover:border-primary">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-xs uppercase text-primary">{asset.proofTypeId}</p>
                  <h3 className="mt-1 font-mono text-lg font-bold uppercase">{asset.category}</h3>
                  {asset.subtype && <p className="mt-1 text-sm text-muted-foreground">{asset.subtype}</p>}
                </div>
                <button
                  onClick={() => onSelect(asset)}
                  className="border-2 border-primary bg-primary/10 px-4 py-2 font-mono text-xs font-bold uppercase text-primary transition-all hover:bg-primary hover:text-primary-foreground"
                >
                  {actionLabel}
                </button>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {Object.entries(asset.searchableAttributes || {}).slice(0, 4).map(([key, value]) => (
                  <span key={key} className="border border-primary/30 bg-primary/5 px-2 py-1 font-mono text-xs">
                    {key}: {String(value)}
                  </span>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-4 font-mono text-xs text-muted-foreground">
                <span>Asset: {asset.assetId.slice(0, 10)}...{asset.assetId.slice(-8)}</span>
                {asset.basePrice && <span>Price: {asset.basePrice} ETH</span>}
                {asset.resalePolicy && <span>Resale: {asset.resalePolicy.replace('_', ' ')}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AssetDetailModal({ asset, chainId, canDecrypt, onClose }: { asset: DashboardAsset; chainId: number | undefined; canDecrypt: boolean; onClose: () => void }) {
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [decryptedEmail, setDecryptedEmail] = useState<string | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptError, setDecryptError] = useState<string | null>(null);
  const encryptedCID = asset.encryptedCID;
  const isEncryptedRef = encryptedCID.startsWith('cvm_');
  const displayEmail = decryptedEmail || (!isEncryptedRef && encryptedCID.includes('@') ? encryptedCID : null);

  const handleDecrypt = async () => {
    if (!address || !chainId || !canDecrypt) {
      setDecryptError('Connect wallet to decrypt.');
      return;
    }
    setIsDecrypting(true);
    setDecryptError(null);
    try {
      const message = `Decrypt assets:${asset.assetId}`;
      const signature = await signMessageAsync({ message });

      const response = await fetch('/api/tee/decrypt-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetIds: [asset.assetId],
          buyerAddress: address,
          signature,
          chainId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Decryption failed' }));
        throw new Error(errorData.error || 'Decryption failed');
      }

      const result = await response.json();
      const match = (result.results || []).find((item: { encryptedCID: string; recipientEmail: string }) => item.encryptedCID === encryptedCID);
      setDecryptedEmail(match?.recipientEmail || null);
    } catch (error: unknown) {
      setDecryptError(error instanceof Error ? error.message : 'Decryption failed');
    } finally {
      setIsDecrypting(false);
    }
  };

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
              ASSET DATA
            </h2>
            <p className="mt-1 text-xs opacity-80">
              {asset.assetId.slice(0, 10)}...{asset.assetId.slice(-8)}
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
            <div className="divide-y-2 divide-border">
              {/* Metadata Section */}
              <div className="p-6 bg-card">
                <h3 className="font-mono text-xs font-bold uppercase text-muted-foreground mb-4">
                  RECORD INFO
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="font-mono text-xs text-muted-foreground block mb-1">CATEGORY</span>
                    <span className="font-mono text-sm text-foreground">
                      {asset.category}
                    </span>
                  </div>
                  <div>
                    <span className="font-mono text-xs text-muted-foreground block mb-1">VERIFIED</span>
                    <span className="font-mono text-sm text-foreground">
                      {asset.verifiedAt ? new Date(asset.verifiedAt).toLocaleString() : 'Unknown'}
                    </span>
                  </div>
                  <div>
                    <span className="font-mono text-xs text-muted-foreground block mb-1">PROOF TYPE</span>
                    <span className="font-mono text-sm text-foreground">
                      {asset.proofTypeId}
                    </span>
                  </div>
                  <div>
                    <span className="font-mono text-xs text-muted-foreground block mb-1">DATA REF</span>
                    <span className="font-mono text-sm text-foreground">
                      {encryptedCID.slice(0, 10)}...{encryptedCID.slice(-8)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <h3 className="font-mono text-xs font-bold uppercase text-muted-foreground mb-4">
                  {displayEmail ? 'DECRYPTED DATA' : 'ASSET PREVIEW'}
                </h3>
                <div className="border-2 border-border bg-card">
                  <pre className="p-4 font-mono text-xs whitespace-pre-wrap break-words max-h-[300px] overflow-auto">
                    {displayEmail || JSON.stringify(asset.searchableAttributes || {}, null, 2) || 'No content available'}
                  </pre>
                </div>
                {canDecrypt && isEncryptedRef && !displayEmail && (
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div className="text-xs text-muted-foreground">
                      Encrypted in TEE. Sign to decrypt and view.
                    </div>
                    <button
                      onClick={handleDecrypt}
                      disabled={isDecrypting}
                      className="border-2 border-primary bg-primary px-4 py-2 font-mono text-xs font-bold uppercase text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-60"
                    >
                      {isDecrypting ? 'DECRYPTING...' : 'DECRYPT'}
                    </button>
                  </div>
                )}
                {!canDecrypt && (
                  <div className="mt-4 text-xs text-muted-foreground">
                    This asset is listed in your seller inventory. Only buyers with access can decrypt it.
                  </div>
                )}
                {decryptError && (
                  <div className="mt-3 text-xs text-destructive">
                    {decryptError}
                  </div>
                )}
              </div>
            </div>
        </div>

        {/* Footer */}
        <div className="border-t-2 border-border bg-card p-4">
          <div className="flex justify-between items-center">
            <span className="font-mono text-xs text-muted-foreground">
              Verified on-chain • AssetRegistry access
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
