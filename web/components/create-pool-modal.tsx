'use client';

/**
 * Create Pool Modal
 * Professional modal for creating data pools with smooth UI
 */

import { useState } from 'react';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount } from 'wagmi';
import { parseEther } from 'viem';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { X, Loader2, CheckCircle2, AlertCircle, Wallet } from 'lucide-react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useCreatePool } from '@/lib/contracts/hooks';
import { ProofType, type PoolInfo } from '@/lib/contracts/types';

// Define proof types based on contract enum
const PROOF_TYPES = [
  { id: ProofType.AGE_VERIFICATION, label: 'Age Verification', description: 'Verify age >18 without revealing exact birthdate' },
  { id: ProofType.NATIONALITY, label: 'Nationality', description: 'Prove nationality/citizenship status' },
  { id: ProofType.EMAIL_VERIFICATION, label: 'Email Verification', description: 'Verified email ownership' },
  { id: ProofType.HACKERHOUSE_INVITATION, label: 'HackerHouse Invitation', description: 'HackerHouse event invitation proof' },
];

const DATA_TYPES = [
  { value: 'health', label: 'Health Data' },
  { value: 'location', label: 'Location Data' },
  { value: 'financial', label: 'Financial Data' },
  { value: 'identity', label: 'Identity Data' },
  { value: 'behavioral', label: 'Behavioral Data' },
  { value: 'survey', label: 'Survey Responses' },
  { value: 'social', label: 'Social Media Data' },
  { value: 'biometric', label: 'Biometric Data' },
];

const formSchema = z.object({
  name: z.string().min(3, 'Pool name must be at least 3 characters').max(100),
  description: z.string().min(10, 'Description must be at least 10 characters').max(500),
  dataType: z.string().min(1, 'Please select a data type'),
  pricePerData: z.string().min(1, 'Price is required').refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 0;
  }, 'Price must be greater than 0'),
  totalBudget: z.string().min(1, 'Budget is required').refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 0;
  }, 'Budget must be greater than 0'),
  maxSellers: z.string().min(1, 'Max sellers is required'),
  deadline: z.string().min(1, 'Deadline is required').refine((val) => {
    const selectedDate = new Date(val);
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 3600000); // 1 hour minimum
    return selectedDate > oneHourFromNow;
  }, 'Deadline must be at least 1 hour in the future'),
  proofRequirements: z.array(z.number()).min(1, 'Select at least one proof type'),
});

type FormData = z.infer<typeof formSchema>;

interface CreatePoolModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreatePoolModal({ open, onClose, onSuccess }: CreatePoolModalProps) {
  const { address, isConnected } = useAccount();
  const { profile, needsOnboarding } = useUserProfile();
  const [step, setStep] = useState<'form' | 'confirming' | 'success' | 'error' | 'auth-required'>('form');
  const [errorMessage, setErrorMessage] = useState('');

  // Contract hook for pool creation
  const { createPool, isPending, isConfirming, isConfirmed, error: contractError } = useCreatePool(
    profile?.userContractAddress as `0x${string}` | undefined
  );

