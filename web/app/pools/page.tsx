"use client";

import { type ReactNode, useMemo, useState } from "react";
import Link from "next/link";
import { formatEther } from "viem";
import { Header } from "@/components/header";
import { CreatePoolModal } from "@/components/create-pool-modal";
import { useAllPools, usePoolInfo } from "@/hooks/usePools";
import { Search, Sparkles, SlidersHorizontal, ChevronDown } from "lucide-react";

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
    <div className="rounded-[18px] border border-[#dce5f7] bg-white">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between px-4 py-4 text-left"
      >
        <span className="text-sm font-medium text-[#1d2942]">{title}</span>
        <ChevronDown className={`h-4 w-4 text-[#8091b3] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open ? <div className="border-t border-[#edf2fb] px-4 py-4">{children}</div> : null}
    </div>
  );
}

function PoolPreviewRow({
  poolAddress,
  selected,
  onSelect,
}: {
  poolAddress: `0x${string}`;
  selected: boolean;
  onSelect: (address: `0x${string}`) => void;
}) {
  const { pool, isLoading } = usePoolInfo(poolAddress);

  if (isLoading || !pool) {
    return (
      <tr className="animate-pulse">
        <td colSpan={7} className="border-b border-[#edf2fb] px-5 py-5 text-sm text-[#8a9abc]">
          Loading request…
        </td>
      </tr>
    );
  }

  return (
    <tr
      onClick={() => onSelect(poolAddress)}
      className={`cursor-pointer transition-colors ${selected ? "bg-[#f8fbff]" : "hover:bg-[#fafcff]"}`}
    >
      <td className="border-b border-[#eef2f7] px-5 py-3 text-sm font-medium text-[#111827]">{pool.name}</td>
      <td className="border-b border-[#eef2f7] px-5 py-3 text-sm text-[#1f2937]">{pool.dataType}</td>
      <td className="border-b border-[#eef2f7] px-5 py-3 text-sm text-[#6b7280]">{formatEther(pool.pricePerData)} ETH</td>
      <td className="border-b border-[#eef2f7] px-5 py-3 text-sm text-[#6b7280]">{formatEther(pool.remainingBudget)} ETH</td>
      <td className="border-b border-[#eef2f7] px-5 py-3 text-sm text-[#6b7280]">{Number(pool.totalDataCollected)}</td>
      <td className="border-b border-[#eef2f7] px-5 py-3">
        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${pool.isActive ? "bg-[#eff6ff] text-[#2563eb]" : "bg-[#f3f4f6] text-[#6b7280]"}`}>
          {pool.isActive ? "Open" : "Closed"}
        </span>
      </td>
      <td className="border-b border-[#eef2f7] px-5 py-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-[#6b7280]">{poolAddress.slice(0, 6)}...{poolAddress.slice(-4)}</span>
          <Link
            href={`/pool/${poolAddress}`}
            onClick={(event) => event.stopPropagation()}
            className="rounded-full border border-[#d6e2fb] bg-white px-3 py-1.5 text-xs font-semibold text-[#16305d] transition-colors hover:border-[#a9bee8] hover:bg-[#f8fbff]"
          >
            Open
          </Link>
        </div>
      </td>
    </tr>
  );
}

