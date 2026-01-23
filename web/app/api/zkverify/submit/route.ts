/**
 * Server-side zkVerify submission endpoint
 *
 * SECURITY: Keeps ZKVERIFY_SEED_PHRASE secure on server
 * Never exposes seed phrase to client
 */

import { NextRequest, NextResponse } from 'next/server';
import { zkVerifySession, Library, CurveType, ZkVerifyEvents } from 'zkverifyjs';
import { keccak256, encodeAbiParameters, parseAbiParameters } from 'viem';

interface SubmitRequest {
  proofData: {
    proof: string;
    curve: string;
    inputs: string[];
  };
  publicOutputs: string[];
  vkeyHash: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: SubmitRequest = await req.json();
    const { proofData, publicOutputs, vkeyHash } = body;

    // Validate required environment variables
    const seedPhrase = process.env.ZKVERIFY_SEED_PHRASE;
    const network = process.env.NEXT_PUBLIC_ZKVERIFY_NETWORK || 'volta';

    if (!seedPhrase) {
      return NextResponse.json(
        { error: 'ZKVERIFY_SEED_PHRASE not configured on server' },
        { status: 500 }
      );
    }

    console.log('[zkVerify API] Submitting proof to zkVerify...');
    console.log('[zkVerify API] Network:', network);

    // Step 1: Create zkVerify session (server-side with seed phrase)
    const sessionBuilder = zkVerifySession.start();
    const session = network === 'mainnet'
      ? await sessionBuilder.Mainnet().withAccount(seedPhrase)
      : await sessionBuilder.Volta().withAccount(seedPhrase);

    console.log('[zkVerify API] Session created');

    // Step 2: Submit proof to zkVerify
    const { events, transactionResult } = await session.verify().groth16().execute({
      proofData: {
        proof: proofData.proof,
        publicSignals: proofData.inputs,
        vk: vkeyHash,
      },
      publicInputs: publicOutputs,
    });

    console.log('[zkVerify API] Proof submitted, transaction hash:', transactionResult.transactionHash);

    // Step 3: Wait for IncludedInBlock event
    const attestationId = await new Promise<bigint>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout waiting for proof inclusion'));
      }, 120000); // 2 minute timeout

      events.on(ZkVerifyEvents.IncludedInBlock, (data: any) => {
        console.log('[zkVerify API] Proof included in block:', data);
        clearTimeout(timeout);
        resolve(BigInt(data.attestationId));
      });

      events.on(ZkVerifyEvents.ErrorEvent, (error: any) => {
        console.error('[zkVerify API] Error event:', error);
        clearTimeout(timeout);
        reject(new Error(`zkVerify error: ${error.message || 'Unknown error'}`));
      });
    });

    console.log('[zkVerify API] Attestation ID:', attestationId.toString());

    // Step 4: Get Merkle proof
    const merkleProof = await session.merkleProof(attestationId);
    console.log('[zkVerify API] Merkle proof retrieved');

    // Step 5: Calculate proof hash
    const proofHash = keccak256(
      encodeAbiParameters(
        parseAbiParameters('bytes32[] merkleProof, uint256 attestationId'),
        [merkleProof.proof.leafHash as `0x${string}`[], attestationId]
      )
    );

    // Step 6: Format verification params for smart contract
    const verificationParams = {
      merkleProof: merkleProof.proof.leafHash,
      attestationId: attestationId.toString(),
      leafCount: merkleProof.numberOfLeaves.toString(),
      leafIndex: merkleProof.leafIndex.toString(),
    };

    console.log('[zkVerify API] Success! Proof hash:', proofHash);

    return NextResponse.json({
      success: true,
      proofHash,
      txHash: transactionResult.transactionHash,
      attestationId: attestationId.toString(),
      verificationParams,
      statement: merkleProof.proof.root,
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
