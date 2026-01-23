/**
 * zkEmail Client-Side Proof Generation
 *
 * SECURITY: This file runs in the browser and only generates zkEmail proofs.
 * zkVerify submission (with seed phrase) happens server-side via API.
 *
 * Based on: https://docs.zkverify.io/overview/explorations/zkemail
 */

import zkeSDK from "@zk-email/sdk";
import { keccak256 } from "viem";
import type { VerificationParams } from "../contracts/types";

export interface ProofResult {
  // For smart contract
  proofHash: `0x${string}`;
  verificationParams: VerificationParams;

  // Metadata
  txHash: string;
  statement: string;
  attestationId?: bigint;
}

/**
 * Generate zkEmail proof locally and submit to zkVerify via server API
 *
 * ARCHITECTURE:
 * 1. Client (this file): Generate zkEmail proof locally
 * 2. Server API: Submit to zkVerify with secure seed phrase
 * 3. Client: Receive verification params for smart contract
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
    // ==== CLIENT-SIDE: Generate zkEmail Proof ====

    // Step 1: Initialize zkEmail SDK
    console.log('[zkEmail] Initializing SDK...');
    onProgress?.(5, 'Initializing zkEmail SDK...');
    const sdk = zkeSDK();

    // Step 2: Get blueprint
    const blueprintId = process.env.NEXT_PUBLIC_ZKEMAIL_BLUEPRINT_ID;
    if (!blueprintId) {
      throw new Error('NEXT_PUBLIC_ZKEMAIL_BLUEPRINT_ID not configured');
    }

    console.log('[zkEmail] Loading blueprint:', blueprintId);
    onProgress?.(10, 'Loading blueprint...');
    const blueprint = await sdk.getBlueprint(blueprintId);

    // Step 3: Download verification key
    console.log('[zkEmail] Downloading vkey...');
    onProgress?.(20, 'Downloading verification key...');
    console.log("[zkEmail] Blueprint:", blueprint);
    const vkey = await blueprint.getVkey();
    console.log('[zkEmail] Vkey:', vkey);
    const vkeyHash = keccak256(vkey as `0x${string}`);
    console.log('[zkEmail] Vkey hash:', vkeyHash);

    // Step 4: Create prover
    console.log('[zkEmail] Creating prover...');
    onProgress?.(25, 'Creating prover...');
    const prover = blueprint.createProver();

    // Step 5: Generate proof (this takes the longest - 30-60 seconds)
    console.log('[zkEmail] Generating proof from email...');
    onProgress?.(30, 'Generating zero-knowledge proof...');
    const proof = await prover.generateProof(emlContent);

    console.log('[zkEmail] Proof generated successfully');
    onProgress?.(60, 'Proof generated!');

    // ==== SERVER-SIDE: Submit to zkVerify ====

    console.log('[zkVerify] Submitting to server API...');
    onProgress?.(65, 'Submitting to zkVerify...');

    // Call server-side API with proof data (NO seed phrase exposure)
    const response = await fetch('/api/zkverify/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        proofData: {
          proof: proof.props.proofData,
          curve: 'bn128',
          inputs: proof.props.publicOutputs,
        },
        publicOutputs: proof.props.publicOutputs,
        vkeyHash,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to submit proof to zkVerify');
    }

    onProgress?.(90, 'Proof verified on zkVerify...');

    const result = await response.json();
    console.log('[zkVerify] Server response:', result);

    onProgress?.(100, 'Complete!');

    // Return formatted result
    return {
      proofHash: result.proofHash,
      verificationParams: {
        aggregationId: BigInt(result.verificationParams.attestationId),
        domainId: BigInt(0), // zkVerify uses attestationId
        merklePath: result.verificationParams.merkleProof,
        leaf: result.proofHash,
        leafCount: BigInt(result.verificationParams.leafCount),
        index: BigInt(result.verificationParams.leafIndex),
      },
      txHash: result.txHash,
      statement: result.statement,
      attestationId: BigInt(result.attestationId),
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

/**
 * Verify proof off-chain (for testing)
 */
export async function verifyProofOffChain(
  emlContent: string
): Promise<boolean> {
  console.log('[zkEmail] Verifying proof off-chain...');

  const sdk = zkeSDK();
  const blueprintId = getBlueprintId();
  const blueprint = await sdk.getBlueprint(blueprintId);
  const prover = blueprint.createProver();
  const proof = await prover.generateProof(emlContent);

  const verification = await blueprint.verifyProof(proof);
  console.log('[zkEmail] Off-chain verification:', verification);

  return verification;
}
