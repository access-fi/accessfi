"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useState } from "react";
import { ArrowRight, Database, LockKeyhole, ShieldCheck } from "lucide-react";
import { Header } from "@/components/header";
import { CreatePoolModal } from "@/components/create-pool-modal";

const inventoryRows = [
  {
    category: "Identity",
    proof: "Verified email",
    privacy: "Selective access",
    freshness: "12m ago",
    price: "0.001 ETH",
  },
  {
    category: "Subscription",
    proof: "Prime membership",
    privacy: "Encrypted in TEE",
    freshness: "2h ago",
    price: "0.003 ETH",
  },
  {
    category: "Behavioral",
    proof: "Waitlist proof",
    privacy: "Buyer only",
    freshness: "1d ago",
    price: "0.002 ETH",
  },
];

const principles = [
  {
    title: "Verify the signal",
    body: "Proof-backed records replace screenshots, PDFs, and unverifiable claims with something teams can actually trust.",
    icon: ShieldCheck,
  },
  {
    title: "Keep the payload sealed",
    body: "Sensitive data stays encrypted in a TEE until the right workflow or counterparty is approved to access it.",
    icon: LockKeyhole,
  },
  {
    title: "Grant only the right access",
    body: "Teams can inspect freshness, proof type, and privacy rules first, then unlock only what should actually be used.",
    icon: Database,
  },
];

const proofAdvantages = [
  {
    title: "Trust is visible",
    body: "Proof type, freshness, and privacy rules are visible before anyone relies on the data in a workflow.",
  },
  {
    title: "Private by default",
    body: "The payload stays sealed until access is explicitly granted to the right team or counterparty.",
  },
  {
    title: "Reusable verification",
    body: "The same verified asset can stay useful across future requests instead of forcing teams to repeat the same proof work.",
  },
  {
    title: "Operationally cleaner",
    body: "Verified inventory, controlled delivery, and access control live in one system instead of scattered manual handoffs.",
  },
];

const workflowMetrics = [
  { label: "Verification confidence", value: "98%", note: "Proof-backed instead of screenshot-backed" },
  { label: "Private payload exposure", value: "0", note: "Nothing leaks before access is granted" },
  { label: "Reuse across requests", value: "1 → many", note: "A verified asset can stay useful over time" },
];

const legacyVsAccessFi = [
  {
    legacy: "Trust the seller, inspect docs manually, hope the data is still current.",
    accessfi: "See proof type, freshness, and access conditions before the payload is ever revealed.",
  },
  {
    legacy: "Sensitive files move first, permissioning gets sorted out later.",
    accessfi: "The payload stays sealed in a TEE until the right wallet or workflow is approved.",
  },
  {
    legacy: "Each request restarts the same verification loop from scratch.",
    accessfi: "Verified supply stays reusable, so the network compounds instead of resetting.",
  },
];

