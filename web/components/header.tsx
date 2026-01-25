'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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

  // Show onboarding modal when user connects without profile
  useEffect(() => {
    if (isConnected && needsOnboarding && !loading) {
      setOnboardingOpen(true);
    }
  }, [isConnected, needsOnboarding, loading]);

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
      <nav className="sticky top-0 z-50 border-b-2 border-border bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="font-mono text-base font-bold uppercase tracking-wider md:text-lg">
              <span className="text-primary">●</span> ACCESSFI
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8 font-mono text-sm uppercase">
              <Link
                href="/dashboard"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                DASHBOARD
              </Link>
              <Link
                href="/pools"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                POOLS
              </Link>
              <Link
                href="/docs"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                DOCS
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
                              className="border-2 border-primary bg-primary px-4 py-2 font-mono text-xs font-bold uppercase text-primary-foreground transition-all hover:bg-primary/90 md:px-6 md:py-3 md:text-sm"
                            >
                              CONNECT
                            </button>
                          );
                        }

                        if (chain.unsupported) {
                          return (
                            <button
                              onClick={openChainModal}
                              type="button"
                              className="border-2 border-destructive bg-destructive px-4 py-2 font-mono text-xs font-bold uppercase text-destructive-foreground transition-all hover:bg-destructive/90 md:px-6 md:py-3 md:text-sm"
                            >
                              WRONG NETWORK
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
                                    className="flex items-center gap-2 border-2 border-primary bg-primary px-4 py-2 font-mono text-xs font-bold uppercase text-primary-foreground transition-all hover:bg-primary/90 md:px-6 md:py-3 md:text-sm"
                                  >
                                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-foreground text-primary text-xs md:h-6 md:w-6">
                                      {profile.fullName.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="hidden sm:inline">{profile.fullName}</span>
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  className="w-80 border-2 border-border bg-background font-mono shadow-lg"
                                  sideOffset={8}
                                >
                                  <div className="border-b-2 border-border bg-card p-4">
                                    <div className="flex items-center gap-3">
                                      <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-primary bg-primary text-xl font-bold text-primary-foreground">
                                        {profile.fullName.charAt(0).toUpperCase()}
                                      </div>
                                      <div className="flex-1">
                                        <div className="font-bold uppercase">{profile.fullName}</div>
                                        <div className="text-xs uppercase text-muted-foreground">
                                          {profile.role} • Connected
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="space-y-1 p-2">
                                    <Link href="/dashboard">
                                      <DropdownMenuItem className="cursor-pointer font-semibold uppercase">
                                        <User className="h-4 w-4" />
                                        Dashboard
                                      </DropdownMenuItem>
                                    </Link>

                                    <DropdownMenuItem
                                      onClick={openChainModal}
                                      className="cursor-pointer font-semibold uppercase"
                                    >
                                      <Network className="h-4 w-4" />
                                      Network: {chain.name}
                                    </DropdownMenuItem>

                                    <DropdownMenuItem
                                      onClick={copyAddress}
                                      className="cursor-pointer font-semibold uppercase"
                                    >
                                      <Copy className="h-4 w-4" />
                                      Copy Address
                                    </DropdownMenuItem>

                                    <DropdownMenuSeparator className="my-2" />

                                    <DropdownMenuItem
                                      onClick={openAccountModal}
                                      className="cursor-pointer font-semibold uppercase text-destructive focus:bg-destructive/10 focus:text-destructive"
                                    >
                                      <LogOut className="h-4 w-4" />
                                      Disconnect
                                    </DropdownMenuItem>
                                  </div>

                                  <div className="border-t-2 border-border bg-muted/50 p-3">
                                    <div className="text-xs text-muted-foreground">
                                      <div className="mb-1 font-bold uppercase">Wallet Address</div>
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
              className="md:hidden border-2 border-border bg-background p-2 transition-all hover:border-primary"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 border-t-2 border-border pt-4 space-y-4">
              <Link
                href="/dashboard"
                className="block font-mono text-sm uppercase text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                DASHBOARD
              </Link>
              <Link
                href="/pools"
                className="block font-mono text-sm uppercase text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                POOLS
              </Link>
              <Link
                href="/docs"
                className="block font-mono text-sm uppercase text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                DOCS
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
                              className="w-full border-2 border-primary bg-primary px-4 py-3 font-mono text-sm font-bold uppercase text-primary-foreground transition-all hover:bg-primary/90"
                            >
                              CONNECT WALLET
                            </button>
                          );
                        }

                        if (chain.unsupported) {
                          return (
                            <button
                              onClick={openChainModal}
                              type="button"
                              className="w-full border-2 border-destructive bg-destructive px-4 py-3 font-mono text-sm font-bold uppercase text-destructive-foreground transition-all hover:bg-destructive/90"
                            >
                              WRONG NETWORK
                            </button>
                          );
                        }

                        return (
                          <div className="space-y-2">
                            {profile && (
                              <div className="border-2 border-border bg-card p-4">
                                <div className="flex items-center gap-3 mb-3">
                                  <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-primary bg-primary text-lg font-bold text-primary-foreground">
                                    {profile.fullName.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <div className="font-mono text-sm font-bold uppercase">{profile.fullName}</div>
                                    <div className="font-mono text-xs uppercase text-muted-foreground">
                                      {profile.role}
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-2 text-xs">
                                  <button
                                    onClick={openChainModal}
                                    className="w-full border border-border bg-background px-3 py-2 font-mono uppercase hover:border-primary"
                                  >
                                    Network: {chain.name}
                                  </button>
                                  <button
                                    onClick={copyAddress}
                                    className="w-full border border-border bg-background px-3 py-2 font-mono uppercase hover:border-primary"
                                  >
                                    Copy Address
                                  </button>
                                  <button
                                    onClick={openAccountModal}
                                    className="w-full border border-destructive bg-destructive/10 px-3 py-2 font-mono uppercase text-destructive hover:bg-destructive/20"
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
        open={onboardingOpen}
        onClose={() => setOnboardingOpen(false)}
        onSuccess={handleOnboardingSuccess}
      />
    </>
  );
}
