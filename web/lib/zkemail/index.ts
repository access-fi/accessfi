/**
 * zkEmail + zkVerify Integration
 *
 * Based on: https://docs.zkverify.io/overview/explorations/zkemail
 */

import zkeSDK from "@zk-email/sdk";
import { zkVerifySession, Library, CurveType, ZkVerifyEvents } from "zkverifyjs";
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
 * Generate zkEmail proof and verify on zkVerify
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
    const vkey = await blueprint.getVkey();

    // Step 4: Create prover
    console.log('[zkEmail] Creating prover...');
    onProgress?.(25, 'Creating prover...');
    const prover = blueprint.createProver();

    // Step 5: Generate proof (this takes the longest)
    console.log('[zkEmail] Generating proof from email...');
    onProgress?.(30, 'Generating zero-knowledge proof...');
    const proof = await prover.generateProof(emlContent);

    console.log('[zkEmail] Proof generated successfully');
    onProgress?.(60, 'Proof generated!');

    // Step 6: Connect to zkVerify
    console.log('[zkVerify] Connecting to zkVerify...');
    onProgress?.(65, 'Connecting to zkVerify...');

    const network = process.env.NEXT_PUBLIC_ZKVERIFY_NETWORK || 'volta';
    const seedPhrase = process.env.NEXT_PUBLIC_ZKVERIFY_SEED_PHRASE;

    if (!seedPhrase) {
      throw new Error('NEXT_PUBLIC_ZKVERIFY_SEED_PHRASE not configured');
    }

    const sessionBuilder = zkVerifySession.start();
    const session = network === 'mainnet'
      ? await sessionBuilder.Mainnet().withAccount(seedPhrase)
      : await sessionBuilder.Volta().withAccount(seedPhrase);

    console.log('[zkVerify] Session started');
    onProgress?.(70, 'Submitting to zkVerify...');

    // Step 7: Submit proof to zkVerify
    console.log('[zkVerify] Submitting proof...');
    const { events } = await session.verify()
      .groth16({ library: Library.snarkjs, curve: CurveType.bn128 })
      .execute({
        proofData: {
          vk: JSON.parse(vkey),
          proof: proof.props.proofData,
          publicSignals: proof.props.publicOutputs,
        },
      });

    onProgress?.(80, 'Waiting for blockchain confirmation...');

    // Step 8: Wait for IncludedInBlock event
    console.log('[zkVerify] Waiting for IncludedInBlock event...');

    const eventData = await new Promise<any>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout waiting for zkVerify confirmation'));
      }, 120000); // 2 minute timeout

      events.on(ZkVerifyEvents.IncludedInBlock, (data: any) => {
        clearTimeout(timeout);
        console.log('[zkVerify] Included in block:', data);
        resolve(data);
      });

      events.on('error', (error: any) => {
        clearTimeout(timeout);
        reject(error);
      });
    });

    onProgress?.(90, 'Getting verification parameters...');

    // Step 9: Get attestation ID (might be in different places)
    const attestationId = eventData.attestationId || eventData.statementHash;

    console.log('[zkVerify] Event data:', {
      txHash: eventData.txHash,
      statement: eventData.statement,
      attestationId: attestationId?.toString(),
      domainId: eventData.domainId,
      aggregationId: eventData.aggregationId,
    });

    // Step 10: Get merkle proof if attestationId is available
    let verificationParams: VerificationParams;

    if (attestationId) {
      console.log('[zkVerify] Fetching merkle proof...');
      const merkleProof = await session.merkleProof(BigInt(attestationId));

      console.log('[zkVerify] Merkle proof received:', {
        pathLength: merkleProof.path?.length,
        leafIndex: merkleProof.leafIndex,
        numberOfLeaves: merkleProof.numberOfLeaves,
      });

      verificationParams = {
        aggregationId: BigInt(eventData.aggregationId || attestationId),
        domainId: BigInt(eventData.domainId || merkleProof.domainId || 0),
        merklePath: (merkleProof.path || []).map((p: string) =>
          (p.startsWith('0x') ? p : `0x${p}`) as `0x${string}`
        ),
        leaf: (eventData.statement.startsWith('0x')
          ? eventData.statement
          : `0x${eventData.statement}`) as `0x${string}`,
        leafCount: BigInt(merkleProof.numberOfLeaves || 1),
        index: BigInt(merkleProof.leafIndex || 0),
      };
    } else {
      // Fallback if no attestation ID (shouldn't happen normally)
      console.warn('[zkVerify] No attestation ID, using statement as proof hash');
      verificationParams = {
        aggregationId: BigInt(0),
        domainId: BigInt(0),
        merklePath: [],
        leaf: (eventData.statement.startsWith('0x')
          ? eventData.statement
          : `0x${eventData.statement}`) as `0x${string}`,
        leafCount: BigInt(1),
        index: BigInt(0),
      };
    }

    // Close session
    await session.close();
    console.log('[zkVerify] Session closed');

    onProgress?.(100, 'Complete!');

    // Return proof hash (use statement as unique identifier)
    const proofHash = (eventData.statement.startsWith('0x')
      ? eventData.statement
      : `0x${eventData.statement}`) as `0x${string}`;

    return {
      proofHash,
      verificationParams,
      txHash: eventData.txHash,
      statement: eventData.statement,
      attestationId: attestationId ? BigInt(attestationId) : undefined,
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
