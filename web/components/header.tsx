"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { Copy, LogOut, User, Menu, X, Network } from "lucide-react";
import { useUserProfile } from "@/hooks/useUserProfile";
import { OnboardingModal } from "./onboarding-modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

const navLinks = [
  { href: "/inventory", label: "Inventory" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/pools", label: "Requests" },
  { href: "/docs", label: "Docs" },
];

export function Header() {
  const pathname = usePathname();
  const { address, isConnected } = useAccount();
  const { profile, loading, needsOnboarding, refreshProfile } = useUserProfile();
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const shouldShowOnboarding = onboardingOpen || (isConnected && needsOnboarding && !loading);

  const copyAddress = async () => {
    if (address) await navigator.clipboard.writeText(address);
  };

  return (
    <>
      <nav className="sticky top-0 z-50 px-4 pt-4 md:px-6 lg:px-8">
        <div className="mx-auto max-w-[96rem]">
          <div className="rounded-full border border-[#d9e4fb] bg-[linear-gradient(180deg,rgba(243,247,255,0.96)_0%,rgba(232,240,255,0.92)_100%)] px-5 py-3 shadow-[0_18px_40px_rgba(67,97,173,0.10)] backdrop-blur-xl md:px-7">
            <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4 md:gap-8">
              <Link href="/" className="flex min-w-0 items-center gap-3">
                <Image
                  src="/accessfi_logo.png"
                  alt="AccessFi"
                  width={42}
                  height={42}
                  className="h-10 w-10 object-contain"
                />
                <div className="min-w-0">
                  <div className="truncate text-lg font-semibold tracking-[-0.03em] text-[#16213b]">AccessFi</div>
                  <div className="truncate text-[10px] uppercase tracking-[0.28em] text-[#7c8db0] md:text-[11px]">
                    Verified data network
                  </div>
                </div>
              </Link>

              <div className="hidden items-center justify-center gap-8 md:flex">
                {navLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`rounded-full px-3 py-2 text-sm font-medium transition-colors ${
                      pathname === item.href
                        ? "bg-white text-[#16305d] shadow-[0_10px_24px_rgba(80,120,200,0.10)]"
                        : "text-[#5c6e92] hover:text-[#13203b]"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>

              <div className="hidden justify-end md:flex">
                <ConnectButton.Custom>
                  {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
                    const connected = mounted && account && chain;

                    if (!connected) {
                      return (
                        <button
                          onClick={openConnectModal}
                          type="button"
                          className="rounded-full bg-[#4472ff] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(68,114,255,0.28)] transition-all hover:-translate-y-0.5 hover:bg-[#3766f2]"
                        >
                          Connect
                        </button>
                      );
                    }

                    if (chain.unsupported) {
                      return (
                        <button
                          onClick={openChainModal}
                          type="button"
                          className="rounded-full bg-[#f04438] px-5 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-[#dc352e]"
                        >
                          Wrong network
                        </button>
                      );
                    }

                    if (profile) {
                      return (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className="flex items-center gap-2 rounded-full border border-[#d6e2fb] bg-white px-3 py-2 text-sm font-semibold text-[#16213b] transition-all hover:border-[#b2c8fb] hover:bg-[#f8fbff]"
                            >
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#16213b] text-xs text-white">
                                {profile.fullName.charAt(0).toUpperCase()}
                              </div>
                              <span className="max-w-[9rem] truncate">{profile.fullName}</span>
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            sideOffset={10}
                            className="w-80 rounded-[22px] border border-[#dce6f8] bg-white shadow-[0_24px_60px_rgba(31,49,86,0.14)]"
                          >
                            <div className="border-b border-[#e7eefb] bg-[#f6f9ff] p-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#4472ff] text-lg font-bold text-white">
                                  {profile.fullName.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div className="font-semibold text-[#14203b]">{profile.fullName}</div>
                                  <div className="text-xs text-[#7c8db0]">{profile.role} • Connected</div>
                                </div>
                              </div>
                            </div>
                            <div className="p-2">
                              <Link href="/dashboard">
                                <DropdownMenuItem className="cursor-pointer font-medium text-[#14203b]">
                                  <User className="h-4 w-4" />
                                  Dashboard
                                </DropdownMenuItem>
                              </Link>
                              <DropdownMenuItem onClick={openChainModal} className="cursor-pointer font-medium text-[#14203b]">
                                <Network className="h-4 w-4" />
                                Network: {chain.name}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={copyAddress} className="cursor-pointer font-medium text-[#14203b]">
                                <Copy className="h-4 w-4" />
                                Copy address
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="my-2" />
                              <DropdownMenuItem
                                onClick={openAccountModal}
                                className="cursor-pointer font-medium text-[#d13a30] focus:bg-[#fff2f1] focus:text-[#d13a30]"
                              >
                                <LogOut className="h-4 w-4" />
                                Disconnect
                              </DropdownMenuItem>
                            </div>
                            <div className="border-t border-[#e7eefb] bg-[#f6f9ff] p-3 text-xs text-[#7c8db0]">
                              <div className="mb-1 font-medium uppercase tracking-[0.2em]">Wallet</div>
                              <div className="break-all font-mono text-[10px]">{address}</div>
                            </div>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      );
                    }

                    return (
                      <button
                        onClick={openAccountModal}
                        type="button"
                        className="rounded-full border border-[#d6e2fb] bg-white px-4 py-2 text-xs font-semibold tracking-[0.12em] text-[#16213b] transition-all hover:border-[#b2c8fb]"
                      >
                        {account.displayName}
                      </button>
                    );
                  }}
                </ConnectButton.Custom>
              </div>

              <button
                onClick={() => setMobileMenuOpen((value) => !value)}
                className="justify-self-end rounded-full border border-[#d6e2fb] bg-white p-2 text-[#16213b] md:hidden"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>

            {mobileMenuOpen && (
              <div className="mt-4 border-t border-[#dce6f8] pt-4 md:hidden">
                <div className="space-y-3">
                  {navLinks.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`block rounded-2xl px-3 py-3 text-sm font-medium transition-colors ${
                        pathname === item.href
                          ? "bg-white text-[#16305d] shadow-[0_10px_24px_rgba(80,120,200,0.08)]"
                          : "text-[#5c6e92] hover:bg-white/70 hover:text-[#13203b]"
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
                <div className="pt-3">
                  <ConnectButton.Custom>
                    {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
                      const connected = mounted && account && chain;

                      if (!connected) {
                        return (
                          <button
                            onClick={openConnectModal}
                            type="button"
                            className="w-full rounded-2xl bg-[#4472ff] px-4 py-3 text-sm font-semibold text-white"
                          >
                            Connect
                          </button>
                        );
                      }

                      if (chain.unsupported) {
                        return (
                          <button
                            onClick={openChainModal}
                            type="button"
                            className="w-full rounded-2xl bg-[#f04438] px-4 py-3 text-sm font-semibold text-white"
                          >
                            Wrong network
                          </button>
                        );
                      }

                      return (
                        <div className="rounded-[22px] border border-[#dce6f8] bg-white p-4">
                          {profile ? (
                            <>
                              <div className="mb-3 flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#16213b] text-sm text-white">
                                  {profile.fullName.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div className="font-semibold text-[#16213b]">{profile.fullName}</div>
                                  <div className="text-xs text-[#7c8db0]">{profile.role}</div>
                                </div>
                              </div>
                              <div className="space-y-2 text-xs">
                                <button onClick={openChainModal} className="w-full rounded-xl border border-[#dce6f8] px-3 py-2 text-left text-[#16213b]">
                                  Network: {chain.name}
                                </button>
                                <button onClick={copyAddress} className="w-full rounded-xl border border-[#dce6f8] px-3 py-2 text-left text-[#16213b]">
                                  Copy address
                                </button>
                                <button onClick={openAccountModal} className="w-full rounded-xl border border-[#ffd7d2] bg-[#fff4f2] px-3 py-2 text-left text-[#d13a30]">
                                  Disconnect
                                </button>
                              </div>
                            </>
                          ) : (
                            <button onClick={openAccountModal} className="w-full rounded-xl border border-[#dce6f8] px-3 py-2 text-sm font-semibold text-[#16213b]">
                              {account.displayName}
                            </button>
                          )}
                        </div>
                      );
                    }}
                  </ConnectButton.Custom>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      <OnboardingModal
        open={shouldShowOnboarding}
        onClose={() => setOnboardingOpen(false)}
        onSuccess={() => {
          setOnboardingOpen(false);
          refreshProfile();
        }}
      />
    </>
  );
}
