'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { Copy, LogOut, User, Menu, X, Network } from 'lucide-react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { OnboardingModal } from './onboarding-modal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

export function Header() {
  const { address, isConnected } = useAccount();
  const { profile, loading, needsOnboarding, refreshProfile } = useUserProfile();
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const shouldShowOnboarding = onboardingOpen || (isConnected && needsOnboarding && !loading);

  const copyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address);
    }
  };

  const handleOnboardingSuccess = () => {
    setOnboardingOpen(false);
    refreshProfile();
  };

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-[#dbe3ef]/90 bg-[#f5f7fb]/88 backdrop-blur-xl">
        <div className="mx-auto max-w-[94rem] px-4 py-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-3 text-base font-semibold tracking-[-0.02em] md:text-lg"
            >
              <Image
                src="/accessfi_logo.png"
                alt="AccessFi"
                width={48}
                height={48}
                className="h-12 w-12 object-contain md:h-12 md:w-12"
              />
              <div className="hidden sm:block">
                <div className="text-base font-semibold text-[#101828] md:text-lg">AccessFi</div>
                <div className="text-[11px] uppercase tracking-[0.24em] text-[#6b7280]">
                  Verified data network
                </div>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden items-center gap-7 text-sm font-medium md:flex">
              <Link
                href="/inventory"
                className="text-[#5f6b7b] transition-colors hover:text-[#101828]"
              >
                Inventory
              </Link>
              <Link
                href="/dashboard"
                className="text-[#5f6b7b] transition-colors hover:text-[#101828]"
              >
                Dashboard
              </Link>
              <Link
                href="/pools"
                className="text-[#5f6b7b] transition-colors hover:text-[#101828]"
              >
                Requests
              </Link>
              <Link
                href="/docs"
                className="text-[#5f6b7b] transition-colors hover:text-[#101828]"
              >
                Docs
              </Link>

              <ConnectButton.Custom>
                {({
                  account,
                  chain,
                  openAccountModal,
                  openChainModal,
                  openConnectModal,
                  mounted: ready,
                }) => {
                  const connected = ready && account && chain;

                  return (
                    <div
                      {...(!ready && {
                        'aria-hidden': true,
                        style: {
                          opacity: 0,
                          pointerEvents: 'none',
                          userSelect: 'none',
                        },
                      })}
                    >
                      {(() => {
                        if (!connected) {
                          return (
                            <button
                              onClick={openConnectModal}
                              type="button"
                              className="rounded-xl bg-[#0f172a] px-4 py-2 text-xs font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-[#1e3a8a] md:px-5 md:py-2.5 md:text-sm"
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
                              className="rounded-xl bg-destructive px-4 py-2 text-xs font-semibold text-destructive-foreground transition-all hover:-translate-y-0.5 hover:bg-destructive/90 md:px-5 md:py-2.5 md:text-sm"
                            >
                              Wrong network
                            </button>
                          );
                        }

                        return (
                          <div className="flex items-center gap-3">
                            {profile ? (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button
                                    type="button"
                                className="flex items-center gap-2 rounded-xl border border-[#dbe3ef] bg-white px-4 py-2 text-xs font-semibold text-[#101828] transition-all hover:border-[#a5c2ff] hover:bg-[#f8fbff] md:px-5 md:py-2.5 md:text-sm"
                                  >
                                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0f172a] text-[11px] text-white md:h-6 md:w-6">
                                        {profile.fullName.charAt(0).toUpperCase()}
                                      </div>
                                    <span className="hidden sm:inline">{profile.fullName}</span>
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  className="w-80 rounded-2xl border border-border bg-background shadow-[0_18px_50px_rgba(29,35,31,0.12)]"
                                  sideOffset={8}
                                >
                                  <div className="border-b border-border bg-card p-4">
                                    <div className="flex items-center gap-3">
                                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                                        {profile.fullName.charAt(0).toUpperCase()}
                                      </div>
                                      <div className="flex-1">
                                        <div className="font-semibold">{profile.fullName}</div>
                                        <div className="text-xs text-muted-foreground">
                                          {profile.role} • Connected
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="space-y-1 p-2">
                                    <Link href="/dashboard">
                                      <DropdownMenuItem className="cursor-pointer font-semibold">
                                        <User className="h-4 w-4" />
                                        Dashboard
                                      </DropdownMenuItem>
                                    </Link>

                                    <DropdownMenuItem
                                      onClick={openChainModal}
                                      className="cursor-pointer font-semibold"
                                    >
                                      <Network className="h-4 w-4" />
                                      Network: {chain.name}
                                    </DropdownMenuItem>

                                    <DropdownMenuItem
                                      onClick={copyAddress}
                                      className="cursor-pointer font-semibold"
                                    >
                                      <Copy className="h-4 w-4" />
                                      Copy Address
                                    </DropdownMenuItem>

                                    <DropdownMenuSeparator className="my-2" />

                                    <DropdownMenuItem
                                      onClick={openAccountModal}
                                      className="cursor-pointer font-semibold text-destructive focus:bg-destructive/10 focus:text-destructive"
                                    >
                                      <LogOut className="h-4 w-4" />
                                      Disconnect
                                    </DropdownMenuItem>
                                  </div>

                                  <div className="border-t border-border bg-muted/50 p-3">
                                    <div className="text-xs text-muted-foreground">
                                      <div className="mb-1 font-medium uppercase tracking-[0.2em]">Wallet Address</div>
                                      <div className="font-mono text-[10px] break-all">
                                        {address}
                                      </div>
                                    </div>
                                  </div>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            ) : (
                              <button
                                onClick={openAccountModal}
                                type="button"
                                className="border-2 border-primary bg-primary px-4 py-2 font-mono text-xs font-bold uppercase text-primary-foreground transition-all hover:bg-primary/90 md:px-6 md:py-3 md:text-sm"
                              >
                                {account.displayName}
                              </button>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  );
                }}
              </ConnectButton.Custom>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-xl border border-[#dbe3ef] bg-white p-2 text-[#101828] transition-all hover:border-[#a5c2ff] md:hidden"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="mt-4 space-y-4 border-t border-border pt-4 md:hidden">
              <Link
                href="/dashboard"
                className="block text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                href="/pools"
                className="block text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                Requests
              </Link>
              <Link
                href="/docs"
                className="block text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                Docs
              </Link>

              <ConnectButton.Custom>
                {({
                  account,
                  chain,
                  openAccountModal,
                  openChainModal,
                  openConnectModal,
                  mounted: ready,
                }) => {
                  const connected = ready && account && chain;

                  return (
                    <div className="pt-2">
                      {(() => {
                        if (!connected) {
                          return (
                            <button
                              onClick={openConnectModal}
                              type="button"
                              className="w-full rounded-xl bg-foreground px-4 py-3 text-sm font-semibold text-background transition-all hover:bg-primary hover:text-primary-foreground"
                            >
                              Connect wallet
                            </button>
                          );
                        }

                        if (chain.unsupported) {
                          return (
                            <button
                              onClick={openChainModal}
                              type="button"
                              className="w-full rounded-xl bg-destructive px-4 py-3 text-sm font-semibold text-destructive-foreground transition-all hover:bg-destructive/90"
                            >
                              Wrong network
                            </button>
                          );
                        }

                        return (
                          <div className="space-y-2">
                            {profile && (
                              <div className="rounded-2xl border border-border bg-card p-4">
                                <div className="flex items-center gap-3 mb-3">
                                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                                    {profile.fullName.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <div className="text-sm font-semibold">{profile.fullName}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {profile.role}
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-2 text-xs">
                                  <button
                                    onClick={openChainModal}
                                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm hover:border-primary/50"
                                  >
                                    Network: {chain.name}
                                  </button>
                                  <button
                                    onClick={copyAddress}
                                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm hover:border-primary/50"
                                  >
                                    Copy Address
                                  </button>
                                  <button
                                    onClick={openAccountModal}
                                    className="w-full rounded-xl border border-destructive bg-destructive/10 px-3 py-2 text-sm text-destructive hover:bg-destructive/20"
                                  >
                                    Disconnect
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  );
                }}
              </ConnectButton.Custom>
            </div>
          )}
        </div>
      </nav>

      {/* Onboarding Modal */}
      <OnboardingModal
        open={shouldShowOnboarding}
        onClose={() => setOnboardingOpen(false)}
        onSuccess={handleOnboardingSuccess}
      />
    </>
  );
}
