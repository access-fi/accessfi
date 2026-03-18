'use client';

import { useState } from 'react';
import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount } from 'wagmi';
import { formatEther } from 'viem';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, AlertCircle, Lock } from 'lucide-react';
import { useUserProfile } from '@/hooks/useUserProfile';
import type { ProofTypeId } from '@/lib/contracts/types';
import { useJoinPool, usePoolInfo, useSubmitProof, usePoolProofRequirements } from '@/lib/contracts/hooks';
import { ResalePolicy as ContractResalePolicy } from '@/lib/contracts/types';
import { createAssetId, normalizeRecipientEmail, type ResalePolicy } from '@/lib/inventory';
import { EmailFileUpload } from './email-file-upload';
import { generateAndVerifyProof } from '@/lib/zkemail';
import { toast } from 'sonner';
import { toProofTypeId, type ProofTypeRecord } from '@/lib/proof-types';

// Known contract error selectors and their user-friendly messages
const CONTRACT_ERRORS: Record<string, string> = {
  '0x3d367a03': 'This email has already been submitted. Each email can only be used once.',
  '0x003b2682': 'You have already joined this pool.',
  '0x71815202': 'The pool is no longer active.',
  '0x398b36db': 'The pool has expired.',
  '0x4dd23c8b': 'Insufficient budget in the pool.',
  '0xf499da20': 'Payment to seller failed.',
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Failed to submit proof. Please try again.';
}

// Parse contract errors from transaction failures
function parseContractError(error: unknown): string {
  const errorString =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : String(error ?? '');

  // Check for known error selectors in the error message
  for (const [selector, message] of Object.entries(CONTRACT_ERRORS)) {
    if (errorString.includes(selector)) {
      return message;
    }
  }

  // Check for common error patterns
  if (errorString.includes('DuplicateData')) {
    return 'This email has already been submitted. Each email can only be used once.';
  }
  if (errorString.includes('AlreadyJoined')) {
    return 'You have already joined this pool.';
  }
  if (errorString.includes('InsufficientBudget')) {
    return 'The pool does not have enough budget to pay for this submission.';
  }
  if (errorString.includes('PoolNotActive')) {
    return 'This pool is no longer accepting submissions.';
  }
  if (errorString.includes('User denied') || errorString.includes('user rejected')) {
    return 'Transaction was cancelled by user.';
  }
  if (errorString.includes('insufficient funds')) {
    return 'Insufficient funds for gas. Please add more ETH to your wallet.';
  }

  // Return original error if no match
  return getErrorMessage(error);
}

function extractRecipientEmail(emlContent: string): string | null {
  if (!emlContent) return null;

  const lines = emlContent.split('\n');
  const pickHeaderValue = (headerName: string) => {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;
      if (line.toLowerCase().startsWith(headerName)) {
        let value = line.slice(headerName.length).trim();
        // Handle folded header lines
        for (let j = i + 1; j < lines.length; j++) {
          const nextLine = lines[j];
          if (nextLine && /^[\t ]/.test(nextLine)) {
            value += ` ${nextLine.trim()}`;
          } else {
            break;
          }
        }
        return value;
      }
      // Stop after headers
      if (line.trim() === '') break;
    }
    return null;
  };

  const toValue = pickHeaderValue('to:');
  const deliveredToValue = pickHeaderValue('delivered-to:');
  const headerValue = toValue || deliveredToValue || '';

  const match = headerValue.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return match ? match[0] : null;
}

type ModalStep =
  | 'upload-email'      // Step 1: Upload .eml file
  | 'generating-proof'  // Step 2: zkEmail proof generation
  | 'encrypting'        // Step 3: TEE encryption
  | 'joining'           // Step 4: Join pool (if not joined)
  | 'confirming'        // Step 5: Submit proof transaction
  | 'success'           // Step 6: Success
  | 'error';            // Error state

interface JoinPoolModalProps {
  open: boolean;
  onClose: () => void;
  poolAddress: `0x${string}`;
  poolName: string;
  pricePerData: bigint;
}

type PoolInfoTuple = readonly [
  string,
  string,
  string,
  bigint,
  bigint,
  bigint,
  `0x${string}`,
  boolean,
  bigint,
  bigint,
];

