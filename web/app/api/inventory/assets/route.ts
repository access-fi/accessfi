import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { and, desc, eq, ilike, inArray } from 'drizzle-orm';
import {
  assetAccessGrants,
  assetPurchases,
  assetVerifications,
  db,
  globalAssets,
  poolAssetLinks,
} from '@/lib/db';
import { createAssetId, normalizeRecipientEmail } from '@/lib/inventory';
import { z } from 'zod';

const assetSchema = z.object({
  sellerAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  buyerAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
  recipientEmail: z.string().email(),
  category: z.string().min(1),
  subtype: z.string().optional(),
  proofTypeId: z.string().min(1),
  encryptedCID: z.string().min(1),
  dataHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
  sourceType: z.enum(['direct', 'pool_fulfillment', 'external']),
  resalePolicy: z.enum(['exclusive', 'limited_resale', 'open_resale']),
  basePrice: z.string().min(1),
  searchableAttributes: z.record(z.string(), z.unknown()).default({}),
  verificationTxHash: z.string().optional(),
  proofHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
  aggregationId: z.string().optional(),
  domainId: z.string().optional(),
  proofStatement: z.string().optional(),
  poolAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
  verifiedAt: z.string().optional(),
  expiresAt: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ items: [] });
    }

    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const proofTypeId = searchParams.get('proofTypeId');
    const search = searchParams.get('search');
    const sellerAddress = searchParams.get('sellerAddress');
    const includeArchived = searchParams.get('includeArchived') === 'true';
    const assetIds = searchParams.getAll('assetId');

    const conditions = [eq(globalAssets.verificationStatus, 'verified')];

    if (!includeArchived) {
      conditions.push(eq(globalAssets.listingStatus, 'listed'));
    }

    if (category) conditions.push(eq(globalAssets.category, category));
    if (proofTypeId) conditions.push(eq(globalAssets.proofTypeId, proofTypeId));
    if (search) conditions.push(ilike(globalAssets.category, `%${search}%`));
    if (sellerAddress) conditions.push(eq(globalAssets.sellerAddress, sellerAddress.toLowerCase()));
    if (assetIds.length > 0) conditions.push(inArray(globalAssets.assetId, assetIds));

    const items = await db
      .select()
      .from(globalAssets)
      .where(and(...conditions))
      .orderBy(desc(globalAssets.verifiedAt), desc(globalAssets.createdAt));

    return NextResponse.json({ items });
  } catch (error: unknown) {
    console.error('[Inventory Assets API] GET Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch assets' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const body = await request.json();
    const input = assetSchema.parse(body);

    const normalizedEmail = normalizeRecipientEmail(input.recipientEmail);
    const assetId = createAssetId(input.sellerAddress, input.proofTypeId, normalizedEmail);
    const verifiedAt = input.verifiedAt ? new Date(input.verifiedAt) : new Date();
    const expiresAt = input.expiresAt ? new Date(input.expiresAt) : null;

    const listingStatus = input.resalePolicy === 'exclusive' ? 'archived' : 'listed';

    await db
      .insert(globalAssets)
      .values({
        assetId,
        sellerAddress: input.sellerAddress.toLowerCase(),
        sourceType: input.sourceType,
        category: input.category,
        subtype: input.subtype || null,
        proofTypeId: input.proofTypeId,
        encryptedRef: input.encryptedCID,
        encryptedCID: input.encryptedCID,
        dataHash: input.dataHash,
        searchableAttributes: input.searchableAttributes,
        verificationStatus: 'verified',
        verifiedAt,
        expiresAt,
        resalePolicy: input.resalePolicy,
        listingStatus,
        basePrice: input.basePrice,
        proofStatement: input.proofStatement || null,
        poolAddress: input.poolAddress?.toLowerCase() || null,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: globalAssets.assetId,
        set: {
          encryptedRef: input.encryptedCID,
          encryptedCID: input.encryptedCID,
          dataHash: input.dataHash,
          searchableAttributes: input.searchableAttributes,
          verificationStatus: 'verified',
          verifiedAt,
          expiresAt,
          resalePolicy: input.resalePolicy,
          listingStatus,
          basePrice: input.basePrice,
          proofStatement: input.proofStatement || null,
          poolAddress: input.poolAddress?.toLowerCase() || null,
          updatedAt: new Date(),
        },
      });

    await db.insert(assetVerifications).values({
      id: randomUUID(),
      assetId,
      providerType: 'zkemail',
      proofHash: input.proofHash,
      aggregationId: input.aggregationId || null,
      domainId: input.domainId || null,
      verificationTxHash: input.verificationTxHash || null,
      verifiedAt,
      expiresAt,
      status: 'verified',
      metadata: {
        proofStatement: input.proofStatement || null,
        sourceType: input.sourceType,
      },
    });

    if (input.poolAddress) {
      await db.insert(poolAssetLinks).values({
        id: randomUUID(),
        poolAddress: input.poolAddress.toLowerCase(),
        sellerAddress: input.sellerAddress.toLowerCase(),
        assetId,
      });
    }

    if (input.buyerAddress) {
      const purchaseId = randomUUID();
      await db.insert(assetPurchases).values({
        purchaseId,
        assetId,
        buyerAddress: input.buyerAddress.toLowerCase(),
        sellerAddress: input.sellerAddress.toLowerCase(),
        grossAmount: input.basePrice,
        platformFee: '0',
        sellerPayout: input.basePrice,
        txHash: input.verificationTxHash || null,
      });

      await db
        .insert(assetAccessGrants)
        .values({
          id: randomUUID(),
          assetId,
          buyerAddress: input.buyerAddress.toLowerCase(),
          purchaseId,
          status: 'active',
        })
        .onConflictDoNothing();
    }

    return NextResponse.json({ success: true, assetId });
  } catch (error: unknown) {
    console.error('[Inventory Assets API] POST Error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to upsert asset' },
      { status: 500 }
    );
  }
}
