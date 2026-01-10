'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useGetUserContract } from '@/lib/contracts/hooks';

export interface UserProfile {
  walletAddress: string;
  userContractAddress?: string;
  fullName: string;
  role: 'buyer' | 'seller' | 'both';
  dataToSell?: string;
  dataToBuy?: string;
  createdAt: Date;
  updatedAt: Date;
  onboardingCompleted: boolean;
}

export function useUserProfile() {
  const { address, isConnected } = useAccount();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  // Get user contract address from factory
  const { data: userContractAddress } = useGetUserContract(address);

  // Fetch profile from database
  useEffect(() => {
    async function fetchProfile() {
      if (!address || !isConnected) {
        setProfile(null);
        setNeedsOnboarding(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/user?address=${address}`);
        const data = await response.json();

        if (response.ok && data.exists) {
          setProfile(data.profile);
          setNeedsOnboarding(false);
        } else {
          // Profile doesn't exist in database
          setProfile(null);
          setNeedsOnboarding(true);
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch profile');
        // If fetch fails, still check if they need onboarding
        setNeedsOnboarding(true);
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [address, isConnected]);

  // Refresh profile (call after onboarding completes)
  const refreshProfile = async () => {
    if (!address) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/user?address=${address}`);
      const data = await response.json();

      if (response.ok && data.exists) {
        setProfile(data.profile);
        setNeedsOnboarding(false);
      }
    } catch (err) {
      console.error('Error refreshing profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh profile');
    } finally {
      setLoading(false);
    }
  };

  return {
    profile,
    userContractAddress,
    loading,
    error,
    needsOnboarding,
    hasUserContract: !!userContractAddress && userContractAddress !== '0x0000000000000000000000000000000000000000',
    refreshProfile,
  };
}