export function JoinPoolModal({
  open,
  onClose,
  poolAddress,
  poolName,
  pricePerData
}: JoinPoolModalProps) {
  const { address, chainId } = useAccount();
  const { profile } = useUserProfile();
  const [step, setStep] = useState<ModalStep>('upload-email');
  const [errorMessage, setErrorMessage] = useState('');
  const [proofProgress, setProofProgress] = useState(0);
  const [emailFile, setEmailFile] = useState<File | null>(null);
  const [proofTypes, setProofTypes] = useState<ProofTypeRecord[]>([]);

  const [resalePolicy, setResalePolicy] = useState<ResalePolicy>('exclusive');
  const [pendingAssetRecord, setPendingAssetRecord] = useState<Record<string, unknown> | null>(null);
  const { data: poolInfoData } = usePoolInfo(poolAddress);

  const resalePolicyToContractValue = (policy: ResalePolicy): ContractResalePolicy => {
    if (policy === 'limited_resale') return ContractResalePolicy.LIMITED_RESALE;
    if (policy === 'open_resale') return ContractResalePolicy.OPEN_RESALE;
    return ContractResalePolicy.EXCLUSIVE;
  };


  // Contract hooks
  const { joinPool } =
    useJoinPool(profile?.userContractAddress as `0x${string}` | undefined);

  const {
    submitProof,
    isConfirmed: submitConfirmed,
    isConfirmError: submitConfirmError,
    confirmError: submitConfirmErrorDetails,
    receipt: submitReceipt,
    hash: txHash,
  } =
    useSubmitProof(profile?.userContractAddress as `0x${string}` | undefined);

  const { data: poolProofsData } = usePoolProofRequirements(poolAddress as `0x${string}`);
  const poolProofs = (poolProofsData as ProofTypeId[]) || [];

  const waitForDestinationChainReadiness = async (
    params: {
      chainId: number;
      verificationParams: {
        aggregationId: bigint;
        domainId: bigint;
        merklePath: readonly `0x${string}`[];
        leaf: `0x${string}`;
        leafCount: bigint;
        index: bigint;
      };
    }
  ) => {
    const maxAttempts = 18;
    const delayMs = 5000;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      setProofProgress(Math.max(72, Math.min(88, 72 + attempt)));
      console.log(
        `[JoinPool] zkVerify preflight attempt ${attempt}/${maxAttempts} for chain ${params.chainId}`
      );

      const response = await fetch('/api/zkverify/preflight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chainId: params.chainId,
          verificationParams: {
            aggregationId: params.verificationParams.aggregationId.toString(),
            domainId: params.verificationParams.domainId.toString(),
            merklePath: [...params.verificationParams.merklePath],
            leaf: params.verificationParams.leaf,
            leafCount: params.verificationParams.leafCount.toString(),
            index: params.verificationParams.index.toString(),
          },
        }),
      });

      const result = await response.json().catch(() => ({ ready: false, error: 'Preflight check failed' }));
      if (!response.ok) {
        throw new Error(result.error || 'Failed to check proof readiness on destination chain.');
      }

      if (result.ready) {
        console.log('[JoinPool] zkVerify preflight confirmed on destination chain');
        return;
      }

      console.log('[JoinPool] zkVerify preflight not ready yet:', result.error || 'Awaiting destination chain publication');

      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    throw new Error(
      'Proof is aggregated but not yet ready on the destination chain. Please wait a minute and try again.'
    );
  };

  // Reset on open
  React.useEffect(() => {
    if (open) {
      setStep('upload-email');
      setErrorMessage('');
      setProofProgress(0);
      setEmailFile(null);
      setResalePolicy('exclusive');
      setPendingAssetRecord(null);
    }
  }, [open]);

  React.useEffect(() => {
    const loadProofTypes = async () => {
      if (!open) return;
      try {
        const res = await fetch(`/api/proof-types?address=${address || ''}`);
        if (!res.ok) throw new Error('Failed to load proof types');
        const data = await res.json();
        setProofTypes(data.items || []);
      } catch (error: unknown) {
        console.error('[JoinPool] Failed to load proof types:', error);
      }
    };

    loadProofTypes();
  }, [open, address]);

  // Monitor transaction confirmation
  React.useEffect(() => {
    if (!submitConfirmed || step !== 'confirming') return;

    const persistAsset = async () => {
      if (pendingAssetRecord) {
        const response = await fetch('/api/inventory/assets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pendingAssetRecord),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Failed to sync inventory' }));
          throw new Error(errorData.error || 'Failed to sync inventory');
        }
      }

      setStep('success');
      toast.success('Proof submitted successfully!', {
        description: 'Asset registered, seller paid, and inventory updated',
      });
      setTimeout(() => {
        onClose();
      }, 3000);
    };

    persistAsset().catch((error: unknown) => {
      setErrorMessage(getErrorMessage(error) || 'Proof submitted but inventory sync failed');
      setStep('error');
    });
  }, [submitConfirmed, step, onClose, pendingAssetRecord]);

  React.useEffect(() => {
    if (step !== 'confirming') return;

    const status = submitReceipt?.status;
    const reverted =
      status === 'reverted';

    if (submitConfirmError || reverted) {
      const errorMessage = submitConfirmErrorDetails
        ? parseContractError(submitConfirmErrorDetails)
        : 'Transaction reverted on-chain. Please try again.';
      setErrorMessage(errorMessage);
      setStep('error');
      toast.error('Proof submission failed', {
        description: errorMessage,
      });
    }
  }, [step, submitConfirmError, submitConfirmErrorDetails, submitReceipt]);

  const handleFileSelect = (file: File) => {
    setEmailFile(file);
  };

  const handleSubmit = async () => {
    if (!emailFile || !address || !profile?.userContractAddress || !chainId) {
      setErrorMessage('Missing required data. Please connect wallet and complete profile.');
      setStep('error');
      return;
    }

    try {
      // Read .eml file content
      const emlContent = await emailFile.text();

      // Step 1: Generate complete proof (zkEmail + zkVerify)
      console.log('[JoinPool] Starting proof generation...');
      setStep('generating-proof');

      if (!poolProofs.length) {
        throw new Error('Pool has no proof requirements.');
      }
      if (poolProofs.length > 1) {
        throw new Error('Multiple proofs per pool are not supported yet.');
      }

      const poolProofTypeId = poolProofs[0];
      const proofType = proofTypes.find((p) => toProofTypeId(p.id) === poolProofTypeId);
      if (!proofType || proofType.kind !== 'zkemail' || !proofType.blueprintId) {
        throw new Error('Pool proof type is not configured for zkEmail.');
      }

      const proofResult = await generateAndVerifyProof(
        emlContent,
        proofType.blueprintId,
        (progress: number, step: string) => {
          setProofProgress(Math.floor(progress));
          console.log(`[JoinPool] ${step} - ${Math.floor(progress)}%`);
        }
      );

      console.log('[JoinPool] Proof complete:', {
        proofHash: proofResult.proofHash,
        statement: proofResult.statement,
        txHash: proofResult.txHash,
      });
      setProofProgress(70);

      console.log('[JoinPool] Waiting for destination-chain verifier readiness...');
      await waitForDestinationChainReadiness({
        chainId,
        verificationParams: proofResult.verificationParams,
      });

      // Step 2: Encrypt recipient email via TEE service
      console.log('[JoinPool] Preparing data (TEE encryption)...');
      setStep('encrypting');

      // Extract recipient email for encryption
      const recipientEmail = extractRecipientEmail(emlContent);
      if (!recipientEmail) {
        throw new Error('Recipient email not found in the .eml file.');
      }

      const normalizedRecipientEmail = normalizeRecipientEmail(recipientEmail);
      const assetId = createAssetId(address, proofType.id, normalizedRecipientEmail);

      const teeResponse = await fetch('/api/tee/encrypt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientEmail,
          poolAddress,
          sellerAddress: address,
          assetId,
        }),
      });

      if (!teeResponse.ok) {
        const errorData = await teeResponse.json().catch(() => ({ error: 'TEE encryption failed' }));
        throw new Error(errorData.error || 'TEE encryption failed');
      }

      const teeResult = await teeResponse.json();
      const encryptedCID = teeResult.encryptedCID as string;
      const dataHash = teeResult.dataHash as `0x${string}`;

      console.log('[JoinPool] Data prepared:', { dataHash, cidLength: encryptedCID.length });

      // Step 3: Join pool if not already joined
      console.log('[JoinPool] Joining pool...');
      setStep('joining');

      try {
        await joinPool(poolAddress);
        console.log('[JoinPool] Join pool transaction sent');

        // Wait briefly for join confirmation
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (joinError: unknown) {
        // If already joined, continue to proof submission
        if (getErrorMessage(joinError).includes('AlreadyJoined')) {
          console.log('[JoinPool] Already joined pool, continuing...');
        } else {
          throw joinError;
        }
      }

      // Step 4: Submit proof to blockchain
      console.log('[JoinPool] Submitting proof to blockchain...');
      setStep('confirming');

      await submitProof(
        poolAddress,
        poolProofTypeId,
        proofResult.proofHash,
        encryptedCID,
        dataHash as `0x${string}`,
        assetId,
        proofResult.verificationParams,
        resalePolicyToContractValue(resalePolicy)
      );

      const poolInfoTuple = poolInfoData as PoolInfoTuple | undefined;
      const buyerAddress = poolInfoTuple?.[6]?.toLowerCase();
      const category = poolInfoTuple?.[2] || 'email';

      setPendingAssetRecord({
        sellerAddress: address,
        buyerAddress,
        recipientEmail,
        category,
        subtype: poolName,
        proofTypeId: proofType.id,
        encryptedCID,
        dataHash,
        sourceType: 'pool_fulfillment',
        resalePolicy,
        basePrice: formatEther(pricePerData),
        verificationTxHash: proofResult.txHash,
        proofHash: proofResult.proofHash,
        aggregationId: proofResult.verificationParams.aggregationId.toString(),
        domainId: proofResult.verificationParams.domainId.toString(),
        proofStatement: proofResult.statement,
        poolAddress,
        searchableAttributes: {
          category,
          proofTypeId: proofType.id,
          provider: 'zkemail',
          poolName,
          resalePolicy,
          sourceType: 'pool_fulfillment',
        },
      });

      console.log('[JoinPool] Proof submitted, waiting for confirmation...');

      // Success handled by useEffect watching submitConfirmed

    } catch (error: unknown) {
      console.error('[JoinPool] Submission error:', error);

      // Parse contract-specific errors
      const errorMessage = parseContractError(error);
      setErrorMessage(errorMessage);
      setStep('error');
      toast.error('Proof submission failed', {
        description: errorMessage,
      });
    }
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="max-w-2xl border-2 border-border bg-background p-0 font-mono"
        onInteractOutside={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => event.preventDefault()}
      >
        <AnimatePresence mode="wait">

          {/* Step: Upload Email */}
          {step === 'upload-email' && (
            <motion.div
              key="upload"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="flex items-center justify-between border-b-2 border-border bg-background p-6">
                <div>
                  <h2 className="text-2xl font-black uppercase">JOIN POOL</h2>
                  <p className="mt-1 text-xs text-muted-foreground">{poolName}</p>
                </div>
              </div>

              <div className="p-6">
                <h3 className="font-mono text-sm font-bold uppercase mb-4 text-primary">
                  UPLOAD EMAIL PROOF
                </h3>

                <EmailFileUpload onFileSelect={handleFileSelect} />

                <div className="mt-4 border-2 border-yellow-500 bg-yellow-500/10 p-4">
                  <AlertCircle className="inline mr-2 text-yellow-500" />
                  <span className="font-mono text-xs">
                    Your email is processed locally. Only the recipient address is submitted.
                  </span>
                </div>

                <div className="mt-4 border-2 border-primary/30 bg-primary/5 p-4">
                  <p className="font-mono text-xs text-primary font-bold mb-2">
                    REWARD: {formatEther(pricePerData)} ETH
                  </p>
                  <p className="text-xs text-muted-foreground">
                    You will receive this amount once your proof is verified
                  </p>
                </div>

                <div className="mt-4 border-2 border-border bg-card p-4">
                  <p className="mb-3 font-mono text-xs font-bold uppercase text-primary">
                    FUTURE RESALE
                  </p>
                  <div className="space-y-2 font-mono text-xs text-muted-foreground">
                    <label className="flex items-start gap-2">
                      <input
                        type="radio"
                        name="resale-policy"
                        checked={resalePolicy === 'exclusive'}
                        onChange={() => setResalePolicy('exclusive')}
                      />
                      <span>Exclusive: only this buyer gets access.</span>
                    </label>
                    <label className="flex items-start gap-2">
                      <input
                        type="radio"
                        name="resale-policy"
                        checked={resalePolicy === 'limited_resale'}
                        onChange={() => setResalePolicy('limited_resale')}
                      />
                      <span>Limited resale: keep in inventory for future matching buyers.</span>
                    </label>
                    <label className="flex items-start gap-2">
                      <input
                        type="radio"
                        name="resale-policy"
                        checked={resalePolicy === 'open_resale'}
                        onChange={() => setResalePolicy('open_resale')}
                      />
                      <span>Open resale: make it globally available after verification.</span>
                    </label>
                  </div>
                </div>

                <div className="mt-6 flex gap-4">
                  <Button
                    onClick={handleSubmit}
                    disabled={!emailFile}
                    className="flex-1"
                  >
                    CONTINUE
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step: Generating Proof */}
          {step === 'generating-proof' && (
            <motion.div
              key="generating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center p-12"
            >
              <Loader2 className="mb-6 h-16 w-16 animate-spin text-primary" />
              <h3 className="mb-2 text-xl font-bold uppercase">
                GENERATING ZK PROOF...
              </h3>
              <p className="text-center text-sm text-muted-foreground mb-4">
                Computing zero-knowledge proof locally (30-60 seconds)
              </p>
              <div className="w-full max-w-xs">
                <div className="flex justify-between mb-2 font-mono text-xs">
                  <span className="text-muted-foreground">PROGRESS</span>
                  <span className="text-foreground">{proofProgress}%</span>
                </div>
                <div className="h-2 w-full bg-muted">
                  <motion.div
                    className="h-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${proofProgress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Step: Encrypting */}
          {step === 'encrypting' && (
            <motion.div
              key="encrypting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center p-12"
            >
              <Lock className="mb-6 h-16 w-16 text-primary" />
              <h3 className="mb-2 text-xl font-bold uppercase">
                ENCRYPTING DATA...
              </h3>
              <p className="text-center text-sm text-muted-foreground">
                Securing your email with hardware-backed encryption (Phala TEE)
              </p>
            </motion.div>
          )}

          {/* Step: Joining Pool */}
          {step === 'joining' && (
            <motion.div
              key="joining"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center p-12"
            >
              <Loader2 className="mb-6 h-16 w-16 animate-spin text-primary" />
              <h3 className="mb-2 text-xl font-bold uppercase">
                JOINING POOL...
              </h3>
              <p className="text-center text-sm text-muted-foreground">
                Please confirm the transaction in your wallet
              </p>
            </motion.div>
          )}

          {/* Step: Confirming */}
          {step === 'confirming' && (
            <motion.div
              key="confirming"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center p-12"
            >
              <Loader2 className="mb-6 h-16 w-16 animate-spin text-primary" />
              <h3 className="mb-2 text-xl font-bold uppercase">
                SUBMITTING PROOF...
              </h3>
              <p className="text-center text-sm text-muted-foreground mb-4">
                Please confirm the transaction in your wallet
              </p>
              {txHash && (
                <a
                  href={`https://basescan.org/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 text-primary underline text-xs font-mono hover:text-primary/80"
                >
                  VIEW TRANSACTION →
                </a>
              )}
            </motion.div>
          )}

          {/* Step: Success */}
          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="relative flex flex-col items-center justify-center p-12 overflow-hidden"
            >
              <div className="pointer-events-none absolute inset-0">
                {[
                  { left: '8%', delay: 0.0, duration: 2.4, size: 10 },
                  { left: '18%', delay: 0.2, duration: 2.8, size: 12 },
                  { left: '28%', delay: 0.4, duration: 2.6, size: 8 },
                  { left: '38%', delay: 0.1, duration: 3.0, size: 11 },
                  { left: '48%', delay: 0.3, duration: 2.5, size: 9 },
                  { left: '58%', delay: 0.5, duration: 3.1, size: 12 },
                  { left: '68%', delay: 0.2, duration: 2.7, size: 8 },
                  { left: '78%', delay: 0.6, duration: 3.0, size: 10 },
                  { left: '88%', delay: 0.1, duration: 2.9, size: 9 },
                ].map((petal, index) => (
                  <motion.span
                    key={`petal-${index}`}
                    className="absolute top-0 rounded-full bg-primary/60"
                    style={{ left: petal.left, width: petal.size, height: petal.size }}
                    initial={{ y: -30, opacity: 0 }}
                    animate={{ y: 280, opacity: [0, 1, 1, 0] }}
                    transition={{
                      duration: petal.duration,
                      delay: petal.delay,
                      repeat: 2,
                      ease: 'easeInOut',
                    }}
                  />
                ))}
              </div>
              <CheckCircle2 className="mb-6 h-16 w-16 text-primary" />
              <h3 className="mb-2 text-xl font-bold uppercase text-primary">
                PROOF SUBMITTED!
              </h3>
              <p className="text-center text-sm text-muted-foreground mb-4">
                Your verified data has been submitted to the pool.
              </p>
              <div className="border-2 border-primary bg-primary/10 p-4 text-center">
                <span className="font-mono text-sm text-primary">
                  Asset access will be registered and you will receive {formatEther(pricePerData)} ETH automatically.
                </span>
              </div>
              <div className="mt-6">
                <Button onClick={handleClose} variant="outline">
                  CLOSE
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step: Error */}
          {step === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center p-12"
            >
              <AlertCircle className="mb-6 h-16 w-16 text-destructive" />
              <h3 className="mb-2 text-xl font-bold uppercase text-destructive">
                SUBMISSION FAILED
              </h3>
              <p className="text-center text-sm text-muted-foreground mb-6 max-w-md">
                {errorMessage}
              </p>
              <div className="flex gap-3">
                <Button onClick={() => setStep('upload-email')} variant="outline">
                  TRY AGAIN
                </Button>
                <Button onClick={handleClose} variant="outline">
                  CLOSE
                </Button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
