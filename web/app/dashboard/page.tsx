"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { useState } from "react";
import { Header } from "@/components/header";
import { useUserProfile } from "@/hooks/useUserProfile";
import { Copy, ExternalLink } from "lucide-react";

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const { profile, loading, needsOnboarding } = useUserProfile();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

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
                    <span>Once complete, you'll automatically get access to the dashboard</span>
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
                className="ml-auto border border-border bg-background p-2 transition-all hover:border-primary hover:bg-primary/5"
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
              icon="⚙"
              label="ACCOUNT"
              active={activeTab === "account"}
              onClick={() => setActiveTab("account")}
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
            <AnimatePresence mode="wait">
              {activeTab === "overview" && <OverviewTab address={address} profile={profile} />}
              {activeTab === "created" && <CreatedPoolsTab />}
              {activeTab === "joined" && <JoinedPoolsTab />}
              {activeTab === "activity" && <ActivityTab />}
              {activeTab === "account" && <AccountDetailsTab address={address} profile={profile} />}
            </AnimatePresence>
          </div>
        </main>
      </div>
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
function OverviewTab({ address, profile }: { address: string | undefined; profile: any }) {
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
    </motion.div>
  );
}

// Account Details Tab
function AccountDetailsTab({ address, profile }: { address: string | undefined; profile: any }) {
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
                      onClick={() => copyToClipboard(profile.userContractAddress, "contract")}
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
function CreatedPoolsTab() {
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
          <h1 className="font-mono text-3xl font-black uppercase">MY POOLS</h1>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link
              href="/pools/create"
              className="brutal-shadow border-2 border-primary bg-primary px-6 py-3 font-mono text-xs font-bold uppercase text-primary-foreground transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
            >
              + CREATE
            </Link>
          </motion.div>
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
    </motion.div>
  );
}

// Joined pools tab
function JoinedPoolsTab() {
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
    </motion.div>
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
}: {
  icon: string;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link href={href}>
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
