"use client";

import { motion, useInView } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Header } from "@/components/header";
import { CreatePoolModal } from "@/components/create-pool-modal";
import { StackedMonolith } from "@/components/stacked-monolith";

export default function Home() {
  const [createPoolOpen, setCreatePoolOpen] = useState(false);

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Animated grid background */}
      <div className="grid-pattern fixed inset-0 opacity-30" />

      {/* Main content */}
      <div className="relative z-10">
        {/* Top nav bar */}
        <Header />

        {/* Hero section */}
        <main className="container mx-auto px-6 py-12">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-12">
            {/* Left side - Content */}
            <div>
              {/* Status badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="mb-8 inline-flex items-center gap-2 border border-primary/30 bg-primary/5 px-4 py-2 font-mono text-xs"
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
                </span>
                Live On Horizen Testnet...
              </motion.div>

              {/* Main heading */}
              <motion.h1
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="mb-6 font-mono text-5xl font-black uppercase leading-[0.9] tracking-tight md:text-7xl lg:text-8xl"
              >
                <motion.span
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="block text-foreground"
                >
                  BUY & SELL
                </motion.span>
                <motion.span
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="block text-foreground"
                >
                  PRIVATE DATA
                </motion.span>
                <motion.span
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                  className="relative inline-block mt-2"
                >
                  <span className="relative block border-4 border-primary bg-primary px-4 py-2 text-background">
                    <span className="relative z-10">ON-CHAIN</span>
                    {/* Constant glitch layers */}
                    <span
                      className="absolute left-0 top-0 px-4 py-2 opacity-70"
                      style={{
                        color: '#00C2FF',
                        transform: 'translate(-2px, 0)',
                        mixBlendMode: 'screen'
                      }}
                    >
                      ON-CHAIN
                    </span>
                    <span
                      className="absolute left-0 top-0 px-4 py-2 opacity-70"
                      style={{
                        color: '#FF0080',
                        transform: 'translate(2px, 0)',
                        mixBlendMode: 'screen'
                      }}
                    >
                      ON-CHAIN
                    </span>
                  </span>
                </motion.span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="mb-8 max-w-xl text-lg text-muted-foreground md:text-xl"
              >
                A decentralized verified data network powered by
                zero-knowledge proofs. Buy instant access, create fallback
                pools, and trade privately.
              </motion.p>

              {/* CTA buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.7 }}
                className="flex flex-wrap gap-4"
              >
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    href="/inventory"
                    className="group flex items-center gap-2 border-2 border-foreground bg-foreground px-8 py-4 font-mono text-base font-bold uppercase text-background transition-all hover:border-primary hover:bg-primary"
                    style={{
                      boxShadow: '6px 6px 0px rgba(0, 255, 133, 0.4)'
                    }}
                  >
                    BROWSE INVENTORY
                    <svg
                      className="h-4 w-4 transition-transform group-hover:translate-x-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </Link>
                </motion.div>

                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <button
                    onClick={() => setCreatePoolOpen(true)}
                    className="group flex items-center gap-2 border-2 border-border bg-background px-8 py-4 font-mono text-base font-bold uppercase transition-all hover:border-foreground hover:bg-card"
                  >
                    REQUEST DATA
                    <svg
                      className="h-4 w-4 transition-transform group-hover:translate-x-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                  </button>
                </motion.div>
              </motion.div>
            </div>

            {/* Right side - 3D Visual Element */}
            <div className="hidden lg:flex lg:items-center lg:justify-center">
              <StackedMonolith />
            </div>
          </div>


          {/* Features grid
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.1 }}
            className="mt-24 grid gap-6 md:grid-cols-3"
          >
            <FeatureCard
              icon="🔒"
              title="ZERO-KNOWLEDGE"
              description="All data verified through cryptographic proofs without revealing content"
              delay={0}
            />
            <FeatureCard
              icon="⚡"
              title="INSTANT SETTLEMENT"
              description="Automatic payments and access grants upon proof verification"
              delay={0.1}
            />
            <FeatureCard
              icon="🌐"
              title="FULLY ON-CHAIN"
              description="No intermediaries. All transactions settled on Ethereum blockchain"
              delay={0.2}
            />
          </motion.div> */}

          {/* How It Works Section */}
          <HowItWorksSection />

          {/* Data Categories Section */}
          <DataCategoriesSection />

          {/* Platform Stats Section */}
          <PlatformStatsSection />

          {/* Technology Stack Section */}
          <TechStackSection />

          {/* Final CTA Section */}
          <FinalCTASection onCreatePool={() => setCreatePoolOpen(true)} />

          {/* Footer */}
          <motion.footer
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.5 }}
            className="mt-32 border-t border-border pb-12 pt-12"
          >
            <div className="grid gap-8 md:grid-cols-4">
              <div>
                <h3 className="mb-4 font-mono text-sm font-bold uppercase">PROTOCOL</h3>
                <ul className="space-y-2 font-mono text-xs text-muted-foreground">
                  <li>
                    <a href="#" className="transition-colors hover:text-foreground">
                      Documentation
                    </a>
                  </li>
                  <li>
                    <a href="#" className="transition-colors hover:text-foreground">
                      Whitepaper
                    </a>
                  </li>
                  <li>
                    <a href="#" className="transition-colors hover:text-foreground">
                      Smart Contracts
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="mb-4 font-mono text-sm font-bold uppercase">COMMUNITY</h3>
                <ul className="space-y-2 font-mono text-xs text-muted-foreground">
                  <li>
                    <a href="#" className="transition-colors hover:text-foreground">
                      Discord
                    </a>
                  </li>
                  <li>
                    <a href="#" className="transition-colors hover:text-foreground">
                      Twitter
                    </a>
                  </li>
                  <li>
                    <a href="#" className="transition-colors hover:text-foreground">
                      GitHub
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="mb-4 font-mono text-sm font-bold uppercase">RESOURCES</h3>
                <ul className="space-y-2 font-mono text-xs text-muted-foreground">
                  <li>
                    <a href="#" className="transition-colors hover:text-foreground">
                      Help Center
                    </a>
                  </li>
                  <li>
                    <a href="#" className="transition-colors hover:text-foreground">
                      Blog
                    </a>
                  </li>
                  <li>
                    <a href="#" className="transition-colors hover:text-foreground">
                      Status
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="mb-4 font-mono text-sm font-bold uppercase">LEGAL</h3>
                <ul className="space-y-2 font-mono text-xs text-muted-foreground">
                  <li>
                    <a href="#" className="transition-colors hover:text-foreground">
                      Terms of Service
                    </a>
                  </li>
                  <li>
                    <a href="#" className="transition-colors hover:text-foreground">
                      Privacy Policy
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            <div className="mt-12 border-t border-border pt-8 font-mono text-xs text-muted-foreground">
              © 2026 ACCESSFI. PRIVACY-FIRST DATA MARKETPLACE.
            </div>
          </motion.footer>
        </main>
      </div>

      {/* Create Pool Modal */}
      <CreatePoolModal
        open={createPoolOpen}
        onClose={() => setCreatePoolOpen(false)}
        onSuccess={() => {
          setCreatePoolOpen(false);
          // Optionally redirect to pools page or refresh data
        }}
      />
    </div>
  );
}

