import { NextRequest, NextResponse } from 'next/server';
import { keccak256, toHex } from 'viem';

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
    const { emailData, poolAddress, sellerAddress } = body;

    // Validate required fields
    if (!emailData || !poolAddress || !sellerAddress) {
      return NextResponse.json(
        { error: 'Missing required fields: emailData, poolAddress, sellerAddress' },
        { status: 400 }
      );
    }

    console.log('[TEE Encrypt API] Request received:', {
      poolAddress,
      sellerAddress,
      emailDataLength: emailData.length,
    });

    // Check if TEE service is configured
    if (TEE_SERVICE_URL === 'http://localhost:8080') {
      console.warn('[TEE Encrypt API] TEE service not configured, using mock encryption');

      // Mock encryption for development (REMOVE IN PRODUCTION)
      const mockResult = await mockEncryption(emailData, poolAddress, sellerAddress);
      return NextResponse.json(mockResult);
    }

    // Forward to TEE service
    console.log('[TEE Encrypt API] Forwarding to TEE service:', TEE_SERVICE_URL);

    const response = await fetch(`${TEE_SERVICE_URL}/encrypt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailData, poolAddress, sellerAddress }),
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

  } catch (error: any) {
    console.error('[TEE Encrypt API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Encryption failed' },
      { status: 500 }
    );
  }
}

/**
 * Mock encryption for development
 * IMPORTANT: Remove this in production!
 */
async function mockEncryption(
  emailData: string,
  poolAddress: string,
  sellerAddress: string
) {
  console.log('[TEE Encrypt API] Using mock encryption (DEVELOPMENT ONLY)');

  // Simulate encryption delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Generate mock encrypted CID (hash of email data)
  const encryptedCID = keccak256(toHex(emailData)).slice(0, 48); // Mock IPFS CID

  // Generate data hash
  const dataHash = keccak256(toHex(emailData + poolAddress + sellerAddress));

  // Mock attestation
  const attestation = JSON.stringify({
    enclave: 'mock-tee-dev',
    timestamp: Date.now(),
    signature: '0x' + 'mock'.repeat(32),
  });

  return {
    encryptedCID,
    dataHash,
    attestation,
  };
}
