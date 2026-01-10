'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { Copy, LogOut, User } from 'lucide-react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { OnboardingModal } from './onboarding-modal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

export function Header() {
  const { address, isConnected } = useAccount();
  const { profile, loading, needsOnboarding, refreshProfile } = useUserProfile();
  const [onboardingOpen, setOnboardingOpen] = useState(false);

  // Show onboarding modal when user connects without profile
  useEffect(() => {
    if (isConnected && needsOnboarding && !loading) {
      setOnboardingOpen(true);
    }
  }, [isConnected, needsOnboarding, loading]);

  const copyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address);
      // Could add a toast notification here
    }
  };

  const handleOnboardingSuccess = () => {
    setOnboardingOpen(false);
    refreshProfile();
  };

  return (
    <>
      <nav className="container mx-auto flex items-center justify-between border-b border-border px-2 py-6 sticky top-0 z-50 bg-background/95 backdrop-blur">
        <div className="font-mono text-base font-bold uppercase tracking-wider">
          <Link href="/">
            <span className="text-primary">●</span> ACCESSFI
          </Link>
        </div>

        <div className="flex items-center gap-12 font-mono text-sm uppercase">
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
                          className="brutal-shadow border-2 border-primary bg-primary px-6 py-3 font-mono text-sm font-bold uppercase text-primary-foreground transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none"
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
                          className="brutal-shadow border-2 border-destructive bg-destructive px-6 py-3 font-mono text-sm font-bold uppercase text-destructive-foreground transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none"
                        >
                          WRONG NETWORK
                        </button>
                      );
                    }

                    return (
                      <div className="flex items-center gap-3">
                        <button
                          onClick={openChainModal}
                          type="button"
                          className="brutal-shadow border border-border bg-background px-4 py-3 font-mono text-xs font-bold uppercase transition-all hover:border-primary"
                        >
                          {chain.hasIcon && (
                            <div
                              style={{
                                background: chain.iconBackground,
                                width: 16,
                                height: 16,
                                borderRadius: 999,
                                overflow: 'hidden',
                                marginRight: 8,
                                display: 'inline-block',
                              }}
                            >
                              {chain.iconUrl && (
                                <img
                                  alt={chain.name ?? 'Chain icon'}
                                  src={chain.iconUrl}
                                  style={{ width: 16, height: 16 }}
                                />
                              )}
                            </div>
                          )}
                          {chain.name}
                        </button>

                        {/* Profile Dropdown */}
                        {profile ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                className="brutal-shadow flex items-center gap-2 border-2 border-primary bg-primary px-6 py-3 font-mono text-sm font-bold uppercase text-primary-foreground transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none"
                              >
                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-foreground text-primary">
                                  {profile.fullName.charAt(0).toUpperCase()}
                                </div>
                                {profile.fullName}
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="brutal-shadow w-80 border-2 border-border bg-background font-mono"
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
                                  onClick={copyAddress}
                                  className="cursor-pointer font-semibold uppercase"
                                >
                                  <Copy className="h-4 w-4" />
                                  Copy Wallet Address
                                </DropdownMenuItem>

                                <DropdownMenuSeparator className="my-2" />

                                <DropdownMenuItem
                                  onClick={openAccountModal}
                                  className="cursor-pointer font-semibold uppercase text-destructive focus:bg-destructive/10 focus:text-destructive"
                                >
                                  <LogOut className="h-4 w-4" />
                                  Disconnect Wallet
                                </DropdownMenuItem>
                              </div>

                              <div className="border-t-2 border-border bg-muted/50 p-3">
                                <div className="text-xs text-muted-foreground">
                                  <div className="mb-1 font-bold uppercase">Wallet Address</div>
                                  <div className="font-mono text-[10px]">
                                    {address?.slice(0, 6)}...{address?.slice(-4)}
                                  </div>
                                </div>
                              </div>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : (
                          // Fallback to wallet address if profile not loaded yet
                          <button
                            onClick={openAccountModal}
                            type="button"
                            className="brutal-shadow border-2 border-primary bg-primary px-6 py-3 font-mono text-sm font-bold uppercase text-primary-foreground transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none"
                          >
                            {account.displayName}
                            {account.displayBalance ? ` (${account.displayBalance})` : ''}
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
