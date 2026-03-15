import { NextRequest, NextResponse } from 'next/server';
import { desc } from 'drizzle-orm';
import { db, globalAssets } from '@/lib/db';
import { getAssetRegistryConfig, getServerPublicClient } from '@/lib/contracts/server';

export async function GET(request: NextRequest) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ items: [] });
    }

    const buyerAddress = request.nextUrl.searchParams.get('buyerAddress');
    const chainIdParam = request.nextUrl.searchParams.get('chainId');
    if (!buyerAddress || !chainIdParam) {
      return NextResponse.json({ error: 'buyerAddress and chainId are required' }, { status: 400 });
    }

    const chainId = Number(chainIdParam);
    const publicClient = getServerPublicClient(chainId);
    const registry = getAssetRegistryConfig(chainId);

    const assets = await db
      .select({
        assetId: globalAssets.assetId,
        category: globalAssets.category,
        subtype: globalAssets.subtype,
        proofTypeId: globalAssets.proofTypeId,
        encryptedCID: globalAssets.encryptedCID,
        searchableAttributes: globalAssets.searchableAttributes,
        verifiedAt: globalAssets.verifiedAt,
      })
      .from(globalAssets)
      .orderBy(desc(globalAssets.verifiedAt), desc(globalAssets.createdAt));

    const results = await Promise.all(
      assets.map(async (asset) => {
        const hasAccess = await publicClient.readContract({
          address: registry.address,
          abi: registry.abi,
          functionName: 'hasAccess',
          args: [asset.assetId as `0x${string}`, buyerAddress.toLowerCase() as `0x${string}`],
        });

        return hasAccess ? { ...asset, grantedAt: asset.verifiedAt } : null;
      })
    );

    return NextResponse.json({ items: results.filter(Boolean) });
  } catch (error: unknown) {
    console.error('[Inventory Access API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch access grants' },
      { status: 500 }
    );
  }
}