function PoolSummary({ poolAddress }: { poolAddress: `0x${string}` | null }) {
  const { pool } = usePoolInfo(poolAddress ?? undefined);

  if (!pool) {
    return (
      <div className="text-sm text-[#617395]">Select a request to inspect requirements and economics.</div>
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr] xl:items-center">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-[#111827]">{pool.name}</span>
          <span className="rounded-full bg-[#eff6ff] px-2.5 py-1 text-xs font-medium text-[#2563eb]">{pool.dataType}</span>
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${pool.isActive ? "bg-[#eff6ff] text-[#2563eb]" : "bg-[#f3f4f6] text-[#6b7280]"}`}>
            {pool.isActive ? "Open request" : "Closed"}
          </span>
        </div>
        <p className="mt-2 text-sm leading-7 text-[#6b7280]">{pool.description}</p>
      </div>

      <div className="rounded-[20px] border border-[#e2e8f0] bg-white px-4 py-4">
        <div className="flex items-center justify-between text-sm"><span className="text-[#94a3b8]">Reward per signal</span><span className="font-medium text-[#111827]">{formatEther(pool.pricePerData)} ETH</span></div>
        <div className="mt-2 flex items-center justify-between text-sm"><span className="text-[#94a3b8]">Remaining budget</span><span className="font-medium text-[#111827]">{formatEther(pool.remainingBudget)} ETH</span></div>
        <div className="mt-2 flex items-center justify-between text-sm"><span className="text-[#94a3b8]">Collected</span><span className="font-medium text-[#111827]">{Number(pool.totalDataCollected)}</span></div>
      </div>
    </div>
  );
}

export default function PoolsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [createPoolOpen, setCreatePoolOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "closed">("all");
  const { poolAddresses, poolCount, isLoading } = useAllPools();
  const [selectedPoolAddress, setSelectedPoolAddress] = useState<`0x${string}` | null>(null);

  const filteredPools = useMemo(() => {
    return poolAddresses.filter((address) => {
      const matchesSearch = !searchQuery || address.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [poolAddresses, searchQuery]);

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
                  <p className="text-sm font-medium text-[#64748b]">Requests</p>
                  <h1 className="mt-1 text-[2rem] font-semibold tracking-[-0.05em] text-[#111827] md:text-[2.35rem]">
                    Fill the gaps only when verified coverage is missing.
                  </h1>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-2 rounded-xl border border-[#d9e2ef] bg-[#fafcff] px-3 py-3 text-sm text-[#4b5563] sm:min-w-[320px]">
                    <Search className="h-4 w-4 text-[#94a3b8]" />
                    <input
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="Search by request address"
                      className="w-full bg-transparent outline-none placeholder:text-[#94a3b8]"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button className="rounded-xl border border-[#d9e2ef] bg-white px-4 py-3 text-sm font-medium text-[#21314d]">
                      Past searches
                    </button>
                    <button className="rounded-xl border border-[#d9e2ef] bg-white px-4 py-3 text-sm font-medium text-[#21314d]">
                      Save view
                    </button>
                  </div>
                  <button
                    onClick={() => setCreatePoolOpen(true)}
                    className="rounded-xl bg-[#2563eb] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(37,99,235,0.18)] hover:bg-[#1d4ed8]"
                  >
                    Create request
                  </button>
                </div>
              </div>
            </div>

            <div className="grid min-h-[72vh] gap-0 xl:grid-cols-[320px_minmax(0,1fr)]">
              <aside className="border-r border-[#edf1f5] bg-[#fbfcfe] px-4 py-4">
                <div className="mb-4 flex items-center gap-2 px-2 text-sm font-semibold text-[#1d2942]">
                  <SlidersHorizontal className="h-4 w-4 text-[#64748b]" />
                  Request controls
                </div>

                <div className="space-y-4">
                  <FilterGroup title="Request status" defaultOpen>
                    <div className="space-y-2">
                      {[
                        { key: "all", label: "All requests" },
                        { key: "open", label: "Open only" },
                        { key: "closed", label: "Closed only" },
                      ].map((option) => (
                        <button
                          key={option.key}
                          onClick={() => setStatusFilter(option.key as typeof statusFilter)}
                          className={`flex w-full items-center justify-between rounded-2xl px-3 py-3 text-sm transition-all ${
                            statusFilter === option.key
                              ? "bg-[#eef4ff] text-[#173059] ring-1 ring-[#bfd3ff]"
                              : "bg-white text-[#4b5563] hover:bg-[#f8fafc]"
                          }`}
                        >
                          {option.label}
                          {statusFilter === option.key ? <span className="h-2.5 w-2.5 rounded-full bg-[#2563eb]" /> : null}
                        </button>
                      ))}
                    </div>
                  </FilterGroup>

                  <FilterGroup title="Why requests exist" defaultOpen>
                    <div className="space-y-3 text-sm leading-7 text-[#617395]">
                      <p>Inventory is the primary path.</p>
                      <p>Requests are how the network fills missing verified coverage.</p>
                      <p>Successful requests should feed future reusable supply.</p>
                    </div>
                  </FilterGroup>

                  <FilterGroup title="Coverage health" defaultOpen>
                    <div className="rounded-[20px] border border-[#dde5f0] bg-white px-4 py-4">
                      <div className="text-3xl font-semibold tracking-[-0.04em] text-[#13203b]">{poolCount}</div>
                      <div className="mt-1 text-sm text-[#617395]">requests tracked in this view</div>
                    </div>
                  </FilterGroup>
                </div>
              </aside>

              <section className="flex min-h-0 flex-col bg-white">
                <div className="flex items-center justify-between border-b border-[#edf1f5] px-5 py-4">
                  <div>
                    <p className="text-sm font-semibold text-[#111827]">Preview</p>
                    <p className="mt-1 text-xs text-[#6b7280]">Showing {filteredPools.length} requests</p>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-[#f8fafc] px-3 py-2 text-xs font-medium text-[#667085]">
                    <Sparkles className="h-3.5 w-3.5 text-[#64748b]" />
                    Requests fill missing verified coverage
                  </div>
                </div>

                <div className="min-h-0 flex-1 overflow-auto">
                  <table className="min-w-full border-separate border-spacing-0 text-left">
                    <thead className="sticky top-0 z-10 bg-white">
                      <tr className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#94a3b8]">
                        <th className="border-b border-[#e5ebf8] px-5 py-4">Request</th>
                        <th className="border-b border-[#e5ebf8] px-5 py-4">Type</th>
                        <th className="border-b border-[#e5ebf8] px-5 py-4">Reward</th>
                        <th className="border-b border-[#e5ebf8] px-5 py-4">Budget</th>
                        <th className="border-b border-[#e5ebf8] px-5 py-4">Collected</th>
                        <th className="border-b border-[#e5ebf8] px-5 py-4">Status</th>
                        <th className="border-b border-[#e5ebf8] px-5 py-4">Address</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isLoading ? (
                        <tr>
                          <td colSpan={7} className="px-5 py-10 text-center text-sm text-[#617395]">Loading requests…</td>
                        </tr>
                      ) : filteredPools.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-5 py-10 text-center text-sm text-[#617395]">No requests match this view.</td>
                        </tr>
                      ) : (
                        filteredPools.map((poolAddress) => (
                          <PoolPreviewRow
                            key={poolAddress}
                            poolAddress={poolAddress}
                            selected={selectedPoolAddress === poolAddress}
                            onSelect={setSelectedPoolAddress}
                          />
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="border-t border-[#e5ebf8] bg-[#fbfcff] px-5 py-4">
                  <PoolSummary poolAddress={selectedPoolAddress} />
                </div>
              </section>
            </div>
          </section>
        </main>
      </div>

      <CreatePoolModal
        open={createPoolOpen}
        onClose={() => setCreatePoolOpen(false)}
        onSuccess={() => setCreatePoolOpen(false)}
      />
    </div>
  );
}
