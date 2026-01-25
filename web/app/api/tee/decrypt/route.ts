import { NextRequest, NextResponse } from 'next/server';
import { verifyMessage } from 'viem';

const TEE_SERVICE_URL = process.env.TEE_SERVICE_URL || 'http://localhost:8080';

/**
 * TEE Decryption Proxy Endpoint
 *
 * Allows token owners to decrypt their purchased data
 * Verifies ownership via wallet signature before forwarding to TEE service
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tokenId, buyerAddress, signature } = body;

    // Validate required fields
    if (!tokenId || !buyerAddress || !signature) {
      return NextResponse.json(
        { error: 'Missing required fields: tokenId, buyerAddress, signature' },
        { status: 400 }
      );
    }

    console.log('[TEE Decrypt API] Request received:', {
      tokenId,
      buyerAddress,
    });

    // Verify signature
    const message = `Decrypt token ${tokenId}`;

    try {
      const isValid = await verifyMessage({
        address: buyerAddress as `0x${string}`,
        message,
        signature: signature as `0x${string}`,
      });

      if (!isValid) {
        return NextResponse.json(
          { error: 'Signature verification failed' },
          { status: 403 }
        );
      }
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 403 }
      );
    }

    console.log('[TEE Decrypt API] Signature verified');

    // TODO: Verify buyer owns the token on-chain
    // const dataToken = getContract({...});
    // const owner = await dataToken.read.ownerOf([BigInt(tokenId)]);
    // if (owner.toLowerCase() !== buyerAddress.toLowerCase()) {
    //   return NextResponse.json({ error: 'Not token owner' }, { status: 403 });
    // }

    // Check if TEE service is configured
    if (TEE_SERVICE_URL === 'http://localhost:8080') {
      console.warn('[TEE Decrypt API] TEE service not configured, using mock decryption');

      // Mock decryption for development
      return NextResponse.json({
        data: 'Mock decrypted email data - TEE service not configured',
      });
    }

    // Forward to TEE service
    console.log('[TEE Decrypt API] Forwarding to TEE service:', TEE_SERVICE_URL);

    const response = await fetch(`${TEE_SERVICE_URL}/decrypt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tokenId, buyerAddress, signature }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || 'TEE decryption failed');
    }

    const result = await response.json();

    console.log('[TEE Decrypt API] Decryption successful');

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('[TEE Decrypt API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Decryption failed' },
      { status: 500 }
    );
  }
}