// Stat box component - Commented out until we have real data
// function StatBox({
//   number,
//   label,
//   trend,
//   trendUp,
//   delay,
// }: {
//   number: string;
//   label: string;
//   trend: string;
//   trendUp: boolean;
//   delay: number;
// }) {
//   return (
//     <motion.div
//       initial={{ opacity: 0, y: 20 }}
//       animate={{ opacity: 1, y: 0 }}
//       transition={{ delay, duration: 0.4 }}
//       whileHover={{ scale: 1.02 }}
//       className="bg-background p-8 transition-all"
//     >
//       <div className="mb-2 font-mono text-4xl font-black text-foreground">{number}</div>
//       <div className="mb-2 font-mono text-xs text-muted-foreground">{label}</div>
//       <div className={`font-mono text-xs ${trendUp ? "text-primary" : "text-destructive"}`}>
//         {trend}
//       </div>
//     </motion.div>
//   );
// }

// ============================================================
//                    HOW IT WORKS SECTION
// ============================================================

function HowItWorksSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const steps = [
    {
      number: "01",
      title: "CREATE POOL",
      description: "Buyers create data pools specifying what data they need and set a budget",
      icon: "◆",
      color: "primary"
    },
    {
      number: "02",
      title: "SUBMIT PROOF",
      description: "Sellers upload their data and generate zero-knowledge proofs using zkEmail",
      icon: "◇",
      color: "accent"
    },
    {
      number: "03",
      title: "VERIFY ON-CHAIN",
      description: "zkVerify validates the proof on-chain without revealing the actual data",
      icon: "□",
      color: "primary"
    },
    {
      number: "04",
      title: "GET PAID",
      description: "Verified sellers receive instant payment and buyers get encrypted asset access",
      icon: "■",
      color: "accent"
    }
  ];

  return (
    <section ref={ref} className="mt-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="mb-16 text-center"
      >
        <span className="font-mono text-xs text-primary uppercase tracking-widest">
          THE PROCESS
        </span>
        <h2 className="mt-4 font-mono text-4xl font-black uppercase md:text-5xl">
          HOW IT WORKS
        </h2>
        <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
          A simple four-step process to trade verified data privately and securely
        </p>
      </motion.div>

      {/* Steps */}
      <div className="relative">
        {/* Connection line */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-border hidden lg:block" />

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="relative"
            >
              <div className="border-2 border-border bg-card p-6 h-full hover:border-primary transition-colors group">
                {/* Step number */}
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-12 h-12 border-2 ${step.color === 'primary' ? 'border-primary bg-primary' : 'border-accent bg-accent'} flex items-center justify-center font-mono text-lg font-black text-background`}>
                    {step.number}
                  </div>
                  <span className="font-mono text-3xl opacity-20 group-hover:opacity-40 transition-opacity">
                    {step.icon}
                  </span>
                </div>

                <h3 className="font-mono text-sm font-bold uppercase mb-3">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {step.description}
                </p>
              </div>

              {/* Arrow connector for desktop */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                  <div className="w-8 h-8 border-2 border-border bg-background flex items-center justify-center font-mono text-primary">
                    →
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================
//                    PLATFORM STATS SECTION
// ============================================================

function PlatformStatsSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="mt-8 py-16">
      <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 0.6 }}
        className="border-2 border-border bg-card overflow-hidden"
      >
        <div className="grid md:grid-cols-4 divide-y-2 md:divide-y-0 md:divide-x-2 divide-border">
          <AnimatedStat
            value={1247}
            suffix="+"
            label="VERIFIED PROOFS"
            delay={0}
            isInView={isInView}
          />
          <AnimatedStat
            value={89}
            suffix=""
            label="ACTIVE POOLS"
            delay={0.1}
            isInView={isInView}
          />
          <AnimatedStat
            value={342}
            suffix="K"
            label="DATA TRADED"
            delay={0.2}
            isInView={isInView}
          />
          <AnimatedStat
            value={99.9}
            suffix="%"
            label="UPTIME"
            delay={0.3}
            isInView={isInView}
          />
        </div>
      </motion.div>
    </section>
  );
}

function AnimatedStat({
  value,
  suffix,
  label,
  delay,
  isInView
}: {
  value: number;
  suffix: string;
  label: string;
  delay: number;
  isInView: boolean;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;

    const duration = 2000;
    const steps = 60;
    const stepValue = value / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += stepValue;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(current);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [isInView, value]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay }}
      className="p-8 text-center"
    >
      <div className="font-mono text-5xl font-black text-primary mb-2">
        {typeof value === 'number' && value % 1 !== 0
          ? count.toFixed(1)
          : Math.floor(count).toLocaleString()}
        <span className="text-foreground">{suffix}</span>
      </div>
      <div className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
        {label}
      </div>
    </motion.div>
  );
}

// ============================================================
//                    DATA CATEGORIES SECTION
// ============================================================

function DataCategoriesSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const categories = [
    { name: "EMAIL", icon: "✉", percent: 35, color: "#00FF85" },
    { name: "IDENTITY", icon: "◉", percent: 25, color: "#00C2FF" },
    { name: "SOCIAL", icon: "◎", percent: 20, color: "#FF0080" },
    { name: "FINANCIAL", icon: "◈", percent: 15, color: "#FFD700" },
    { name: "OTHER", icon: "◇", percent: 5, color: "#9945FF" },
  ];

  return (
    <section ref={ref} className="mt-8 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="mb-12"
      >
        <span className="font-mono text-xs text-primary uppercase tracking-widest">
          DATA MARKETPLACE
        </span>
        <h2 className="mt-4 font-mono text-4xl font-black uppercase md:text-5xl">
          WHAT YOU CAN TRADE
        </h2>
      </motion.div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Visual Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="border-2 border-border bg-card p-8"
        >
          <h3 className="font-mono text-sm font-bold uppercase mb-6 text-muted-foreground">
            DATA DISTRIBUTION
          </h3>

          {/* Horizontal bar chart */}
          <div className="space-y-4">
            {categories.map((cat, index) => (
              <motion.div
                key={cat.name}
                initial={{ opacity: 0, x: -20 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{cat.icon}</span>
                    <span className="font-mono text-xs uppercase">{cat.name}</span>
                  </div>
                  <span className="font-mono text-xs text-muted-foreground">{cat.percent}%</span>
                </div>
                <div className="h-3 bg-muted overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={isInView ? { width: `${cat.percent}%` } : {}}
                    transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                    className="h-full"
                    style={{ backgroundColor: cat.color }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Category Cards */}
        <div className="grid grid-cols-2 gap-4">
          {[
            { title: "EMAIL VERIFICATIONS", desc: "Prove email ownership from any domain without revealing content", icon: "✉" },
            { title: "KYC DATA", desc: "Share verified identity without exposing personal documents", icon: "◉" },
            { title: "SOCIAL PROOFS", desc: "Verify social media ownership and follower counts", icon: "◎" },
            { title: "CUSTOM DATA", desc: "Create pools for any verifiable data type", icon: "◇" },
          ].map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
              whileHover={{ scale: 1.02, borderColor: "var(--color-primary)" }}
              className="border-2 border-border bg-card p-6 transition-colors"
            >
              <div className="text-3xl mb-3 opacity-60">{item.icon}</div>
              <h4 className="font-mono text-xs font-bold uppercase mb-2">{item.title}</h4>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================
//                    TECHNOLOGY STACK SECTION
// ============================================================

function TechStackSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const techStack = [
    {
      name: "zkEmail",
      description: "Generate zero-knowledge proofs from emails without revealing content",
      features: ["DKIM Verification", "Regex Patterns", "Privacy Preserving"],
      color: "#00FF85"
    },
    {
      name: "zkVerify",
      description: "Verify ZK proofs on-chain with domain aggregation for cost efficiency",
      features: ["Proof Aggregation", "Cross-Chain", "Gas Efficient"],
      color: "#00C2FF"
    },
    {
      name: "Phala TEE",
      description: "Hardware-backed encryption for secure data storage and transfer",
      features: ["Trusted Execution", "Encrypted Storage", "Access Control"],
      color: "#FF0080"
    }
  ];

  return (
    <section ref={ref} className="mt-8 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="mb-12 text-center"
      >
        <span className="font-mono text-xs text-primary uppercase tracking-widest">
          POWERED BY
        </span>
        <h2 className="mt-4 font-mono text-4xl font-black uppercase md:text-5xl">
          CUTTING-EDGE TECH
        </h2>
        <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
          Built on the latest zero-knowledge and trusted execution technologies
        </p>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-3">
        {techStack.map((tech, index) => (
          <motion.div
            key={tech.name}
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: index * 0.15 }}
            className="border-2 border-border bg-card overflow-hidden group hover:border-primary transition-colors"
          >
            {/* Header */}
            <div
              className="p-6 border-b-2 border-border"
              style={{ backgroundColor: `${tech.color}10` }}
            >
              <div
                className="w-12 h-12 border-2 flex items-center justify-center font-mono text-xl font-black mb-4"
                style={{ borderColor: tech.color, color: tech.color }}
              >
                {tech.name.charAt(0)}
              </div>
              <h3 className="font-mono text-lg font-bold uppercase" style={{ color: tech.color }}>
                {tech.name}
              </h3>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className="text-sm text-muted-foreground mb-4">
                {tech.description}
              </p>
              <div className="flex flex-wrap gap-2">
                {tech.features.map((feature) => (
                  <span
                    key={feature}
                    className="px-2 py-1 border border-border font-mono text-xs uppercase"
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Security badges */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="mt-12 flex flex-wrap items-center justify-center gap-8"
      >
        {["AUDITED", "OPEN SOURCE", "NON-CUSTODIAL", "TRUSTLESS"].map((badge) => (
          <div key={badge} className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
            <span className="w-2 h-2 bg-primary" />
            {badge}
          </div>
        ))}
      </motion.div>
    </section>
  );
}

// ============================================================
//                    FINAL CTA SECTION
// ============================================================

function FinalCTASection({ onCreatePool }: { onCreatePool: () => void }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="mt-8 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={isInView ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.6 }}
        className="relative border-2 border-primary bg-primary/5 p-12 md:p-16 text-center overflow-hidden"
      >
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `repeating-linear-gradient(
              45deg,
              transparent,
              transparent 10px,
              currentColor 10px,
              currentColor 11px
            )`
          }} />
        </div>

        <div className="relative z-10">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="font-mono text-3xl md:text-5xl font-black uppercase mb-6"
          >
            READY TO START<br />
            <span className="text-primary">TRADING DATA?</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-muted-foreground max-w-xl mx-auto mb-8"
          >
            Join the verified data network. Browse inventory, create a pool when data is
            missing, or start selling your own data with privacy-preserving proofs.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="flex flex-wrap gap-4 justify-center"
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                href="/pools"
                className="flex items-center gap-2 border-2 border-foreground bg-foreground px-8 py-4 font-mono text-base font-bold uppercase text-background transition-all hover:border-primary hover:bg-primary"
              >
                EXPLORE POOLS
                <span>→</span>
              </Link>
            </motion.div>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <button
                onClick={onCreatePool}
                className="flex items-center gap-2 border-2 border-primary bg-background px-8 py-4 font-mono text-base font-bold uppercase text-primary transition-all hover:bg-primary hover:text-background"
              >
                CREATE POOL
                <span>+</span>
              </button>
            </motion.div>
          </motion.div>

          {/* Mini stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="mt-12 flex flex-wrap justify-center gap-8 font-mono text-sm"
          >
            <div className="text-center">
              <div className="text-2xl font-black text-primary">~30s</div>
              <div className="text-xs text-muted-foreground">PROOF TIME</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-black text-primary">$0.01</div>
              <div className="text-xs text-muted-foreground">AVG GAS COST</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-black text-primary">100%</div>
              <div className="text-xs text-muted-foreground">PRIVATE</div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}

// Pool card component - Commented out until we have real data
// function PoolCard({
//   name,
//   budget,
//   progress,
//   sellers,
//   status,
//   delay,
// }: {
//   name: string;
//   budget: string;
//   progress: number;
//   sellers: string;
//   status: string;
//   delay: number;
// }) {
//   return (
//     <motion.div
//       initial={{ opacity: 0, y: 20 }}
//       animate={{ opacity: 1, y: 0 }}
//       transition={{ delay, duration: 0.4 }}
//       whileHover={{ scale: 1.02, borderColor: "var(--color-primary)" }}
//       className="group cursor-pointer border border-border bg-card p-6 transition-all hover:bg-primary/5"
//     >
//       <div className="mb-4 flex items-start justify-between">
//         <h3 className="font-mono text-sm font-bold uppercase">{name}</h3>
//         <span
//           className={`font-mono text-xs uppercase ${
//             status === "active"
//               ? "text-primary"
//               : status === "ending"
//                 ? "text-accent"
//                 : "text-muted-foreground"
//           }`}
//         >
//           [{status}]
//         </span>
//       </div>

//       <div className="mb-4">
//         <div className="mb-2 flex justify-between font-mono text-xs text-muted-foreground">
//           <span>BUDGET</span>
//           <span className="text-foreground">{budget}</span>
//         </div>
//         <div className="h-1 w-full overflow-hidden bg-muted">
//           <motion.div
//             initial={{ width: 0 }}
//             animate={{ width: `${progress}%` }}
//             transition={{ duration: 1, ease: "easeOut", delay: delay + 0.3 }}
//             className="h-full bg-primary"
//           />
//         </div>
//       </div>

//       <div className="flex items-center justify-between font-mono text-xs">
//         <span className="text-muted-foreground">SELLERS</span>
//         <span className="text-foreground">{sellers}</span>
//       </div>
//     </motion.div>
//   );
// }