export default function Home() {
  const [createPoolOpen, setCreatePoolOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#eef4ff] text-[#101828]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(96,165,250,0.12),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.1),transparent_22%)]" />
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:44px_44px]" />

      <div className="relative z-10">
        <Header />

        <main className="mx-auto w-full max-w-[96rem] px-4 pb-24 pt-6 md:px-6 lg:px-8">
          <section className="overflow-hidden rounded-[34px] border border-white/80 bg-[linear-gradient(180deg,#dcecff_0%,#d9e9ff_100%)] shadow-[0_30px_90px_rgba(89,120,184,0.18)]">
            <div className="px-6 pt-10 md:px-10 md:pt-12">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className="mx-auto max-w-4xl text-center"
              >
                <p className="text-[0.95rem] font-medium text-[#6f85b5]">Proof-backed infrastructure for trusted data workflows</p>
                <h1 className="mx-auto mt-5 max-w-[12ch] text-balance text-[3rem] font-semibold tracking-[-0.08em] leading-[0.94] text-[#18233f] sm:text-[4.1rem] lg:text-[5rem]">
                  Use verified data with confidence.
                </h1>
                <p className="mx-auto mt-5 max-w-2xl text-[1rem] leading-7 text-[#5f6f93] md:text-[1.08rem] md:leading-8">
                  AccessFi turns proof, private delivery, and access control into a workflow teams can trust end to end.
                </p>

                <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Link
                    href="/inventory"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#4f7cff] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_16px_32px_rgba(79,124,255,0.28)] transition-all hover:-translate-y-0.5 hover:bg-[#416eed]"
                  >
                    Browse Inventory
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={() => setCreatePoolOpen(true)}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-semibold text-[#24324f] transition-all hover:-translate-y-0.5 hover:text-[#111827]"
                  >
                    Request Coverage
                  </button>
                </div>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.08 }}
              className="mt-10 px-4 pb-0 md:px-10"
            >
              <div className="mx-auto max-w-5xl overflow-hidden rounded-[28px] border border-white/80 bg-white shadow-[0_34px_90px_rgba(61,86,150,0.18)]">
                <div className="flex items-center justify-between border-b border-[#edf2fb] px-5 py-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[#1f2b46]">
                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#4f7cff] text-[11px] font-bold text-white">
                      A
                    </div>
                    AccessFi Inventory
                  </div>
                  <div className="text-xs font-medium text-[#7b8aaa]">Verified signals • private delivery • controlled access</div>
                </div>

                <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
                  <div className="p-5">
                    <div className="rounded-[22px] border border-[#edf2fb] bg-[#fbfdff] p-5">
                      <div className="grid grid-cols-[1.2fr_1fr_0.9fr_0.8fr] gap-4 border-b border-[#eef3fb] pb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7d8dab]">
                        <span>Category</span>
                        <span>Proof</span>
                        <span>Access</span>
                        <span className="text-right">Freshness</span>
                      </div>

                      <div className="space-y-3 pt-4">
                        {inventoryRows.map((row) => (
                          <div
                            key={`${row.category}-${row.proof}`}
                            className="grid grid-cols-[1.2fr_1fr_0.9fr_0.8fr] items-start gap-4 rounded-2xl border border-[#eef3fb] bg-white px-4 py-4"
                          >
                            <div>
                              <p className="font-medium text-[#15213b]">{row.category}</p>
                          <p className="mt-1 text-xs text-[#8391ad]">Verified signal</p>
                            </div>
                            <p className="text-sm text-[#24324f]">{row.proof}</p>
                            <span className="inline-flex w-fit rounded-full bg-[#eaf4ff] px-2.5 py-1 text-xs font-medium text-[#4978ec]">
                              {row.privacy}
                            </span>
                            <p className="text-right text-sm text-[#60708f]">{row.freshness}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-[#edf2fb] bg-[#f6f9ff] p-5 lg:border-l lg:border-t-0">
                    <div className="rounded-[22px] border border-[#e6edfb] bg-white p-5">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7d8dab]">Access summary</p>
                      <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[#16233d]">
                        Verifiable before use, protected during use.
                      </h2>
                      <div className="mt-6 grid gap-3">
                        <MiniMetric label="Verification" value="zkVerify on Horizen" />
                        <MiniMetric label="Storage" value="TEE encrypted delivery" />
                        <MiniMetric label="Access" value="Controlled unlock" />
                      </div>
                    </div>

                    <div className="mt-4 rounded-[22px] border border-[#d9e6ff] bg-[linear-gradient(160deg,#4f7cff_0%,#7aa2ff_100%)] p-5 text-white shadow-[0_20px_50px_rgba(79,124,255,0.24)]">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/75">Why this matters</p>
                      <p className="mt-3 text-lg font-semibold leading-8">
                        Teams can inspect proof, freshness, and privacy rules before the underlying payload is ever exposed.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </section>

          <section className="mt-16 bg-white/90">
            <div className="grid gap-6 border-t border-[#dce6f7] px-6 py-10 text-[#8894ab] sm:grid-cols-3 lg:grid-cols-6">
              {["zkEmail", "zkVerify", "Horizen", "Phala TEE", "Reusable verification", "Access control"].map((item) => (
                <div key={item} className="text-center text-sm font-medium">
                  {item}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-b-[34px] bg-white px-6 pb-20 pt-14 md:px-10">
            <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
              <div>
                <p className="inline-flex rounded-full border border-[#dde6f6] px-3 py-1 text-xs font-medium text-[#7b8aaa]">
                  Why it matters
                </p>
                <h2 className="mt-5 max-w-xl text-4xl font-semibold tracking-[-0.05em] text-[#18233f] md:text-5xl">
                  The point is not more data. It is better certainty.
                </h2>
                <p className="mt-5 max-w-xl text-base leading-8 text-[#64748b]">
                  Teams do not need more opaque files flying around. They need a workflow where trust, freshness, and privacy are visible before the data becomes operational.
                </p>

                <div className="mt-8 space-y-4">
                  {principles.map((step) => {
                    const Icon = step.icon;
                    return (
                      <div key={step.title} className="flex gap-4 rounded-[22px] border border-[#e6edfb] bg-[#f8fbff] p-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[#4f7cff] shadow-[0_10px_24px_rgba(79,124,255,0.16)]">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold tracking-[-0.03em] text-[#18233f]">{step.title}</h3>
                          <p className="mt-1 text-sm leading-7 text-[#64748b]">{step.body}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-[28px] border border-[#dce6f8] bg-[linear-gradient(180deg,#f7faff_0%,#f1f6ff_100%)] p-6 shadow-[0_18px_50px_rgba(32,44,63,0.06)]">
                <div className="grid gap-4 md:grid-cols-3">
                  {workflowMetrics.map((item) => (
                    <div key={item.label} className="rounded-[22px] border border-white/90 bg-white px-4 py-5">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7b8aaa]">{item.label}</p>
                      <p className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-[#18233f]">{item.value}</p>
                      <p className="mt-2 text-sm leading-6 text-[#64748b]">{item.note}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-[24px] border border-white/90 bg-white p-5">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7b8aaa]">Trust curve</p>
                      <h3 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-[#18233f]">Confidence should rise before access does.</h3>
                    </div>
                    <div className="rounded-full bg-[#eef4ff] px-3 py-1 text-xs font-medium text-[#4f7cff]">AccessFi model</div>
                  </div>

                  <div className="mt-6 flex h-52 items-end gap-3">
                    {[20, 34, 46, 62, 76, 92].map((height, index) => (
                      <div key={height} className="flex flex-1 flex-col items-center gap-2">
                        <div
                          className={`w-full rounded-t-[18px] ${index < 2 ? "bg-[#dce6ff]" : index < 4 ? "bg-[#9ebdff]" : "bg-[#4f7cff]"}`}
                          style={{ height: `${height}%` }}
                        />
                        <span className="text-[11px] font-medium text-[#7b8aaa]">
                          {["Raw", "Claim", "Proof", "Freshness", "Policy", "Unlock"][index]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mx-auto mt-20 max-w-6xl">
              <div className="max-w-3xl">
                <p className="inline-flex rounded-full border border-[#dde6f6] px-3 py-1 text-xs font-medium text-[#7b8aaa]">
                  Different by design
                </p>
                <h2 className="mt-5 text-4xl font-semibold tracking-[-0.05em] text-[#18233f] md:text-5xl">
                  AccessFi is built around verification, not blind exchange.
                </h2>
              </div>

              <div className="mt-10 overflow-hidden rounded-[28px] border border-[#dce6f8] bg-[#f8fbff] shadow-[0_18px_50px_rgba(32,44,63,0.05)]">
                <div className="grid grid-cols-[1fr_1fr] border-b border-[#e6edfb] bg-white/70 px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#7b8aaa]">
                  <span>Typical data workflow</span>
                  <span>AccessFi workflow</span>
                </div>

                <div className="divide-y divide-[#e6edfb]">
                  {legacyVsAccessFi.map((row, index) => (
                    <div key={index} className="grid gap-0 md:grid-cols-2">
                      <div className="border-r border-[#e6edfb] bg-white px-6 py-6">
                        <p className="text-sm leading-7 text-[#6b7280]">{row.legacy}</p>
                      </div>
                      <div className="bg-[linear-gradient(180deg,#f4f8ff_0%,#eff5ff_100%)] px-6 py-6">
                        <p className="text-sm leading-7 text-[#18233f]">{row.accessfi}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mx-auto mt-16 grid max-w-6xl gap-5 md:grid-cols-2">
              {proofAdvantages.map((item) => (
                <div key={item.title} className="rounded-[24px] border border-[#e6edfb] bg-white p-6 shadow-[0_16px_40px_rgba(32,44,63,0.04)]">
                  <h3 className="text-xl font-semibold tracking-[-0.03em] text-[#18233f]">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-[#64748b]">{item.body}</p>
                </div>
              ))}
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

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#e3e9f2] bg-white px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6b7280]">{label}</p>
      <p className="mt-2 text-sm font-medium text-[#0f172a]">{value}</p>
    </div>
  );
}
