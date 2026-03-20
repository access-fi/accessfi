"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { parseEther } from "viem";
import {
  ChevronDown,
  CheckCircle2,
  LockKeyhole,
  Search,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useBuyAsset } from "@/lib/contracts/hooks";

type InventoryAsset = {
  assetId: string;
  category: string;
  subtype: string | null;
  proofTypeId: string;
  basePrice: string;
  resalePolicy: string;
  searchableAttributes: Record<string, unknown>;
  verifiedAt: string | null;
};

type AccessibleAsset = {
  assetId: string;
  category: string;
  subtype: string | null;
  proofTypeId: string;
  encryptedCID: string;
  searchableAttributes: Record<string, unknown>;
  verifiedAt: string | null;
  grantedAt: string;
};

const filterSections = [
  "Category",
  "Proof type",
  "Privacy rules",
  "Freshness",
  "Resale policy",
  "Source",
  "Price range",
];

const categoryOptions = ["All", "Identity", "Subscription", "Behavioral", "Financial"];
const freshnessOptions = ["Any time", "24h", "7d", "30d"];
const privacyOptions = ["Any", "Selective access", "TEE encrypted", "Buyer-only"];

function formatRelative(dateString: string | null) {
  if (!dateString) return "Unknown";
  const diffMs = Date.now() - new Date(dateString).getTime();
  const diffMin = Math.max(1, Math.floor(diffMs / 60000));
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
}

