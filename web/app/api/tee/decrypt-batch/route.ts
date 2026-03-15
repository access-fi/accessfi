import { NextRequest, NextResponse } from 'next/server';
import { verifyMessage } from 'viem';
import { inArray } from 'drizzle-orm';
import { db, globalAssets } from '@/lib/db';
import { getAssetRegistryConfig, getServerPublicClient } from '@/lib/contracts/server';

const TEE_SERVICE_URL = process.env.TEE_SERVICE_URL || 'http://localhost:8080';

/**
 * Primary decrypt path for the new inventory architecture.
 *
 * Buyers sign once for a batch, we verify on-chain access via AssetRegistry,
 * then the TEE decrypts the permitted encrypted payloads.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { assetIds, buyerAddress, signature, chainId } = body as {
      assetIds?: string[];
      buyerAddress?: string;
      signature?: `0x${string}`;
      chainId?: number;
    };

    if (!assetIds || assetIds.length === 0 || !buyerAddress || !signature || !chainId) {
      return NextResponse.json(
        { error: 'Missing required fields: assetIds, buyerAddress, signature, chainId' },
        { status: 400 }
      );
    }

    const message = `Decrypt assets:${assetIds.join(',')}`;
    const validSignature = await verifyMessage({
      address: buyerAddress as `0x${string}`,
      message,
      signature,
    });

    if (!validSignature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
    }

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const publicClient = getServerPublicClient(Number(chainId));
    const registry = getAssetRegistryConfig(Number(chainId));

    const accessChecks = await Promise.all(
      assetIds.map(async (assetId) => {
        const allowed = await publicClient.readContract({
          address: registry.address,
          abi: registry.abi,
          functionName: 'hasAccess',
          args: [assetId as `0x${string}`, buyerAddress.toLowerCase() as `0x${string}`],
        });
        return { assetId, allowed };
      })
    );

    const missingAccess = accessChecks.filter((check) => !check.allowed).map((check) => check.assetId);
    if (missingAccess.length > 0) {
      return NextResponse.json(
        { error: `Access missing for assets: ${missingAccess.join(', ')}` },
        { status: 403 }
      );
    }

    const assets = await db
      .select({
        assetId: globalAssets.assetId,
        encryptedCID: globalAssets.encryptedCID,
      })
      .from(globalAssets)
      .where(inArray(globalAssets.assetId, assetIds));

    const encryptedCIDs = assets.map((asset) => asset.encryptedCID);
    const response = await fetch(`${TEE_SERVICE_URL}/decrypt-batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ encryptedCIDs }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Batch decrypt failed' }));
      throw new Error(errorData.error || 'Batch decrypt failed');
    }

    const result = await response.json();
    return NextResponse.json({ assets, results: result.results });
  } catch (error: unknown) {
    console.error('[TEE Batch Decrypt API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Batch decryption failed' },
      { status: 500 }
    );
  }
}
