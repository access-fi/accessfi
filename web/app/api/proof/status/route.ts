import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { proofSubmissions } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Proof Status Endpoint
 *
 * Query proof submission status for a user in a specific pool
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    const poolAddress = searchParams.get('poolAddress');

    // Validate required parameters
    if (!address || !poolAddress) {
      return NextResponse.json(
        { error: 'Missing required parameters: address, poolAddress' },
        { status: 400 }
      );
    }

    console.log('[Proof Status API] Query:', {
      address,
      poolAddress,
    });

    // Check database connection
    if (!process.env.DATABASE_URL) {
      console.warn('[Proof Status API] Database not configured');
      return NextResponse.json({
        proofSubmissions: [],
        isFullyVerified: false,
      });
    }

    // Query proof submissions from database
    const submissions = await db
      .select()
      .from(proofSubmissions)
      .where(
        and(
          eq(proofSubmissions.sellerAddress, address.toLowerCase()),
          eq(proofSubmissions.poolAddress, poolAddress.toLowerCase())
        )
      )
      .orderBy(proofSubmissions.createdAt);

    console.log('[Proof Status API] Found submissions:', submissions.length);

    // TODO: Query on-chain to check if fully verified
    // const pool = getContract({...});
    // const isFullyVerified = await pool.read.isSellerFullyVerified([address]);

    return NextResponse.json({
      proofSubmissions: submissions,
      isFullyVerified: false, // Update based on contract query
    });

  } catch (error: any) {
    console.error('[Proof Status API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch status' },
      { status: 500 }
    );
  }
}
