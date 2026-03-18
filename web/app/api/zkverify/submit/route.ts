/**
 * Server-side zkVerify submission endpoint
 *
 * SECURITY: Keeps ZKVERIFY_SEED_PHRASE secure on server
 * Never exposes seed phrase to client
 *
 * Uses Domain Aggregation for on-chain verification support
 */

import { NextRequest, NextResponse } from 'next/server';

// Force dynamic - prevent static analysis of this route
export const dynamic = 'force-dynamic';
export const maxDuration = 180; // Allow up to 3 minutes for zkVerify submission

interface SubmitRequest {
  proofData: {
    proof: string;
    curve: string;
    inputs: string[];
  };
  vkey: string; // Verification key from generate-proof route
}

// Pre-registered zkVerify Domain IDs for different chains (Testnet)
// See: https://docs.zkverify.io
const ZKVERIFY_DOMAINS = {
  horizenTestnet: 175,
  ethereumSepolia: 0,
  baseSepolia: 2,
  optimismSepolia: 3,
  arbitrumSepolia: 4,
} as const;

export async function POST(req: NextRequest) {
  try {
    const body: SubmitRequest = await req.json();
    const { proofData, vkey } = body;

    // Validate request
    if (!vkey || !proofData) {
      return NextResponse.json(
        { error: 'Missing vkey or proofData' },
        { status: 400 }
      );
    }

    // Validate required environment variables
    const seedPhrase = process.env.ZKVERIFY_SEED_PHRASE;
    const network = process.env.NEXT_PUBLIC_ZKVERIFY_NETWORK || 'volta';
    const configuredDomainId = process.env.ZKVERIFY_DOMAIN_ID
      ? parseInt(process.env.ZKVERIFY_DOMAIN_ID)
      : null;

    if (!seedPhrase) {
      return NextResponse.json(
        { error: 'ZKVERIFY_SEED_PHRASE not configured on server' },
        { status: 500 }
      );
    }

    console.log('[zkVerify API] Submitting proof to zkVerify with domain aggregation...');
    console.log('[zkVerify API] Network:', network);
    console.log('[zkVerify API] Vkey length:', vkey.length);

    // Dynamic import to avoid build-time issues
    const { zkVerifySession, Library, CurveType, ZkVerifyEvents } = await import('zkverifyjs');

    // Step 1: Create zkVerify session (server-side with seed phrase)
    const sessionBuilder = zkVerifySession.start();
    const session = network === 'mainnet'
      ? await sessionBuilder.zkVerify().withAccount(seedPhrase)
      : await sessionBuilder.Volta().withAccount(seedPhrase);

    console.log('[zkVerify API] Session created');

    // Step 2: Use pre-registered domain for Horizen Testnet
    // Domain IDs are pre-registered by zkVerify for each target chain
    const domainId = configuredDomainId !== null ? configuredDomainId : ZKVERIFY_DOMAINS[network as keyof typeof ZKVERIFY_DOMAINS];
    console.log('[zkVerify API] Using domain ID:', domainId);

    // Step 3: Submit proof to zkVerify WITH domainId for aggregation
    const { events, transactionResult } = await session.verify()
      .groth16({ library: Library.snarkjs, curve: CurveType.bn128 })
      .execute({
        proofData: {
          vk: JSON.parse(vkey),
          proof: proofData.proof,
          publicSignals: proofData.inputs,
        },
        domainId, // Enable domain aggregation
      });

    console.log('[zkVerify API] Proof submitted to domain:', domainId);

    const verificationResult = await transactionResult;

    // Step 4: Wait for Finalized event
    // const verificationResultt = await new Promise<any>((resolve, reject) => {
    //   const timeout = setTimeout(() => {
    //     reject(new Error('Timeout waiting for proof finalization'));
    //   }, 180000); // 3 minute timeout

    //   events.on(ZkVerifyEvents.IncludedInBlock, (data: any) => {
    //     console.log('[zkVerify API] Proof included in block:', data.blockHash);
    //     console.log('[zkVerify API] Statement:', data.statement);
    //     console.log('[zkVerify API] DomainId:', data.domainId);
    //     console.log('[zkVerify API] AggregationId:', data.aggregationId);
    //   });

    //   events.on(ZkVerifyEvents.Finalized, (data: any) => {
    //     console.log('[zkVerify API] Proof finalized:', data);
    //     clearTimeout(timeout);
    //     resolve(data);
    //   });

    //   events.on(ZkVerifyEvents.ErrorEvent, (error: any) => {
    //     console.error('[zkVerify API] Error event:', error);
    //     clearTimeout(timeout);
    //     reject(new Error(`zkVerify error: ${error.message || 'Unknown error'}`));
    //   });
    // });

    const statement = verificationResult.statement;
    if (!statement) {
      throw new Error('No statement returned from zkVerify');
    }

    console.log('[zkVerify API] Verification complete!');
    console.log('[zkVerify API] Statement:', statement);
    console.log('[zkVerify API] DomainId:', verificationResult.domainId);
    console.log('[zkVerify API] AggregationId:', verificationResult.aggregationId);

    // Step 5: Wait for aggregation receipt (since aggregationSize=1, this should be immediate)
    console.log('[zkVerify API] Waiting for aggregation receipt...');

    const aggregationReceipt = await session.waitForAggregationReceipt(
      verificationResult.domainId!,
      verificationResult.aggregationId!
    );

    console.log('[zkVerify API] Aggregation receipt received:', aggregationReceipt);

    // Step 6: Get merkle proof path for on-chain verification
    console.log('[zkVerify API] Getting merkle proof path...');

    const merkleProofPath = await session.getAggregateStatementPath(
      aggregationReceipt.blockHash,
      verificationResult.domainId!,
      verificationResult.aggregationId!,
      statement
    );

    console.log('[zkVerify API] Merkle proof path:', merkleProofPath);

    // Create proof hash for smart contract
    const proofHash = statement as `0x${string}`;

    // Close session
    await session.close();

    console.log('[zkVerify API] Proof submitted successfully');
    console.log('[zkVerify API] Proof hash:', proofHash);
    console.log('[zkVerify API] Tx hash:', verificationResult.txHash);
    console.log('[zkVerify API] Statement:', statement);
    console.log('[zkVerify API] DomainId:', verificationResult.domainId);
    console.log('[zkVerify API] AggregationId:', verificationResult.aggregationId);
    console.log('[zkVerify API] Merkle proof path:', merkleProofPath);
    console.log('[zkVerify API] Leaf:', merkleProofPath.leaf);
    console.log('[zkVerify API] Leaf count:', merkleProofPath.numberOfLeaves);
    console.log('[zkVerify API] Leaf index:', merkleProofPath.leafIndex);
    console.log('[zkVerify API] Root:', merkleProofPath.root);
    return NextResponse.json({
      success: true,
      proofHash,
      txHash: verificationResult.txHash,
      statement,
      blockHash: verificationResult.blockHash,
      // Domain aggregation data for on-chain verification
      domainId: verificationResult.domainId,
      aggregationId: verificationResult.aggregationId,
      // Merkle proof for on-chain verification
      merklePath: merkleProofPath.proof,
      leaf: merkleProofPath.leaf,
      leafCount: merkleProofPath.numberOfLeaves,
      leafIndex: merkleProofPath.leafIndex,
      root: merkleProofPath.root,
      // For smart contract VerificationParams struct
      verificationParams: {
        aggregationId: verificationResult.aggregationId,
        domainId: verificationResult.domainId,
        merklePath: merkleProofPath.proof,
        leaf: merkleProofPath.leaf,
        leafCount: merkleProofPath.numberOfLeaves,
        index: merkleProofPath.leafIndex,
      },
    });

  } catch (error: any) {
    console.error('[zkVerify API] Error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to submit proof to zkVerify',
        details: error.toString(),
      },
      { status: 500 }
    );
  }
}
