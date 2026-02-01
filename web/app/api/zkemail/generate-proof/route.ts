/**
 * Server-side zkEmail proof generation
 *
 * Moves proof generation from browser to server to avoid WASM compatibility issues
 */

import { NextRequest, NextResponse } from 'next/server';

// Force dynamic - prevent static analysis of this route
export const dynamic = 'force-dynamic';
export const maxDuration = 120; // Allow up to 2 minutes for proof generation

interface GenerateProofRequest {
  emlContent: string;
  blueprintId: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: GenerateProofRequest = await req.json();
    const { emlContent, blueprintId } = body;

    if (!emlContent || !blueprintId) {
      return NextResponse.json(
        { error: 'Missing emlContent or blueprintId' },
        { status: 400 }
      );
    }

    console.log('[zkEmail API] Starting proof generation for blueprint:', blueprintId);

    // Dynamic import to avoid build-time localStorage issues
    // @ts-ignore - SDK exports correctly but TS has cache issue
    const { initZkEmailSdk } = await import('@zk-email/sdk');

    // Initialize SDK
    const sdk = initZkEmailSdk({ logging: { enabled: true } });

    // Get blueprint
    console.log('[zkEmail API] Loading blueprint...');
    const blueprint = await sdk.getBlueprint(blueprintId);

    const isValid = await blueprint.validateEmail(emlContent);
    console.log('[zkEmail API] Email is valid:', isValid);

    // Create prover
    console.log('[zkEmail API] Creating prover...');
    const prover = blueprint.createProver();

    // Generate proof (this takes 30-60 seconds)
    console.log('[zkEmail API] Generating proof...');
    const proof = await prover.generateProof(emlContent);

    console.log('[zkEmail API] Proof generated successfully');
    console.log('[zkEmail API] Proof props keys:', Object.keys(proof.props));
    console.log('[zkEmail API] proofData exists:', !!proof.props.proofData);
    console.log('[zkEmail API] publicOutputs exists:', !!(proof.props as any).publicOutputs);
    console.log('[zkEmail API] publicData exists:', !!(proof.props as any).publicData);

    // Also fetch vkey here so we don't need SDK in submit route
    console.log('[zkEmail API] Fetching verification key...');
    const vkey = await blueprint.getVkey();
    console.log('[zkEmail API] Vkey fetched, length:', vkey.length);

    // Return proof data (v2.0 might use publicData instead of publicOutputs)
    const publicOutputs = (proof.props as any).publicOutputs || (proof.props as any).publicData || [];

    return NextResponse.json({
      success: true,
      proofData: proof.props.proofData,
      publicOutputs,
      vkey, // Include vkey for zkVerify submission
    });

  } catch (error: any) {
    console.error('[zkEmail API] Error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to generate proof',
        details: error.toString(),
      },
      { status: 500 }
    );
  }
}
