/**
 * zkEmail Proof Generation (Server-Side)
 *
 * SECURITY & COMPATIBILITY:
 * - zkEmail proof generation runs server-side (avoids browser WASM issues)
 * - zkVerify submission runs server-side (keeps seed phrase secure)
 *
 * Based on: https://docs.zkverify.io/overview/explorations/zkemail
 */

import type { VerificationParams } from "../contracts/types";

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
 * Generate zkEmail proof and submit to zkVerify (all server-side)
 *
 * ARCHITECTURE:
 * 1. Client: Upload email content to /api/zkemail/generate-proof
 * 2. Server: Generate zkEmail proof (bypasses browser WASM issues)
 * 3. Server: Submit to zkVerify with secure seed phrase
 * 4. Client: Receive verification params for smart contract
 *
 * @param emlContent - Raw .eml file content
 * @param onProgress - Progress callback (0-100)
 * @returns Proof result with verification params for smart contract
 */
export async function generateAndVerifyProof(
  emlContent: string,
  onProgress?: (progress: number, step: string) => void
): Promise<ProofResult> {
  try {
    const blueprintId = process.env.NEXT_PUBLIC_ZKEMAIL_BLUEPRINT_ID;
    if (!blueprintId) {
      throw new Error('NEXT_PUBLIC_ZKEMAIL_BLUEPRINT_ID not configured');
    }

    // ==== STEP 1: Generate zkEmail Proof (Server-Side) ====
    console.log('[zkEmail] Sending email to server for proof generation...');
    onProgress?.(10, 'Uploading email...');

    // Start a progress animation while waiting (proof takes 30-60 seconds)
    let progressValue = 10;
    const progressInterval = setInterval(() => {
      progressValue = Math.min(progressValue + 2, 55); // Cap at 55%
      onProgress?.(progressValue, 'Generating ZK proof on server...');
    }, 2000);

    let proofData: { proofData: string; publicOutputs: string[]; vkey: string };

    try {
      const proofResponse = await fetch('/api/zkemail/generate-proof', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emlContent, blueprintId }),
      });

      clearInterval(progressInterval);

      if (!proofResponse.ok) {
        const error = await proofResponse.json();
        throw new Error(error.error || 'Failed to generate zkEmail proof');
      }

      proofData = await proofResponse.json();
      console.log('[zkEmail] Proof generated successfully');
      onProgress?.(60, 'Proof generated!');
    } catch (err) {
      clearInterval(progressInterval);
      throw err;
    }

    // ==== STEP 2: Submit to zkVerify (Server-Side) ====
    console.log('[zkVerify] Submitting proof to zkVerify...');
    onProgress?.(65, 'Submitting to zkVerify...');

    const zkVerifyResponse = await fetch('/api/zkverify/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        proofData: {
          proof: proofData.proofData,
          curve: 'bn128',
          inputs: proofData.publicOutputs,
        },
        vkey: proofData.vkey, // Pass vkey from generate-proof
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

/**
 * Get blueprint ID from environment
 */
export function getBlueprintId(): string {
  const blueprintId = process.env.NEXT_PUBLIC_ZKEMAIL_BLUEPRINT_ID;
  if (!blueprintId) {
    throw new Error('NEXT_PUBLIC_ZKEMAIL_BLUEPRINT_ID not configured');
  }
  return blueprintId;
}
