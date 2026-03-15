/**
 * zkEmail Proof Generation (Client-Side)
 *
 * ARCHITECTURE:
 * - Proof generation runs client-side via zkEmail SDK (uses remote provers)
 * - zkVerify submission runs server-side (keeps seed phrase secure)
 *
 * Based on: https://docs.zk.email/zk-email-sdk/setup
 */

import { initZkEmailSdk } from '@zk-email/sdk';
import type { VerificationParams } from '../contracts/types';

export interface ProofResult {
  // For smart contract
  proofHash: `0x${string}`;
  verificationParams: VerificationParams;

  // Metadata
  txHash: string;
  statement: string; // zkVerify proof hash
  blockHash: string;
}

/**
 * Generate zkEmail proof and submit to zkVerify
 *
 * FLOW:
 * 1. Client: Generate proof via zkEmail SDK (remote provers)
 * 2. Client: Get vkey from blueprint
 * 3. Server: Submit to zkVerify with secure seed phrase
 * 4. Client: Receive verification params for smart contract
 *
 * @param emlContent - Raw .eml file content
 * @param onProgress - Progress callback (0-100)
 * @returns Proof result with verification params for smart contract
 */
export async function generateAndVerifyProof(
  emlContent: string,
  blueprintId: string,
  onProgress?: (progress: number, step: string) => void
): Promise<ProofResult> {
  try {
    if (!blueprintId) {
      throw new Error('zkEmail blueprintId not provided');
    }

    // ==== STEP 1: Initialize SDK and get blueprint ====
    console.log('[zkEmail] Initializing SDK...');
    onProgress?.(5, 'Initializing...');

    const sdk = initZkEmailSdk();
    const blueprint = await sdk.getBlueprint(blueprintId);

    console.log('[zkEmail] Blueprint loaded:', blueprint.props.title);
    onProgress?.(10, 'Blueprint loaded');

    // ==== STEP 2: Create prover and generate proof ====
    console.log('[zkEmail] Creating prover...');
    const prover = blueprint.createProver();

    // Start progress animation (proof takes 30-60 seconds)
    let progressValue = 15;
    const progressInterval = setInterval(() => {
      progressValue = Math.min(progressValue + 2, 55);
      onProgress?.(progressValue, 'Generating ZK proof...');
    }, 2000);

    console.log('[zkEmail] Generating proof (this may take a minute)...');
    const proof = await prover.generateProof(emlContent);

    clearInterval(progressInterval);
    console.log('[zkEmail] Proof generated successfully');
    onProgress?.(60, 'Proof generated!');

    // ==== STEP 3: Get verification key ====
    console.log('[zkEmail] Fetching verification key...');
    const vkey = await blueprint.getVkey();
    console.log('[zkEmail] Vkey fetched, length:', vkey.length);

    // Extract proof data
    const proofData = proof.props.proofData;
    const publicOutputs = (proof.props as any).publicOutputs || (proof.props as any).publicData || [];

    // ==== STEP 4: Submit to zkVerify (Server-Side) ====
    console.log('[zkVerify] Submitting proof to zkVerify...');
    onProgress?.(65, 'Submitting to zkVerify...');

    const zkVerifyResponse = await fetch('/api/zkverify/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        proofData: {
          proof: proofData,
          curve: 'bn128',
          inputs: publicOutputs,
        },
        vkey,
      }),
    });

    if (!zkVerifyResponse.ok) {
      const error = await zkVerifyResponse.json();
      throw new Error(error.error || 'Failed to submit proof to zkVerify');
    }

    onProgress?.(90, 'Proof verified on zkVerify...');

    const result = await zkVerifyResponse.json();
    console.log('[zkVerify] Verification complete:', result);

    onProgress?.(100, 'Complete!');

    // Return formatted result with domain aggregation data
    return {
      proofHash: result.proofHash,
      verificationParams: {
        aggregationId: BigInt(result.verificationParams.aggregationId || 0),
        domainId: BigInt(result.verificationParams.domainId || 0),
        merklePath: result.verificationParams.merklePath || [],
        leaf: result.verificationParams.leaf as `0x${string}`,
        leafCount: BigInt(result.verificationParams.leafCount || 1),
        index: BigInt(result.verificationParams.index || 0),
      },
      txHash: result.txHash,
      statement: result.statement,
      blockHash: result.blockHash,
    };

  } catch (error: any) {
    console.error('[zkEmail/zkVerify] Error:', error);
    throw new Error(`Proof generation/verification failed: ${error.message}`);
  }
}