function normalizeProofLabel(proofTypeId: string) {
  return proofTypeId
    .replace(/^zkemail:/, "")
    .replace(/[_-]/g, " ")
    .replace(/@v\d+$/, "")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function derivePrivacyLabel(asset: InventoryAsset) {
  if (asset.resalePolicy === "exclusive") return "Buyer-only";
  const subtype = `${asset.subtype || ""} ${asset.proofTypeId}`.toLowerCase();
  if (subtype.includes("email") || subtype.includes("identity")) return "Selective access";
  return "TEE encrypted";
}

function FilterGroup({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children?: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="overflow-hidden rounded-2xl border border-[#dfe5f1] bg-white shadow-[0_1px_0_rgba(15,23,42,0.03)]">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between px-4 py-3.5 text-left"
      >
        <span className="text-[15px] font-medium text-[#1f2937]">{title}</span>
        <ChevronDown className={`h-4 w-4 text-[#94a3b8] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open ? <div className="border-t border-[#eef2f7] px-4 py-4">{children}</div> : null}
    </div>
  );
}

export default function InventoryPage() {
  const { address, isConnected, chainId } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { profile } = useUserProfile();
  const { buyAsset, isPending: isBuying } = useBuyAsset(profile?.userContractAddress as `0x${string}` | undefined);

  const [assets, setAssets] = useState<InventoryAsset[]>([]);
  const [purchasedAssets, setPurchasedAssets] = useState<AccessibleAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [freshnessFilter, setFreshnessFilter] = useState("Any time");
  const [privacyFilter, setPrivacyFilter] = useState("Any");
  const [busyAssetId, setBusyAssetId] = useState<string | null>(null);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [decrypted, setDecrypted] = useState<Record<string, string>>({});

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const assetsRes = await fetch("/api/inventory/assets");
      const assetsJson = await assetsRes.json();
      const nextAssets = assetsJson.items || [];
      setAssets(nextAssets);
      setSelectedAssetId((current) => current ?? nextAssets[0]?.assetId ?? null);

      if (address && chainId) {
        const accessRes = await fetch(`/api/inventory/access?buyerAddress=${address}&chainId=${chainId}`);
        const accessJson = await accessRes.json();
        setPurchasedAssets(accessJson.items || []);
      } else {
        setPurchasedAssets([]);
      }

      setLoading(false);
    };

    load().catch(() => setLoading(false));
  }, [address, chainId]);

  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      const combined = `${asset.category} ${asset.subtype || ""} ${asset.proofTypeId}`.toLowerCase();
      const matchesSearch = !search || combined.includes(search.toLowerCase());
      const matchesCategory = categoryFilter === "All" || asset.category.toLowerCase() === categoryFilter.toLowerCase();
      const privacy = derivePrivacyLabel(asset);
      const matchesPrivacy = privacyFilter === "Any" || privacy === privacyFilter;
      const matchesFreshness = (() => {
        if (freshnessFilter === "Any time" || !asset.verifiedAt) return true;
        const diffHours = (Date.now() - new Date(asset.verifiedAt).getTime()) / 3600000;
        if (freshnessFilter === "24h") return diffHours <= 24;
        if (freshnessFilter === "7d") return diffHours <= 24 * 7;
        if (freshnessFilter === "30d") return diffHours <= 24 * 30;
        return true;
      })();
      return matchesSearch && matchesCategory && matchesPrivacy && matchesFreshness;
    });
  }, [assets, search, categoryFilter, freshnessFilter, privacyFilter]);

  useEffect(() => {
    if (!selectedAssetId || !filteredAssets.some((asset) => asset.assetId === selectedAssetId)) {
      setSelectedAssetId(filteredAssets[0]?.assetId ?? null);
    }
  }, [filteredAssets, selectedAssetId]);

  const selectedAsset = filteredAssets.find((asset) => asset.assetId === selectedAssetId) ?? null;
  const purchasedIds = new Set(purchasedAssets.map((asset) => asset.assetId));

  const purchaseAsset = async (assetId: string) => {
    if (!address || !chainId || !profile?.userContractAddress) return;
    setBusyAssetId(assetId);
    try {
      const asset = assets.find((item) => item.assetId === assetId);
      if (!asset) throw new Error("Asset not found");
      await buyAsset(assetId as `0x${string}`, parseEther(asset.basePrice));
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const accessRes = await fetch(`/api/inventory/access?buyerAddress=${address}&chainId=${chainId}`);
      const accessJson = await accessRes.json();
      setPurchasedAssets(accessJson.items || []);
    } finally {
      setBusyAssetId(null);
    }
  };

  const decryptPurchased = async () => {
    if (!address || !chainId || purchasedAssets.length === 0) return;
    const assetIds = purchasedAssets.map((asset) => asset.assetId);
    const message = `Decrypt assets:${assetIds.join(",")}`;
    const signature = await signMessageAsync({ message });

    const response = await fetch("/api/tee/decrypt-batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assetIds, buyerAddress: address, signature, chainId }),
    });
    const json = await response.json();
    if (!response.ok) throw new Error(json.error || "Decrypt failed");

    const next: Record<string, string> = {};
    for (const item of json.results || []) next[item.encryptedCID] = item.recipientEmail;
    setDecrypted(next);
  };

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-[#101828]">
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:42px_42px]" />

      <div className="relative z-10">
        <Header />

        <main className="mx-auto flex w-full max-w-[98rem] flex-col px-4 pb-10 pt-5 md:px-6 lg:px-8">
          <section className="overflow-hidden rounded-[30px] border border-[#dce3ee] bg-white shadow-[0_24px_80px_rgba(52,72,111,0.08)]">
            <div className="border-b border-[#edf1f5] px-5 py-4 md:px-7">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm font-medium text-[#64748b]">Verified inventory</p>
                  <h1 className="mt-1 text-[2rem] font-semibold tracking-[-0.05em] text-[#111827] md:text-[2.35rem]">
                    Preview verified supply before you commit.
                  </h1>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-2 rounded-xl border border-[#d9e2ef] bg-[#fafcff] px-3 py-3 text-sm text-[#4b5563] sm:min-w-[320px]">
                    <Search className="h-4 w-4 text-[#94a3b8]" />
                    <input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search category, subtype, or proof"
                      className="w-full bg-transparent outline-none placeholder:text-[#94a3b8]"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button className="rounded-xl border border-[#d9e2ef] bg-white px-4 py-3 text-sm font-medium text-[#21314d]">
                      Past searches
                    </button>
                    <button className="rounded-xl border border-[#d9e2ef] bg-white px-4 py-3 text-sm font-medium text-[#21314d]">
                      Save search
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid min-h-[72vh] gap-0 xl:grid-cols-[320px_minmax(0,1fr)]">
              <aside className="border-r border-[#edf1f5] bg-[#fbfcfe] px-4 py-4">
                <div className="mb-4 flex items-center gap-2 px-2 text-sm font-semibold text-[#1d2942]">
                  <SlidersHorizontal className="h-4 w-4 text-[#64748b]" />
                  Refine with filters
                </div>

                <div className="space-y-4">
                  <FilterGroup title="Category" defaultOpen>
                    <div className="flex flex-wrap gap-2">
                      {categoryOptions.map((option) => (
                        <button
                          key={option}
                          onClick={() => setCategoryFilter(option)}
                          className={`rounded-full px-3 py-2 text-sm transition-all ${
                            categoryFilter === option
                              ? "bg-[#2563eb] text-white shadow-[0_10px_24px_rgba(37,99,235,0.18)]"
                              : "border border-[#dde5f0] bg-white text-[#4b5563]"
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </FilterGroup>

                  <FilterGroup title="Freshness" defaultOpen>
                    <div className="space-y-2">
                      {freshnessOptions.map((option) => (
                        <button
                          key={option}
                          onClick={() => setFreshnessFilter(option)}
                          className={`flex w-full items-center justify-between rounded-2xl px-3 py-3 text-sm transition-all ${
                            freshnessFilter === option
                              ? "bg-[#eef4ff] text-[#173059] ring-1 ring-[#bfd3ff]"
                              : "bg-white text-[#4b5563] hover:bg-[#f8fafc]"
                          }`}
                        >
                          {option}
                          {freshnessFilter === option ? <span className="h-2.5 w-2.5 rounded-full bg-[#2563eb]" /> : null}
                        </button>
                      ))}
                    </div>
                  </FilterGroup>

                  <FilterGroup title="Privacy rules" defaultOpen>
                    <div className="space-y-2">
                      {privacyOptions.map((option) => (
                        <button
                          key={option}
                          onClick={() => setPrivacyFilter(option)}
                          className={`flex w-full items-center justify-between rounded-2xl px-3 py-3 text-sm transition-all ${
                            privacyFilter === option
                              ? "bg-[#eef4ff] text-[#173059] ring-1 ring-[#bfd3ff]"
                              : "bg-white text-[#4b5563] hover:bg-[#f8fafc]"
                          }`}
                        >
                          {option}
                          {privacyFilter === option ? <span className="h-2.5 w-2.5 rounded-full bg-[#2563eb]" /> : null}
                        </button>
                      ))}
                    </div>
                  </FilterGroup>

                  {filterSections.slice(3).map((section) => (
                    <FilterGroup key={section} title={section} />
                  ))}
                </div>
              </aside>

              <section className="flex min-h-0 flex-col bg-white">
                <div className="flex items-center justify-between border-b border-[#edf1f5] px-5 py-4">
                  <div>
                    <p className="text-sm font-semibold text-[#111827]">Preview</p>
                    <p className="mt-1 text-xs text-[#6b7280]">Showing {filteredAssets.length} verified results</p>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-[#f8fafc] px-3 py-2 text-xs font-medium text-[#667085]">
                    <Sparkles className="h-3.5 w-3.5 text-[#64748b]" />
                    Inventory first, request gaps only
                  </div>
                </div>

                <div className="min-h-0 flex-1 overflow-auto">
                  <table className="min-w-full border-separate border-spacing-0 text-left">
                    <thead className="sticky top-0 z-10 bg-white">
                      <tr className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#94a3b8]">
                        <th className="border-b border-[#e5ebf8] px-5 py-4">#</th>
                        <th className="border-b border-[#e5ebf8] px-5 py-4">Signal</th>
                        <th className="border-b border-[#e5ebf8] px-5 py-4">Proof</th>
                        <th className="border-b border-[#e5ebf8] px-5 py-4">Privacy</th>
                        <th className="border-b border-[#e5ebf8] px-5 py-4">Source</th>
                        <th className="border-b border-[#e5ebf8] px-5 py-4">Freshness</th>
                        <th className="border-b border-[#e5ebf8] px-5 py-4 text-right">Price</th>
                        <th className="border-b border-[#e5ebf8] px-5 py-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan={8} className="px-5 py-10 text-center text-sm text-[#617395]">Loading verified inventory…</td>
                        </tr>
                      ) : filteredAssets.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-5 py-10 text-center text-sm text-[#617395]">No verified inventory matches these filters yet.</td>
                        </tr>
                      ) : (
                        filteredAssets.map((asset, index) => {
                          const selected = selectedAssetId === asset.assetId;
                          const purchased = purchasedIds.has(asset.assetId);
                          const privacyLabel = derivePrivacyLabel(asset);
                          return (
                            <tr
                              key={asset.assetId}
                              onClick={() => setSelectedAssetId(asset.assetId)}
                              className={`cursor-pointer transition-colors ${selected ? "bg-[#f8fbff]" : "hover:bg-[#fafcff]"}`}
                            >
                              <td className="border-b border-[#eef2f7] px-5 py-3 text-sm text-[#94a3b8]">{index + 1}</td>
                              <td className="border-b border-[#eef2f7] px-5 py-3 align-top">
                                <div className="font-medium text-[#111827]">{asset.category}</div>
                                <div className="mt-0.5 text-xs text-[#6b7280]">{asset.subtype || "Verified signal"}</div>
                              </td>
                              <td className="border-b border-[#eef2f7] px-5 py-3 text-sm text-[#1f2937]">{normalizeProofLabel(asset.proofTypeId)}</td>
                              <td className="border-b border-[#eef2f7] px-5 py-3">
                                <span className="inline-flex rounded-full bg-[#eff6ff] px-2.5 py-1 text-xs font-medium text-[#2563eb]">
                                  {privacyLabel}
                                </span>
                              </td>
                              <td className="border-b border-[#eef2f7] px-5 py-3 text-sm text-[#6b7280]">
                                {asset.resalePolicy === "exclusive" ? "Single workflow" : "Reusable inventory"}
                              </td>
                              <td className="border-b border-[#eef2f7] px-5 py-3 text-sm text-[#6b7280]">{formatRelative(asset.verifiedAt)}</td>
                              <td className="border-b border-[#eef2f7] px-5 py-3 text-right">
                                <div className="font-medium text-[#111827]">{asset.basePrice} ETH</div>
                                {purchased ? <div className="mt-1 text-xs text-[#2563eb]">Accessible</div> : null}
                              </td>
                              <td className="border-b border-[#eef2f7] px-5 py-3 text-right">
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    setSelectedAssetId(asset.assetId);
                                    if (!purchased) {
                                      void purchaseAsset(asset.assetId);
                                    }
                                  }}
                                  disabled={!isConnected || purchased || isBuying || busyAssetId === asset.assetId}
                                  className={`rounded-full px-3 py-2 text-xs font-semibold transition-all ${
                                    purchased
                                      ? "bg-[#eef4ff] text-[#2563eb]"
                                      : "bg-[#2563eb] text-white hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:bg-[#cbd5e1]"
                                  }`}
                                >
                                  {purchased ? "Selected" : busyAssetId === asset.assetId ? "Unlocking…" : "Unlock"}
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="border-t border-[#edf1f5] bg-[#fbfcfe] px-5 py-4">
                  {selectedAsset ? (
                    <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr_auto] xl:items-center">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-[#111827]">{selectedAsset.category}</span>
                          <span className="rounded-full bg-[#eff6ff] px-2.5 py-1 text-xs font-medium text-[#2563eb]">
                            {normalizeProofLabel(selectedAsset.proofTypeId)}
                          </span>
                          {purchasedIds.has(selectedAsset.assetId) ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#eff6ff] px-2.5 py-1 text-xs font-medium text-[#2563eb]">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Accessible
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-2 text-sm leading-7 text-[#6b7280]">
                          Visible before unlock: {Object.entries(selectedAsset.searchableAttributes || {})
                            .slice(0, 3)
                            .map(([key, value]) => `${key}: ${String(value)}`)
                            .join(" • ") || "Category, freshness, and privacy rules visible before access."}
                        </p>
                      </div>

                      <div className="rounded-[20px] border border-[#e2e8f0] bg-white px-4 py-4">
                        <div className="flex items-center justify-between text-sm"><span className="text-[#94a3b8]">Delivery</span><span className="font-medium text-[#111827]">TEE encrypted</span></div>
                        <div className="mt-2 flex items-center justify-between text-sm"><span className="text-[#94a3b8]">Freshness</span><span className="font-medium text-[#111827]">{formatRelative(selectedAsset.verifiedAt)}</span></div>
                        <div className="mt-2 flex items-center justify-between text-sm"><span className="text-[#94a3b8]">Price</span><span className="font-medium text-[#111827]">{selectedAsset.basePrice} ETH</span></div>
                      </div>

                      <div className="flex flex-col gap-2 xl:min-w-[220px]">
                        <Button
                          onClick={() => purchaseAsset(selectedAsset.assetId)}
                          disabled={!isConnected || isBuying || busyAssetId === selectedAsset.assetId || purchasedIds.has(selectedAsset.assetId)}
                          className="h-12 rounded-xl bg-[#2563eb] text-sm font-semibold text-white hover:bg-[#1d4ed8]"
                        >
                          {purchasedIds.has(selectedAsset.assetId)
                            ? "Already accessible"
                            : busyAssetId === selectedAsset.assetId
                              ? "Processing…"
                              : "Unlock access"}
                        </Button>
                        <Button
                          onClick={decryptPurchased}
                          disabled={!isConnected || purchasedAssets.length === 0}
                          variant="outline"
                          className="h-12 rounded-2xl border-[#dce5f7] bg-white text-sm font-semibold text-[#13203b]"
                        >
                          Decrypt accessible data
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-[#617395]">Select a signal to inspect access details.</div>
                  )}
                </div>
              </section>
            </div>
          </section>

          {purchasedAssets.length > 0 ? (
            <section className="mt-6 rounded-[28px] border border-white/70 bg-white/92 p-5 shadow-[0_16px_45px_rgba(61,86,150,0.08)]">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#16233d]">
                <LockKeyhole className="h-4 w-4 text-[#4472ff]" />
                Accessible signals
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {purchasedAssets.slice(0, 6).map((asset) => (
                  <div key={asset.assetId} className="rounded-[20px] border border-[#dce5f7] bg-[#fbfdff] px-4 py-4">
                    <div className="font-medium text-[#13203b]">{asset.category}</div>
                    <div className="mt-1 text-xs text-[#8091b3]">{normalizeProofLabel(asset.proofTypeId)}</div>
                    <div className="mt-3 text-sm text-[#617395]">{decrypted[asset.encryptedCID] || "Encrypted until decrypt"}</div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </main>
      </div>
    </div>
  );
}
