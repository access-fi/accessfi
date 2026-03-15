import { NextRequest, NextResponse } from 'next/server';
import { verifyMessage, createPublicClient, http } from 'viem';
import AccessFiDataTokenABI from '@/lib/contracts/AccessFiDataToken.abi.json';
import { getContractAddresses } from '@/lib/contracts/addresses';

const TEE_SERVICE_URL = process.env.TEE_SERVICE_URL || 'http://localhost:8080';

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Decryption failed';
}

/**
 * Legacy TEE Decryption Proxy Endpoint
 *
 * This route supports the old ERC721 token flow only.
 * The real inventory/access flow now uses `/api/tee/decrypt-batch`, which checks
 * `AssetRegistry.hasAccess(assetId, buyer)` instead of token ownership.
 *
 * Keep this route only for compatibility with legacy testnet/token-based screens.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tokenId, buyerAddress, signature, encryptedCID, chainId } = body;

    // Validate required fields
    if (!tokenId || !buyerAddress || !signature || !encryptedCID || !chainId) {
      return NextResponse.json(
        { error: 'Missing required fields: tokenId, buyerAddress, signature, encryptedCID, chainId' },
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
    } catch {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 403 }
      );
    }

    console.log('[TEE Decrypt API] Signature verified');

    // Legacy path: verify buyer owns the old ERC721 token on-chain.
    const addresses = getContractAddresses(Number(chainId));
    const dataTokenAddress = addresses?.DATA_TOKEN;
    if (!dataTokenAddress) {
      return NextResponse.json(
        { error: 'Data token contract address not configured for this chain' },
        { status: 500 }
      );
    }

    const rpcUrl =
      process.env[`RPC_URL_${chainId}`] ||
      process.env.TEE_RPC_URL ||
      process.env.NEXT_PUBLIC_RPC_URL;

    if (!rpcUrl) {
      return NextResponse.json(
        { error: 'RPC URL not configured for on-chain verification' },
        { status: 500 }
      );
    }

    const publicClient = createPublicClient({
      transport: http(rpcUrl),
    });

    const owner = await publicClient.readContract({
      address: dataTokenAddress as `0x${string}`,
      abi: AccessFiDataTokenABI,
      functionName: 'ownerOf',
      args: [BigInt(tokenId)],
    });

    if (String(owner).toLowerCase() !== String(buyerAddress).toLowerCase()) {
      return NextResponse.json(
        { error: 'Not token owner' },
        { status: 403 }
      );
    }

    // Check if TEE service is configured
    if (TEE_SERVICE_URL === 'http://localhost:8080') {
      return NextResponse.json(
        { error: 'TEE service not configured' },
        { status: 500 }
      );
    }

    // Forward to TEE service
    console.log('[TEE Decrypt API] Forwarding to TEE service:', TEE_SERVICE_URL);

    const response = await fetch(`${TEE_SERVICE_URL}/decrypt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ encryptedCID, buyerAddress, signature }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || 'TEE decryption failed');
    }

    const result = await response.json();

    console.log('[TEE Decrypt API] Decryption successful');

    return NextResponse.json(result);

  } catch (error: unknown) {
    console.error('[TEE Decrypt API] Error:', error);
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
