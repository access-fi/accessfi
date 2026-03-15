'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAccount, useSignMessage } from 'wagmi';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { parseEther } from 'viem';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useBuyAsset } from '@/lib/contracts/hooks';

type InventoryAsset = {
  assetId: string;
  category: string;
  subtype: string | null;
  proofTypeId: string;
  basePrice: string;
  resalePolicy: string;
  searchableAttributes: Record<string, unknown>;
  verifiedAt: string | null;
};

type AccessibleAsset = {
  assetId: string;
  category: string;
  subtype: string | null;
  proofTypeId: string;
  encryptedCID: string;
  searchableAttributes: Record<string, unknown>;
  verifiedAt: string | null;
  grantedAt: string;
};

export default function InventoryPage() {
  const { address, isConnected, chainId } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { profile } = useUserProfile();
  const { buyAsset, isPending: isBuying } = useBuyAsset(profile?.userContractAddress as `0x${string}` | undefined);
  const [assets, setAssets] = useState<InventoryAsset[]>([]);
  const [purchasedAssets, setPurchasedAssets] = useState<AccessibleAsset[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyAssetId, setBusyAssetId] = useState<string | null>(null);
  const [decrypted, setDecrypted] = useState<Record<string, string>>({});

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const assetsRes = await fetch('/api/inventory/assets');
      const assetsJson = await assetsRes.json();
      setAssets(assetsJson.items || []);

      if (address && chainId) {
        const accessRes = await fetch(`/api/inventory/access?buyerAddress=${address}&chainId=${chainId}`);
        const accessJson = await accessRes.json();
        setPurchasedAssets(accessJson.items || []);
      } else {
        setPurchasedAssets([]);
      }

      setLoading(false);
    };

    load().catch(() => setLoading(false));
  }, [address, chainId]);

  const filteredAssets = assets.filter((asset) => {
    if (!filter) return true;
    const haystack = `${asset.category} ${asset.subtype || ''} ${asset.proofTypeId}`.toLowerCase();
    return haystack.includes(filter.toLowerCase());
  });

  const purchaseAsset = async (assetId: string) => {
    if (!address || !chainId || !profile?.userContractAddress) return;
    setBusyAssetId(assetId);
    try {
      const asset = assets.find((item) => item.assetId === assetId);
      if (!asset) throw new Error('Asset not found');

      await buyAsset(assetId as `0x${string}`, parseEther(asset.basePrice));
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const accessRes = await fetch(`/api/inventory/access?buyerAddress=${address}&chainId=${chainId}`);
      const accessJson = await accessRes.json();
      setPurchasedAssets(accessJson.items || []);
    } finally {
      setBusyAssetId(null);
    }
  };

  const decryptPurchased = async () => {
    if (!address || !chainId || purchasedAssets.length === 0) return;
    const assetIds = purchasedAssets.map((asset) => asset.assetId);
    const message = `Decrypt assets:${assetIds.join(',')}`;
    const signature = await signMessageAsync({ message });

    const response = await fetch('/api/tee/decrypt-batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assetIds, buyerAddress: address, signature, chainId }),
    });
    const json = await response.json();
    if (!response.ok) throw new Error(json.error || 'Decrypt failed');

    const next: Record<string, string> = {};
    for (const item of json.results || []) {
      next[item.encryptedCID] = item.recipientEmail;
    }
    setDecrypted(next);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="grid-pattern fixed inset-0 opacity-30" />
      <div className="relative z-10">
        <Header />
        <main className="container mx-auto px-6 py-10">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="font-mono text-4xl font-black uppercase">Verified Inventory</h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Browse reusable verified supply first. Create a pool only when the exact data is not available yet.
              </p>
            </div>
            <div className="flex gap-3">
              <input
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                placeholder="Filter by category or proof type"
                className="border-2 border-border bg-background px-4 py-2 font-mono text-sm"
              />
              <Link href="/pools">
                <Button variant="outline">CREATE POOL</Button>
              </Link>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-[2fr,1fr]">
            <section>
              <h2 className="mb-4 font-mono text-sm font-bold uppercase text-primary">Available Supply</h2>
              <div className="grid gap-4">
                {loading && <div className="border-2 border-border bg-card p-4 font-mono text-sm">Loading inventory...</div>}
                {!loading && filteredAssets.length === 0 && (
                  <div className="border-2 border-border bg-card p-4 font-mono text-sm">
                    No verified inventory matches this filter.
                  </div>
                )}
                {filteredAssets.map((asset) => (
                  <div key={asset.assetId} className="border-2 border-border bg-card p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-mono text-xs uppercase text-primary">{asset.proofTypeId}</p>
                        <h3 className="mt-1 font-mono text-lg font-bold uppercase">{asset.category}</h3>
                        {asset.subtype && <p className="mt-1 text-sm text-muted-foreground">{asset.subtype}</p>}
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-xs uppercase text-muted-foreground">Price</p>
                        <p className="font-mono text-lg font-bold">{asset.basePrice} ETH</p>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {Object.entries(asset.searchableAttributes || {}).map(([key, value]) => (
                        <span key={key} className="border border-primary/30 bg-primary/5 px-2 py-1 font-mono text-xs">
                          {key}: {String(value)}
                        </span>
                      ))}
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <p className="font-mono text-xs text-muted-foreground">
                        Resale: {asset.resalePolicy.replace('_', ' ')}
                      </p>
                      <Button onClick={() => purchaseAsset(asset.assetId)} disabled={!isConnected || isBuying || busyAssetId === asset.assetId}>
                        {busyAssetId === asset.assetId ? 'PROCESSING...' : 'BUY ACCESS'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <aside>
              <h2 className="mb-4 font-mono text-sm font-bold uppercase text-primary">My Access</h2>
              <div className="border-2 border-border bg-card p-5">
                <p className="mb-4 text-sm text-muted-foreground">
                  Purchased assets are unlocked with one batch signature instead of one signature per item.
                </p>
                <Button onClick={decryptPurchased} disabled={!isConnected || purchasedAssets.length === 0} className="w-full">
                  DECRYPT ALL PURCHASED DATA
                </Button>
                <div className="mt-4 space-y-3">
                  {purchasedAssets.length === 0 && (
                    <p className="font-mono text-xs text-muted-foreground">No purchased assets yet.</p>
                  )}
                  {purchasedAssets.map((asset) => (
                    <div key={asset.assetId} className="border border-border p-3">
                      <p className="font-mono text-xs uppercase text-primary">{asset.proofTypeId}</p>
                      <p className="mt-1 font-mono text-sm font-bold uppercase">{asset.category}</p>
                      <p className="mt-2 break-all text-xs text-muted-foreground">
                        {decrypted[asset.encryptedCID] || 'Encrypted until you decrypt'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
}
