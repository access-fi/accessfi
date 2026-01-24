/**
 * Server-side zkVerify submission endpoint
 *
 * SECURITY: Keeps ZKVERIFY_SEED_PHRASE secure on server
 * Never exposes seed phrase to client
 */

import { NextRequest, NextResponse } from 'next/server';
import { zkVerifySession, Library, CurveType, ZkVerifyEvents, VerifyTransactionInfo } from 'zkverifyjs';
// @ts-ignore - SDK exports correctly but TS has cache issue
import { initZkEmailSdk } from '@zk-email/sdk';
import { keccak256, toHex } from 'viem';

interface SubmitRequest {
  blueprintId: string;
  proofData: {
    proof: string;
    curve: string;
    inputs: string[];
  };
}

export async function POST(req: NextRequest) {
  try {
    const body: SubmitRequest = await req.json();
    const { blueprintId, proofData } = body;

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

    // Step 1: Fetch verification key from zkEmail (server-side only)
    console.log('[zkVerify API] Fetching vkey for blueprint:', blueprintId);
    const sdk = initZkEmailSdk();
    const blueprint = await sdk.getBlueprint(blueprintId);
    const vkey = await blueprint.getVkey();
    console.log('[zkVerify API] Vkey fetched successfully');

    // Step 2: Create zkVerify session (server-side with seed phrase)
    const sessionBuilder = zkVerifySession.start();
    const session = network === 'mainnet'
      ? await sessionBuilder.zkVerify().withAccount(seedPhrase)
      : await sessionBuilder.Volta().withAccount(seedPhrase);

    console.log('[zkVerify API] Session created');

    // Step 3: Submit proof to zkVerify
    const { events } = await session.verify()
      .groth16({ library: Library.snarkjs, curve: CurveType.bn128 })
      .execute({
        proofData: {
          vk: JSON.parse(vkey),
          proof: proofData.proof,
          publicSignals: proofData.inputs,
        },
      });

    console.log('[zkVerify API] Proof submitted');

    // Step 4: Wait for Finalized event to get statement (proof hash)
    const verificationResult = await new Promise<VerifyTransactionInfo>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout waiting for proof finalization'));
      }, 180000); // 3 minute timeout for finalization

      events.on(ZkVerifyEvents.IncludedInBlock, (data: VerifyTransactionInfo) => {
        console.log('[zkVerify API] Proof included in block:', data.blockHash);
        console.log('[zkVerify API] Statement:', data.statement);
      });

      events.on(ZkVerifyEvents.Finalized, (data: VerifyTransactionInfo) => {
        console.log('[zkVerify API] Proof finalized:', data);
        clearTimeout(timeout);
        resolve(data);
      });

      events.on(ZkVerifyEvents.ErrorEvent, (error: any) => {
        console.error('[zkVerify API] Error event:', error);
        clearTimeout(timeout);
        reject(new Error(`zkVerify error: ${error.message || 'Unknown error'}`));
      });
    });

    // The statement is the proof hash - this is what proves the proof was verified
    const statement = verificationResult.statement;
    if (!statement) {
      throw new Error('No statement returned from zkVerify');
    }

    console.log('[zkVerify API] Verification complete!');
    console.log('[zkVerify API] Statement (proof hash):', statement);
    console.log('[zkVerify API] Transaction hash:', verificationResult.txHash);

    // Create a unique proof hash for our smart contract
    // Combines the zkVerify statement with public inputs for uniqueness
    const proofHash = keccak256(
      toHex(JSON.stringify({
        statement,
        publicInputs: proofData.inputs,
        txHash: verificationResult.txHash,
      }))
    );

    // Close session
    await session.close();

    return NextResponse.json({
      success: true,
      proofHash,
      txHash: verificationResult.txHash,
      statement,
      blockHash: verificationResult.blockHash,
      // For smart contract verification
      verificationParams: {
        statement,
        txHash: verificationResult.txHash,
        blockHash: verificationResult.blockHash,
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
