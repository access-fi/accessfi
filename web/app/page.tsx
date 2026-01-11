"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Header } from "@/components/header";

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-24">
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
                COMING SOON...
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
                A decentralized marketplace for verified data powered by
                zero-knowledge proofs. Trade privately, securely, and
                trustlessly.
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
                    href="/pools"
                    className="group flex items-center gap-2 border-2 border-foreground bg-foreground px-8 py-4 font-mono text-base font-bold uppercase text-background transition-all hover:border-primary hover:bg-primary"
                    style={{
                      boxShadow: '6px 6px 0px rgba(0, 255, 133, 0.4)'
                    }}
                  >
                    BROWSE POOLS
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
                  <Link
                    href="/pools/create"
                    className="group flex items-center gap-2 border-2 border-border bg-background px-8 py-4 font-mono text-base font-bold uppercase transition-all hover:border-foreground hover:bg-card"
                  >
                    CREATE POOL
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
                  </Link>
                </motion.div>
              </motion.div>
            </div>

            {/* Right side - 3D Visual Element */}
            <div className="hidden lg:flex lg:items-center lg:justify-center">
              <FloatingCubes />
            </div>
          </div>

          {/* Stats section */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="my-12 grid grid-cols-1 gap-px border border-border bg-border md:grid-cols-3"
          >
            <StatBox number="127" label="ACTIVE POOLS" trend="+12.5%" trendUp={true} delay={0} />
            <StatBox number="$2.4M" label="TOTAL VOLUME" trend="+24.8%" trendUp={true} delay={0.1} />
            <StatBox number="1,284" label="DATA VERIFIED" trend="+8.2%" trendUp={true} delay={0.2} />
          </motion.div>

          {/* Features grid */}
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
              description="Automatic payments and token transfers upon proof verification"
              delay={0.1}
            />
            <FeatureCard
              icon="🌐"
              title="FULLY ON-CHAIN"
              description="No intermediaries. All transactions settled on Ethereum blockchain"
              delay={0.2}
            />
          </motion.div>

          {/* Recent pools preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.3 }}
            className="mt-24"
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-mono text-2xl font-bold uppercase">TRENDING POOLS</h2>
              <Link href="/pools" className="font-mono text-sm text-primary transition-colors hover:text-primary/80">
                VIEW ALL →
              </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <PoolCard
                name="HEALTH DATA POOL #A4F2"
                budget="5.2 ETH"
                progress={65}
                sellers="12/20"
                status="active"
                delay={0}
              />
              <PoolCard
                name="LOCATION DATA #B7E9"
                budget="3.8 ETH"
                progress={40}
                sellers="8/15"
                status="active"
                delay={0.1}
              />
              <PoolCard
                name="SURVEY RESPONSES #C1D4"
                budget="2.5 ETH"
                progress={90}
                sellers="18/20"
                status="ending"
                delay={0.2}
              />
            </div>
          </motion.div>

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
    </div>
  );
}

// Stat box component
function StatBox({
  number,
  label,
  trend,
  trendUp,
  delay,
}: {
  number: string;
  label: string;
  trend: string;
  trendUp: boolean;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ scale: 1.02 }}
      className="bg-background p-8 transition-all"
    >
      <div className="mb-2 font-mono text-4xl font-black text-foreground">{number}</div>
      <div className="mb-2 font-mono text-xs text-muted-foreground">{label}</div>
      <div className={`font-mono text-xs ${trendUp ? "text-primary" : "text-destructive"}`}>
        {trend}
      </div>
    </motion.div>
  );
}

// Feature card component
function FeatureCard({
  icon,
  title,
  description,
  delay,
}: {
  icon: string;
  title: string;
  description: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ scale: 1.02, borderColor: "var(--color-primary)" }}
      className="group border border-border bg-card p-8 transition-all hover:bg-primary/5"
    >
      <motion.div
        whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.1 }}
        transition={{ duration: 0.5 }}
        className="mb-4 text-4xl"
      >
        {icon}
      </motion.div>
      <h3 className="mb-3 font-mono text-lg font-bold uppercase">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </motion.div>
  );
}

// Pool card component
function PoolCard({
  name,
  budget,
  progress,
  sellers,
  status,
  delay,
}: {
  name: string;
  budget: string;
  progress: number;
  sellers: string;
  status: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ scale: 1.02, borderColor: "var(--color-primary)" }}
      className="group cursor-pointer border border-border bg-card p-6 transition-all hover:bg-primary/5"
    >
      <div className="mb-4 flex items-start justify-between">
        <h3 className="font-mono text-sm font-bold uppercase">{name}</h3>
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

      <div className="mb-4">
        <div className="mb-2 flex justify-between font-mono text-xs text-muted-foreground">
          <span>BUDGET</span>
          <span className="text-foreground">{budget}</span>
        </div>
        <div className="h-1 w-full overflow-hidden bg-muted">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: "easeOut", delay: delay + 0.3 }}
            className="h-full bg-primary"
          />
        </div>
      </div>

      <div className="flex items-center justify-between font-mono text-xs">
        <span className="text-muted-foreground">SELLERS</span>
        <span className="text-foreground">{sellers}</span>
      </div>
    </motion.div>
  );
}

// Simple animated visual
function FloatingCubes() {
  return (
    <div className="relative h-[500px] w-full">
      {/* Decorative corner brackets - Top Left */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="absolute left-0 top-0 z-10"
      >
        {/* Horizontal line */}
        <div className="h-0.5 w-20 bg-gradient-to-r from-accent to-transparent" />
        {/* Vertical line */}
        <div className="h-20 w-0.5 bg-gradient-to-b from-accent to-transparent" />
      </motion.div>

      {/* Decorative corner brackets - Bottom Right */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-0 right-0 z-10"
      >
        {/* Horizontal line */}
        <div className="h-0.5 w-20 bg-gradient-to-l from-primary to-transparent" />
        {/* Vertical line */}
        <div className="absolute bottom-0 right-0 h-20 w-0.5 bg-gradient-to-t from-primary to-transparent" />
      </motion.div>

      {/* Large animated square in center */}
      <div className="flex h-full items-center justify-center">
        <div className="relative">
          {/* Rotating border effect */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 h-80 w-80 border-t-2 border-r-2 border-primary"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 h-80 w-80 border-b-2 border-l-2 border-accent"
          />

          {/* Center content */}
          <div className="flex h-80 w-80 flex-col items-center justify-center border-2 border-border bg-background/50 p-8 backdrop-blur-sm">
            {/* Placeholder for future content */}
            <motion.div
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="font-mono text-sm text-muted-foreground"
            >
              DECENTRALIZED
            </motion.div>
          </div>

          {/* Corner accents */}
          <motion.div
            animate={{ opacity: [0.3, 0.8, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute -left-2 -top-2 h-4 w-4 border-l-2 border-t-2 border-primary"
          />
          <motion.div
            animate={{ opacity: [0.3, 0.8, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
            className="absolute -right-2 -bottom-2 h-4 w-4 border-r-2 border-b-2 border-accent"
          />
        </div>
      </div>

      {/* Floating particles */}
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          animate={{
            y: [0, -30, 0],
            x: [0, Math.random() * 20 - 10, 0],
            opacity: [0, 0.6, 0],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: i * 0.4,
          }}
          className="absolute h-1 w-1 bg-primary"
          style={{
            left: `${10 + Math.random() * 80}%`,
            top: `${10 + Math.random() * 80}%`,
          }}
        />
      ))}
    </div>
  );
}
