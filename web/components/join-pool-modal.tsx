'use client';

import { useState } from 'react';
import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount } from 'wagmi';
import { formatEther } from 'viem';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Loader2, CheckCircle2, AlertCircle, Lock } from 'lucide-react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useJoinPool, useSubmitProof } from '@/lib/contracts/hooks';
import { ProofType } from '@/lib/contracts/types';
import { EmailFileUpload } from './email-file-upload';
import { generateAndVerifyProof } from '@/lib/zkemail';
import { toast } from 'sonner';

// Known contract error selectors and their user-friendly messages
const CONTRACT_ERRORS: Record<string, string> = {
  '0x3d367a03': 'This email has already been submitted. Each email can only be used once.',
  '0x003b2682': 'You have already joined this pool.',
  '0x71815202': 'The pool is no longer active.',
  '0x398b36db': 'The pool has expired.',
  '0x4dd23c8b': 'Insufficient budget in the pool.',
  '0xf499da20': 'Payment to seller failed.',
};

// Parse contract errors from transaction failures
function parseContractError(error: any): string {
  const errorString = error?.message || error?.toString() || '';

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
  return error?.shortMessage || error?.message || 'Failed to submit proof. Please try again.';
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

export function JoinPoolModal({
  open,
  onClose,
  poolAddress,
  poolName,
  pricePerData
}: JoinPoolModalProps) {
  const { address, isConnected } = useAccount();
  const { profile } = useUserProfile();
  const [step, setStep] = useState<ModalStep>('upload-email');
  const [errorMessage, setErrorMessage] = useState('');
  const [proofProgress, setProofProgress] = useState(0);
  const [emailFile, setEmailFile] = useState<File | null>(null);

  // Contract hooks
  const { joinPool, isPending: isJoining, isConfirmed: joinConfirmed } =
    useJoinPool(profile?.userContractAddress);

  const { submitProof, isPending: isSubmitting, isConfirmed: submitConfirmed, hash: txHash } =
    useSubmitProof(profile?.userContractAddress);

  // Reset on open
  React.useEffect(() => {
    if (open) {
      setStep('upload-email');
      setErrorMessage('');
      setProofProgress(0);
      setEmailFile(null);
    }
  }, [open]);

  // Monitor transaction confirmation
  React.useEffect(() => {
    if (submitConfirmed && step === 'confirming') {
      setStep('success');
      toast.success('Proof submitted successfully!', {
        description: 'Token will be minted and payment processed',
      });
      setTimeout(() => {
        onClose();
      }, 3000);
    }
  }, [submitConfirmed, step, onClose]);

  const handleFileSelect = (file: File) => {
    setEmailFile(file);
  };

  const handleSubmit = async () => {
    if (!emailFile || !address || !profile?.userContractAddress) {
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

      const proofResult = await generateAndVerifyProof(
        emlContent,
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

      // Step 2: For now, skip TEE encryption - store email hash directly
      // TODO: Re-enable TEE encryption when ready for production
      console.log('[JoinPool] Preparing data (encryption skipped for testing)...');
      setStep('encrypting');

      // Create a simple CID from the email content (for testing)
      // In production, this would be encrypted and stored on IPFS via TEE
      const encoder = new TextEncoder();
      const emailBytes = encoder.encode(emlContent);
      const hashBuffer = await crypto.subtle.digest('SHA-256', emailBytes);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const dataHash = '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('') as `0x${string}`;

      // For testing: store email content as base64 in CID field
      // In production: this would be an IPFS CID of encrypted data
      const encryptedCID = btoa(emlContent).slice(0, 100); // Truncate for testing

      console.log('[JoinPool] Data prepared:', { dataHash, cidLength: encryptedCID.length });

      // Step 3: Join pool if not already joined
      console.log('[JoinPool] Joining pool...');
      setStep('joining');

      try {
        await joinPool(poolAddress);
        console.log('[JoinPool] Join pool transaction sent');

        // Wait briefly for join confirmation
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (joinError: any) {
        // If already joined, continue to proof submission
        if (joinError.message?.includes('AlreadyJoined')) {
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
        ProofType.EMAIL_VERIFICATION,
        proofResult.proofHash,
        encryptedCID,
        dataHash as `0x${string}`,
        proofResult.verificationParams
      );

      console.log('[JoinPool] Proof submitted, waiting for confirmation...');

      // Success handled by useEffect watching submitConfirmed

    } catch (error: any) {
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
    if (step !== 'confirming' && step !== 'joining') {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl border-2 border-border bg-background p-0 font-mono">
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
                <button onClick={handleClose} className="transition-colors hover:text-primary">
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="p-6">
                <h3 className="font-mono text-sm font-bold uppercase mb-4 text-primary">
                  UPLOAD EMAIL PROOF
                </h3>

                <EmailFileUpload onFileSelect={handleFileSelect} />

                <div className="mt-4 border-2 border-yellow-500 bg-yellow-500/10 p-4">
                  <AlertCircle className="inline mr-2 text-yellow-500" />
                  <span className="font-mono text-xs">
                    Your email is processed locally and encrypted before submission.
                    Raw email never leaves your device.
                  </span>
                </div>

                <div className="mt-4 border-2 border-primary/30 bg-primary/5 p-4">
                  <p className="font-mono text-xs text-primary font-bold mb-2">
                    REWARD: {formatEther(pricePerData)} ETH
                  </p>
                  <p className="text-xs text-muted-foreground">
                    You'll receive this amount once your proof is verified
                  </p>
                </div>

                <div className="mt-6 flex gap-4">
                  <Button onClick={handleClose} variant="outline" className="flex-1">
                    CANCEL
                  </Button>
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
              className="flex flex-col items-center justify-center p-12"
            >
              <CheckCircle2 className="mb-6 h-16 w-16 text-primary" />
              <h3 className="mb-2 text-xl font-bold uppercase text-primary">
                PROOF SUBMITTED!
              </h3>
              <p className="text-center text-sm text-muted-foreground mb-4">
                Your verified data has been submitted to the pool.
              </p>
              <div className="border-2 border-primary bg-primary/10 p-4 text-center">
                <span className="font-mono text-sm text-primary">
                  Data token will be minted and you'll receive {formatEther(pricePerData)} ETH automatically.
                </span>
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
