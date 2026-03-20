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
    title: "Verify once",
    body: "Proof-backed records replace screenshots and unverifiable seller claims.",
    icon: ShieldCheck,
  },
  {
    title: "Protect the payload",
    body: "Sensitive data stays sealed in a TEE until the right buyer is allowed to unlock it.",
    icon: LockKeyhole,
  },
  {
    title: "Grant precise access",
    body: "Buyers inspect the signal first, then unlock only the assets they have paid for.",
    icon: Database,
  },
];

const proofAdvantages = [
  {
    title: "Clear before purchase",
    body: "Proof type, freshness, privacy, and price are visible before money moves.",
  },
  {
    title: "Private by default",
    body: "The payload stays sealed until access is granted to the right buyer.",
  },
  {
    title: "Reusable supply",
    body: "Verified assets can stay useful for future buyers instead of becoming one-off deals.",
  },
  {
    title: "Better seller economics",
    body: "Sellers can verify once and keep earning as the same asset is reused.",
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
                <p className="text-[0.95rem] font-medium text-[#6f85b5]">Proof-backed inventory for sensitive data exchange</p>
                <h1 className="mx-auto mt-5 max-w-[12ch] text-balance text-[3rem] font-semibold tracking-[-0.08em] leading-[0.94] text-[#18233f] sm:text-[4.1rem] lg:text-[5rem]">
                  Know what is real before you unlock it.
                </h1>
                <p className="mx-auto mt-5 max-w-2xl text-[1rem] leading-7 text-[#5f6f93] md:text-[1.08rem] md:leading-8">
                  AccessFi gives teams verified supply, private delivery, and controlled access in one clear workflow.
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
                    Request Missing Data
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
                  <div className="text-xs font-medium text-[#7b8aaa]">Verified supply • private delivery • access control</div>
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
                              <p className="mt-1 text-xs text-[#8391ad]">Reusable verified asset</p>
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
                        Verified before purchase, protected after purchase.
                      </h2>
                      <div className="mt-6 grid gap-3">
                        <MiniMetric label="Verification" value="zkVerify on Horizen" />
                        <MiniMetric label="Storage" value="TEE encrypted delivery" />
                        <MiniMetric label="Access" value="Wallet-gated unlock" />
                      </div>
                    </div>

                    <div className="mt-4 rounded-[22px] border border-[#d9e6ff] bg-[linear-gradient(160deg,#4f7cff_0%,#7aa2ff_100%)] p-5 text-white shadow-[0_20px_50px_rgba(79,124,255,0.24)]">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/75">Why this matters</p>
                      <p className="mt-3 text-lg font-semibold leading-8">
                        Teams can inspect proof, freshness, and privacy rules before they ever touch the payload.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </section>

          <section className="mt-16 bg-white/90">
            <div className="grid gap-6 border-t border-[#dce6f7] px-6 py-10 text-[#8894ab] sm:grid-cols-3 lg:grid-cols-6">
              {["zkEmail", "zkVerify", "Horizen", "Phala TEE", "Reusable assets", "Wallet access"].map((item) => (
                <div key={item} className="text-center text-sm font-medium">
                  {item}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-b-[34px] bg-white px-6 pb-20 pt-14 md:px-10">
            <div className="mx-auto max-w-3xl text-center">
              <p className="inline-flex rounded-full border border-[#dde6f6] px-3 py-1 text-xs font-medium text-[#7b8aaa]">
                Features
              </p>
              <h2 className="mt-5 text-4xl font-semibold tracking-[-0.05em] text-[#18233f] md:text-5xl">
                Verified data that stays usable.
              </h2>
            </div>

            <div className="mx-auto mt-12 grid max-w-6xl gap-5 md:grid-cols-3">
              {principles.map((step) => {
                const Icon = step.icon;
                return (
                  <motion.div
                    key={step.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ duration: 0.35 }}
                    className="rounded-[26px] border border-[#e6edfb] bg-[#f8fbff] p-6 shadow-[0_18px_50px_rgba(32,44,63,0.05)]"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#4f7cff] shadow-[0_10px_24px_rgba(79,124,255,0.16)]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-5 text-2xl font-semibold tracking-[-0.04em] text-[#18233f]">{step.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-[#64748b]">{step.body}</p>
                  </motion.div>
                );
              })}
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
