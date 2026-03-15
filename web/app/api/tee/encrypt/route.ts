import { NextRequest, NextResponse } from 'next/server';
const TEE_SERVICE_URL = process.env.TEE_SERVICE_URL || 'http://localhost:8080';

/**
 * TEE Encryption Proxy Endpoint
 *
 * Forwards encryption requests to the Phala TEE service
 * Falls back to mock encryption if TEE service is unavailable (development only)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { recipientEmail, poolAddress, sellerAddress, assetId } = body;

    // Validate required fields
    if (!recipientEmail || !sellerAddress || (!poolAddress && !assetId)) {
      return NextResponse.json(
        { error: 'Missing required fields: recipientEmail, sellerAddress, and either poolAddress or assetId' },
        { status: 400 }
      );
    }

    console.log('[TEE Encrypt API] Request received:', {
      poolAddress,
      assetId,
      sellerAddress,
      recipientEmailLength: recipientEmail.length,
    });

    // Check if TEE service is configured
    if (TEE_SERVICE_URL === 'http://localhost:8080') {
      return NextResponse.json(
        { error: 'TEE service not configured' },
        { status: 500 }
      );
    }

    // Forward to TEE service
    console.log('[TEE Encrypt API] Forwarding to TEE service:', TEE_SERVICE_URL);

    const response = await fetch(`${TEE_SERVICE_URL}/encrypt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipientEmail, poolAddress, sellerAddress, assetId }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || 'TEE encryption failed');
    }

    const result = await response.json();

    console.log('[TEE Encrypt API] Encryption successful:', {
      encryptedCID: result.encryptedCID,
      dataHash: result.dataHash,
    });

    return NextResponse.json(result);

  } catch (error: unknown) {
    console.error('[TEE Encrypt API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Encryption failed' },
      { status: 500 }
    );
  }
}
