import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { getContractAddresses } from '@/lib/contracts/addresses';
import { getRpcUrl } from '@/lib/contracts/server';

const VERIFY_PROOF_ABI = [
  {
    type: 'function',
    name: 'zkVerify',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
] as const;

const ZKVERIFY_AGGREGATION_ABI = [
  {
    type: 'function',
    name: 'verifyProofAggregation',
    stateMutability: 'view',
    inputs: [
      { name: '_domainId', type: 'uint256' },
      { name: '_aggregationId', type: 'uint256' },
      { name: '_leaf', type: 'bytes32' },
      { name: '_merklePath', type: 'bytes32[]' },
      { name: '_leafCount', type: 'uint256' },
      { name: '_index', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;

type VerificationParams = {
  aggregationId?: string | number | bigint;
  domainId?: string | number | bigint;
  merklePath?: `0x${string}`[];
  leaf?: `0x${string}`;
  leafCount?: string | number | bigint;
  index?: string | number | bigint;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { chainId, verificationParams } = body as {
      chainId?: number;
      verificationParams?: VerificationParams;
    };

    if (!chainId || !verificationParams) {
      return NextResponse.json(
        { error: 'Missing required fields: chainId, verificationParams' },
        { status: 400 }
      );
    }

    const addresses = getContractAddresses(chainId);
    const verifierWrapper = addresses?.ZK_VERIFIER;
    if (!verifierWrapper) {
      return NextResponse.json(
        { error: `Verifier wrapper not configured for chain ${chainId}` },
        { status: 500 }
      );
    }

    const publicClient = createPublicClient({
      transport: http(getRpcUrl(chainId)),
    });

    const zkVerifyAddress = await publicClient.readContract({
      address: verifierWrapper as `0x${string}`,
      abi: VERIFY_PROOF_ABI,
      functionName: 'zkVerify',
    });

    const ready = await publicClient.readContract({
      address: zkVerifyAddress,
      abi: ZKVERIFY_AGGREGATION_ABI,
      functionName: 'verifyProofAggregation',
      args: [
        BigInt(verificationParams.domainId ?? 0),
        BigInt(verificationParams.aggregationId ?? 0),
        verificationParams.leaf as `0x${string}`,
        verificationParams.merklePath ?? [],
        BigInt(verificationParams.leafCount ?? 0),
        BigInt(verificationParams.index ?? 0),
      ],
    });

    return NextResponse.json({
      ready,
      chainId,
      verifierWrapper,
      zkVerifyAddress,
    });
  } catch (error: unknown) {
    console.error('[zkVerify Preflight API] Error:', error);
    return NextResponse.json(
      {
        ready: false,
        error: error instanceof Error ? error.message : 'Preflight verification failed',
      },
      { status: 200 }
    );
  }
}