  // Check authentication when modal opens
  React.useEffect(() => {
    if (open) {
      if (!isConnected) {
        setStep('auth-required');
        setErrorMessage('Please connect your wallet to create a pool');
      } else if (needsOnboarding || !profile) {
        setStep('auth-required');
        setErrorMessage('Please complete your profile setup to create a pool');
      } else {
        setStep('form');
        setErrorMessage('');
      }
    }
  }, [open, isConnected, needsOnboarding, profile]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    // @ts-ignore - Zod v4 compatibility
    resolver: zodResolver(formSchema),
    defaultValues: {
      proofRequirements: [],
      dataType: '',
    },
  });

  const proofRequirements = watch('proofRequirements') || [];
  const pricePerData = watch('pricePerData');
  const totalBudget = watch('totalBudget');

  // Monitor transaction confirmation
  React.useEffect(() => {
    if (isConfirmed && step === 'confirming') {
      setStep('success');
      setTimeout(() => {
        reset();
        onSuccess?.();
        onClose();
      }, 2000);
    }
  }, [isConfirmed, step, reset, onSuccess, onClose]);

  // Handle contract errors
  React.useEffect(() => {
    if (contractError && step === 'confirming') {
      console.error('Contract error:', contractError);
      setErrorMessage(contractError.message || 'Transaction failed');
      setStep('error');
    }
  }, [contractError, step]);

  const handleProofToggle = (proofId: number) => {
    const current = proofRequirements;
    const updated = current.includes(proofId)
      ? current.filter((id) => id !== proofId)
      : [...current, proofId];
    setValue('proofRequirements', updated);
  };

  const calculateEstimatedSellers = () => {
    if (!pricePerData || !totalBudget) return 0;
    try {
      const price = parseFloat(pricePerData);
      const budget = parseFloat(totalBudget);
      if (price > 0 && budget > 0) {
        return Math.floor(budget / price);
      }
    } catch {
      return 0;
    }
    return 0;
  };

  const onSubmit = async (data: FormData) => {
    if (!isConnected || !address) {
      setErrorMessage('Please connect your wallet');
      setStep('error');
      return;
    }

    if (!profile?.userContractAddress) {
      setErrorMessage('User contract address not found');
      setStep('error');
      return;
    }

    try {
      setStep('confirming');

      // Convert form data to contract types
      const pricePerDataWei = parseEther(data.pricePerData);
      const totalBudgetWei = parseEther(data.totalBudget);

      // Parse deadline and ensure it's in the future
      const deadlineDate = new Date(data.deadline);
      const deadlineTimestamp = BigInt(Math.floor(deadlineDate.getTime() / 1000));
      const currentTimestamp = BigInt(Math.floor(Date.now() / 1000));

      // CRITICAL: Contract validates deadline > block.timestamp
      // Add buffer to ensure deadline is definitely in the future (60 seconds safety margin)
      const sixtySeconds = BigInt(60);
      const minimumDeadline = currentTimestamp + sixtySeconds;
      if (deadlineTimestamp <= currentTimestamp) {
        throw new Error(`Deadline must be in the future. Selected: ${deadlineDate.toISOString()}`);
      }
      if (deadlineTimestamp < minimumDeadline) {
        throw new Error(`Deadline too close. Please select a time at least 1 minute in the future.`);
      }

      // IMPORTANT: Send totalBudget as msg.value
      // The contract will internally calculate and deduct the 5% platform fee
      // So if user wants 10 ETH pool budget, they send 10 ETH, contract gives ~9.5 ETH to pool

      // Prepare PoolInfo struct
      const poolInfo: PoolInfo = {
        name: data.name,
        description: data.description,
        dataType: data.dataType,
        proofRequirements: data.proofRequirements as ProofType[],
        pricePerData: pricePerDataWei,
        totalBudget: totalBudgetWei,
        remainingBudget: totalBudgetWei,
        creator: address,
        isActive: true,
        createdAt: currentTimestamp,
        deadline: deadlineTimestamp,
      };

      // Call contract - this will trigger wallet popup
      // Send totalBudget as value (NOT totalBudget + fee)
      const txHash = await createPool(poolInfo, totalBudgetWei);

      // Keep in confirming state while transaction is being mined
      // The useEffect will handle the success state when isConfirmed becomes true
    } catch (error: any) {
      console.error('Pool creation error:', error);
      const errorMsg = error.message || error.toString() || 'Failed to create pool';
      setErrorMessage(errorMsg);
      setStep('error');
    }
  };

  const handleClose = () => {
    if (step !== 'confirming') {
      reset();
      setStep('form');
      setErrorMessage('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl border-2 border-border bg-background p-0 font-mono">
        <AnimatePresence mode="wait">
          {step === 'form' && (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="sticky top-0 z-10 flex items-center justify-between border-b-2 border-border bg-background p-6">
                <div>
                  <h2 className="text-2xl font-black uppercase">Create Data Pool</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Set up a new pool to collect verified data
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  className="transition-colors hover:text-primary"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="p-6">
                {/* Pool Details Section */}
                <div className="mb-8">
                  <h3 className="mb-4 text-sm font-bold uppercase text-primary">
                    Pool Details
                  </h3>
                  <div className="space-y-4">
                    {/* Pool Name */}
                    <div>
                      <Label htmlFor="name" className="text-xs font-bold uppercase">
                        Pool Name *
                      </Label>
                      <Input
                        id="name"
                        {...register('name')}
                        placeholder="e.g., Health Data Pool #001"
                        className="mt-2"
                      />
                      {errors.name && (
                        <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>
                      )}
                    </div>

                    {/* Description */}
                    <div>
                      <Label htmlFor="description" className="text-xs font-bold uppercase">
                        Description *
                      </Label>
                      <Textarea
                        id="description"
                        {...register('description')}
                        placeholder="Describe what kind of data you're looking for..."
                        className="mt-2 min-h-[80px]"
                      />
                      {errors.description && (
                        <p className="mt-1 text-xs text-destructive">
                          {errors.description.message}
                        </p>
                      )}
                    </div>

                    {/* Data Type */}
                    <div>
                      <Label className="text-xs font-bold uppercase">Data Type *</Label>
                      <RadioGroup
                        value={watch('dataType')}
                        onValueChange={(value) => setValue('dataType', value)}
                        className="mt-2 grid grid-cols-2 gap-3"
                      >
                        {DATA_TYPES.map((type) => (
                          <label
                            key={type.value}
                            className="flex cursor-pointer items-center gap-3 border-2 border-border bg-card p-3 transition-all hover:border-primary"
                          >
                            <RadioGroupItem value={type.value} />
                            <span className="text-sm font-semibold">{type.label}</span>
                          </label>
                        ))}
                      </RadioGroup>
                      {errors.dataType && (
                        <p className="mt-1 text-xs text-destructive">{errors.dataType.message}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Economics Section */}
                <div className="mb-8">
                  <h3 className="mb-4 text-sm font-bold uppercase text-primary">
                    Economics & Budget
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    {/* Price Per Data */}
                    <div>
                      <Label htmlFor="pricePerData" className="text-xs font-bold uppercase">
                        Price Per Data (ETH) *
                      </Label>
                      <Input
                        id="pricePerData"
                        type="number"
                        step="0.000001"
                        {...register('pricePerData')}
                        placeholder="0.01"
                        className="mt-2"
                      />
                      {errors.pricePerData && (
                        <p className="mt-1 text-xs text-destructive">
                          {errors.pricePerData.message}
                        </p>
                      )}
                    </div>

                    {/* Total Budget */}
                    <div>
                      <Label htmlFor="totalBudget" className="text-xs font-bold uppercase">
                        Total Budget (ETH) *
                      </Label>
                      <Input
                        id="totalBudget"
                        type="number"
                        step="0.000001"
                        {...register('totalBudget')}
                        placeholder="1.0"
                        className="mt-2"
                      />
                      {errors.totalBudget && (
                        <p className="mt-1 text-xs text-destructive">
                          {errors.totalBudget.message}
                        </p>
                      )}
                    </div>

                    {/* Max Sellers */}
                    <div>
                      <Label htmlFor="maxSellers" className="text-xs font-bold uppercase">
                        Max Sellers *
                      </Label>
                      <Input
                        id="maxSellers"
                        type="number"
                        {...register('maxSellers')}
                        placeholder="20"
                        className="mt-2"
                      />
                      {errors.maxSellers && (
                        <p className="mt-1 text-xs text-destructive">
                          {errors.maxSellers.message}
                        </p>
                      )}
                    </div>

                    {/* Deadline */}
                    <div>
                      <Label htmlFor="deadline" className="text-xs font-bold uppercase">
                        Deadline *
                      </Label>
                      <Input
                        id="deadline"
                        type="datetime-local"
                        {...register('deadline')}
                        min={new Date(Date.now() + 3600000).toISOString().slice(0, 16)}
                        className="mt-2"
                      />
                      <p className="mt-1 text-xs text-muted-foreground">
                        Must be at least 1 hour in the future
                      </p>
                      {errors.deadline && (
                        <p className="mt-1 text-xs text-destructive">{errors.deadline.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Budget Summary */}
                  {pricePerData && totalBudget && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 border-2 border-primary/30 bg-primary/5 p-4"
                    >
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Estimated Data Points:</span>
                        <span className="font-bold text-primary">
                          ~{calculateEstimatedSellers()} sellers
                        </span>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Proof Requirements Section */}
                <div className="mb-8">
                  <h3 className="mb-4 text-sm font-bold uppercase text-primary">
                    Proof Requirements *
                  </h3>
                  <p className="mb-4 text-xs text-muted-foreground">
                    Select the zero-knowledge proofs sellers must provide
                  </p>
                  <div className="grid gap-3 md:grid-cols-2">
                    {PROOF_TYPES.map((proof) => (
                      <label
                        key={proof.id}
                        className="flex cursor-pointer items-start gap-3 border-2 border-border bg-card p-4 transition-all hover:border-primary"
                      >
                        <Checkbox
                          checked={proofRequirements.includes(proof.id)}
                          onCheckedChange={() => handleProofToggle(proof.id)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="font-semibold">{proof.label}</div>
                          <div className="text-xs text-muted-foreground">{proof.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                  {errors.proofRequirements && (
                    <p className="mt-2 text-xs text-destructive">
                      {errors.proofRequirements.message}
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <Button
                    type="button"
                    onClick={handleClose}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1"
                    style={{ boxShadow: '6px 6px 0px rgba(0, 255, 133, 0.4)' }}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Pool'
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          )}

          {step === 'confirming' && (
            <motion.div
              key="confirming"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center p-12"
            >
              <Loader2 className="mb-6 h-16 w-16 animate-spin text-primary" />
              <h3 className="mb-2 text-xl font-bold uppercase">Creating Pool...</h3>
              <p className="text-center text-sm text-muted-foreground">
                Please confirm the transaction in your wallet
              </p>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center p-12"
            >
              <CheckCircle2 className="mb-6 h-16 w-16 text-primary" />
              <h3 className="mb-2 text-xl font-bold uppercase text-primary">Pool Created!</h3>
              <p className="text-center text-sm text-muted-foreground">
                Your data pool is now live and accepting sellers
              </p>
            </motion.div>
          )}

          {step === 'auth-required' && (
            <motion.div
              key="auth-required"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center p-12"
            >
              <Wallet className="mb-6 h-16 w-16 text-primary" />
              <h3 className="mb-2 text-xl font-bold uppercase">Authentication Required</h3>
              <p className="mb-6 text-center text-sm text-muted-foreground">{errorMessage}</p>

              {!isConnected ? (
                <ConnectButton.Custom>
                  {({ openConnectModal }) => (
                    <Button
                      onClick={openConnectModal}
                      style={{ boxShadow: '6px 6px 0px rgba(0, 255, 133, 0.4)' }}
                    >
                      Connect Wallet
                    </Button>
                  )}
                </ConnectButton.Custom>
              ) : (
                <div className="flex gap-3">
                  <Button onClick={handleClose} variant="outline">
                    Go to Profile Setup
                  </Button>
                  <Button onClick={handleClose} variant="outline">
                    Cancel
                  </Button>
                </div>
              )}
            </motion.div>
          )}

          {step === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center p-12"
            >
              <AlertCircle className="mb-6 h-16 w-16 text-destructive" />
              <h3 className="mb-2 text-xl font-bold uppercase text-destructive">Error</h3>
              <p className="mb-6 text-center text-sm text-muted-foreground">{errorMessage}</p>
              <Button onClick={() => setStep('form')} variant="outline">
                Try Again
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
