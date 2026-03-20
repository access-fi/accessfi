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
import { type PoolInfo, type ProofTypeId } from '@/lib/contracts/types';
import { toProofTypeId, type ProofTypeRecord } from '@/lib/proof-types';

const DEFAULT_PROOF_KIND = 'zkemail';

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
  proofRequirements: z.array(z.string()).min(1, 'Select at least one proof type'),
});

type FormData = z.infer<typeof formSchema>;

function getMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Unknown error';
}

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
  const [proofTypes, setProofTypes] = useState<ProofTypeRecord[]>([]);
  const [loadingProofTypes, setLoadingProofTypes] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [customBlueprintId, setCustomBlueprintId] = useState('');
  const [customPublic, setCustomPublic] = useState(true);

  // Contract hook for pool creation
  const { createPool, isConfirmed, error: contractError } = useCreatePool(
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

  const handleProofToggle = (proofId: string) => {
    const current = proofRequirements;
    const updated = current.includes(proofId)
      ? current.filter((id) => id !== proofId)
      : [...current, proofId];
    setValue('proofRequirements', updated);
  };

  const reloadProofTypes = React.useCallback(async () => {
    if (!address) return;
    setLoadingProofTypes(true);
    try {
      const res = await fetch(`/api/proof-types?address=${address}`);
      if (!res.ok) throw new Error('Failed to load proof types');
      const data = await res.json();
      setProofTypes(data.items || []);
    } catch (error) {
      console.error('Failed to load proof types', error);
    } finally {
      setLoadingProofTypes(false);
    }
  }, [address]);

  React.useEffect(() => {
    if (open) {
      reloadProofTypes();
    }
  }, [open, reloadProofTypes]);

  const createCustomProof = async () => {
    if (!address) {
      setErrorMessage('Connect wallet to create a proof type');
      return;
    }
    if (!customTitle || !customDescription || !customBlueprintId) {
      setErrorMessage('Custom proof requires title, description, and blueprint ID');
      return;
    }

    const slug = customTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const id = `${DEFAULT_PROOF_KIND}:${slug || 'custom'}_${Date.now()}@v1`;

    try {
      const res = await fetch('/api/proof-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          title: customTitle,
          description: customDescription,
          kind: DEFAULT_PROOF_KIND,
          blueprintId: customBlueprintId,
          isPublic: customPublic,
          createdBy: address,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Failed to create proof type' }));
        throw new Error(errorData.error || 'Failed to create proof type');
      }

      await reloadProofTypes();
      setValue('proofRequirements', [...proofRequirements, id]);
      setCustomOpen(false);
      setCustomTitle('');
      setCustomDescription('');
      setCustomBlueprintId('');
      setCustomPublic(true);
      setErrorMessage('');
    } catch (error: unknown) {
      setErrorMessage(getMessage(error));
    }
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
        proofRequirements: data.proofRequirements.map((id) => toProofTypeId(id)) as ProofTypeId[],
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
      await createPool(poolInfo, totalBudgetWei);

      // Keep in confirming state while transaction is being mined
      // The useEffect will handle the success state when isConfirmed becomes true
    } catch (error: unknown) {
      console.error('Pool creation error:', error);
      setErrorMessage(getMessage(error));
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
      <DialogContent
        onInteractOutside={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => event.preventDefault()}
        className="max-h-[92vh] max-w-5xl overflow-hidden rounded-[30px] border border-white/80 bg-[linear-gradient(180deg,#f9fbff_0%,#f2f6ff_100%)] p-0 shadow-[0_30px_90px_rgba(79,124,255,0.16)]"
      >
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
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#dce6f8] bg-[rgba(247,250,255,0.92)] p-6 backdrop-blur-xl">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7b8aaa]">
                    Request coverage
                  </p>
                  <h2 className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-[#18233f]">Create a verified request</h2>
                  <p className="mt-2 text-sm text-[#64748b]">
                    Define the signal you need, the proof requirements, and the budget that should unlock new verified supply.
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  className="rounded-full border border-[#dce6f8] bg-white p-2 text-[#64748b] transition-colors hover:border-[#a5c2ff] hover:text-[#18233f]"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 p-6 lg:grid-cols-[1fr_320px]">
                <div>
                {/* Pool Details Section */}
                <div className="mb-6 rounded-[26px] border border-[#dce6f8] bg-white/90 p-6 shadow-[0_18px_50px_rgba(32,44,63,0.05)]">
                  <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7b8aaa]">
                    Request details
                  </h3>
                  <div className="space-y-4">
                    {/* Pool Name */}
                    <div>
                      <Label htmlFor="name" className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7b8aaa]">
                        Request name
                      </Label>
                      <Input
                        id="name"
                        {...register('name')}
                        placeholder="e.g., Verified waitlist demand in India"
                        className="mt-2 h-12 rounded-2xl border-[#dce6f8] bg-[#f8fbff]"
                      />
                      {errors.name && (
                        <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>
                      )}
                    </div>

                    {/* Description */}
                    <div>
                      <Label htmlFor="description" className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7b8aaa]">
                        What should be verified?
                      </Label>
                      <Textarea
                        id="description"
                        {...register('description')}
                        placeholder="Describe the signal you need and what makes it useful once verified."
                        className="mt-2 min-h-[96px] rounded-2xl border-[#dce6f8] bg-[#f8fbff]"
                      />
                      {errors.description && (
                        <p className="mt-1 text-xs text-destructive">
                          {errors.description.message}
                        </p>
                      )}
                    </div>

                    {/* Data Type */}
                    <div>
                      <Label className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7b8aaa]">Signal category</Label>
                      <RadioGroup
                        value={watch('dataType')}
                        onValueChange={(value) => setValue('dataType', value)}
                        className="mt-2 grid grid-cols-2 gap-3"
                      >
                        {DATA_TYPES.map((type) => (
                          <label
                            key={type.value}
                            className="flex cursor-pointer items-center gap-3 rounded-2xl border border-[#dce6f8] bg-[#f8fbff] p-4 transition-all hover:border-[#a5c2ff] hover:bg-white"
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
                <div className="mb-6 rounded-[26px] border border-[#dce6f8] bg-white/90 p-6 shadow-[0_18px_50px_rgba(32,44,63,0.05)]">
                  <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7b8aaa]">
                    Incentives and timing
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    {/* Price Per Data */}
                    <div>
                      <Label htmlFor="pricePerData" className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7b8aaa]">
                        Price per verified record
                      </Label>
                      <Input
                        id="pricePerData"
                        type="number"
                        step="0.000001"
                        {...register('pricePerData')}
                        placeholder="0.01"
                        className="mt-2 h-12 rounded-2xl border-[#dce6f8] bg-[#f8fbff]"
                      />
                      {errors.pricePerData && (
                        <p className="mt-1 text-xs text-destructive">
                          {errors.pricePerData.message}
                        </p>
                      )}
                    </div>

                    {/* Total Budget */}
                    <div>
                      <Label htmlFor="totalBudget" className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7b8aaa]">
                        Total budget
                      </Label>
                      <Input
                        id="totalBudget"
                        type="number"
                        step="0.000001"
                        {...register('totalBudget')}
                        placeholder="1.0"
                        className="mt-2 h-12 rounded-2xl border-[#dce6f8] bg-[#f8fbff]"
                      />
                      {errors.totalBudget && (
                        <p className="mt-1 text-xs text-destructive">
                          {errors.totalBudget.message}
                        </p>
                      )}
                    </div>

                    {/* Max Sellers */}
                    <div>
                      <Label htmlFor="maxSellers" className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7b8aaa]">
                        Max contributors
                      </Label>
                      <Input
                        id="maxSellers"
                        type="number"
                        {...register('maxSellers')}
                        placeholder="20"
                        className="mt-2 h-12 rounded-2xl border-[#dce6f8] bg-[#f8fbff]"
                      />
                      {errors.maxSellers && (
                        <p className="mt-1 text-xs text-destructive">
                          {errors.maxSellers.message}
                        </p>
                      )}
                    </div>

                    {/* Deadline */}
                    <div>
                      <Label htmlFor="deadline" className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7b8aaa]">
                        Deadline
                      </Label>
                      <Input
                        id="deadline"
                        type="datetime-local"
                        {...register('deadline')}
                        min={new Date(Date.now() + 3600000).toISOString().slice(0, 16)}
                        className="mt-2 h-12 rounded-2xl border-[#dce6f8] bg-[#f8fbff]"
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
                      className="mt-4 rounded-[22px] border border-[#d9e6ff] bg-[linear-gradient(160deg,#4f7cff_0%,#7aa2ff_100%)] p-4 text-white shadow-[0_18px_42px_rgba(79,124,255,0.18)]"
                    >
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/75">Estimated verified contributors</span>
                        <span className="font-semibold text-white">
                          ~{calculateEstimatedSellers()} sellers
                        </span>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Proof Requirements Section */}
                <div className="mb-6 rounded-[26px] border border-[#dce6f8] bg-white/90 p-6 shadow-[0_18px_50px_rgba(32,44,63,0.05)]">
                  <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7b8aaa]">
                    Proof requirements
                  </h3>
                  <p className="mb-4 text-sm text-[#64748b]">
                    Choose the proofs contributors must satisfy before their data becomes part of the network.
                  </p>
                  {loadingProofTypes ? (
                    <div className="text-xs text-muted-foreground">Loading proof types...</div>
                  ) : proofTypes.length === 0 ? (
                    <div className="text-xs text-muted-foreground">
                      No proof types found. Create a custom proof below.
                    </div>
                  ) : (
                    <div className="grid gap-3 md:grid-cols-2">
                      {proofTypes.map((proof) => (
                        <label
                          key={proof.id}
                          className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[#dce6f8] bg-[#f8fbff] p-4 transition-all hover:border-[#a5c2ff] hover:bg-white"
                        >
                          <Checkbox
                            checked={proofRequirements.includes(proof.id)}
                            onCheckedChange={() => handleProofToggle(proof.id)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="font-semibold">{proof.title}</div>
                            <div className="text-xs text-muted-foreground">{proof.description}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}

                    <div className="mt-4 rounded-[22px] border border-[#dce6f8] bg-[#f8fbff] p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7b8aaa]">Custom zkEmail proof</div>
                        <div className="text-xs text-[#64748b]">
                          Create a custom blueprint-based proof type
                        </div>
                      </div>
                      <Button type="button" variant="outline" onClick={() => setCustomOpen(!customOpen)}>
                        {customOpen ? 'Hide' : 'Add'}
                      </Button>
                    </div>

                    {customOpen && (
                      <div className="mt-4 space-y-3">
                        <div>
                          <Label htmlFor="customTitle">Proof Name</Label>
                          <Input
                            id="customTitle"
                            value={customTitle}
                            onChange={(e) => setCustomTitle(e.target.value)}
                            className="mt-2 h-11 rounded-2xl border-[#dce6f8] bg-white"
                          />
                        </div>
                        <div>
                          <Label htmlFor="customDescription">Short Description</Label>
                          <Textarea
                            id="customDescription"
                            value={customDescription}
                            onChange={(e) => setCustomDescription(e.target.value)}
                            className="mt-2 min-h-[88px] rounded-2xl border-[#dce6f8] bg-white"
                          />
                        </div>
                        <div>
                          <Label htmlFor="customBlueprintId">zkEmail Blueprint ID</Label>
                          <Input
                            id="customBlueprintId"
                            value={customBlueprintId}
                            onChange={(e) => setCustomBlueprintId(e.target.value)}
                            className="mt-2 h-11 rounded-2xl border-[#dce6f8] bg-white"
                            placeholder="e.g. access-fi/accessfi_email@v1"
                          />
                        </div>
                        <label className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Checkbox
                            checked={customPublic}
                            onCheckedChange={() => setCustomPublic(!customPublic)}
                          />
                          Make this proof type public
                        </label>
                        <Button type="button" onClick={createCustomProof}>
                          Save Proof Type
                        </Button>
                      </div>
                    )}
                  </div>
                  {errors.proofRequirements && (
                    <p className="mt-2 text-xs text-destructive">
                      {errors.proofRequirements.message}
                    </p>
                  )}
                  {errorMessage && step === 'form' && (
                    <p className="mt-2 text-xs text-destructive">
                      {errorMessage}
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <Button
                    type="button"
                    onClick={handleClose}
                    variant="outline"
                    className="h-12 flex-1 rounded-2xl border-[#dce6f8] bg-white"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-12 flex-1 rounded-2xl bg-[#4f7cff] text-white shadow-[0_16px_32px_rgba(79,124,255,0.22)] hover:bg-[#416eed]"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating request...
                      </>
                    ) : (
                      'Create request'
                    )}
                  </Button>
                </div>
                </div>

                <aside className="h-fit rounded-[26px] border border-[#dce6f8] bg-white/92 p-5 shadow-[0_18px_50px_rgba(32,44,63,0.05)]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7b8aaa]">Request summary</p>
                  <h3 className="mt-3 text-xl font-semibold tracking-[-0.04em] text-[#18233f]">
                    This request becomes a verified intake for the network.
                  </h3>
                  <div className="mt-5 space-y-4 text-sm">
                    <div className="rounded-[20px] border border-[#edf2fb] bg-[linear-gradient(180deg,#f7faff_0%,#eff5ff_100%)] p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7b8aaa]">Current setup</p>
                      <div className="mt-3 space-y-2 text-[#64748b]">
                        <div className="flex items-center justify-between"><span>Signal type</span><span className="font-semibold text-[#18233f]">{watch("dataType") || "Not selected"}</span></div>
                        <div className="flex items-center justify-between"><span>Proofs selected</span><span className="font-semibold text-[#18233f]">{proofRequirements.length}</span></div>
                        <div className="flex items-center justify-between"><span>Budget</span><span className="font-semibold text-[#18233f]">{watch("totalBudget") || "—"} ETH</span></div>
                      </div>
                    </div>
                    <div className="rounded-[20px] border border-[#edf2fb] bg-[#f8fbff] p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7b8aaa]">What contributors must do</p>
                      <p className="mt-2 text-[#64748b]">Submit data that matches your proof requirements and pricing terms.</p>
                    </div>
                    <div className="rounded-[20px] border border-[#edf2fb] bg-[#f8fbff] p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7b8aaa]">What the network gains</p>
                      <p className="mt-2 text-[#64748b]">Successful verification can feed reusable supply back into inventory for future workflows.</p>
                    </div>
                    <div className="rounded-[20px] border border-[#edf2fb] bg-[#f8fbff] p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7b8aaa]">Why this is cleaner</p>
                      <p className="mt-2 text-[#64748b]">You define the signal, proof, and budget once instead of coordinating validation manually.</p>
                    </div>
                  </div>
                </aside>
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
              <h3 className="mb-2 text-xl font-bold uppercase">Creating request...</h3>
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
              <h3 className="mb-2 text-xl font-bold uppercase text-primary">Request created!</h3>
              <p className="text-center text-sm text-muted-foreground">
                Your verified request is now live and ready for contributors
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
