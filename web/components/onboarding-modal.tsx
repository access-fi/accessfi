'use client';

/**
 * User Onboarding Modal
 * Collects user profile information and creates User contract
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAccount, useWaitForTransactionReceipt } from 'wagmi';
import { useCreateUser, useGetUserContract } from '@/lib/contracts/hooks';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';

const dataTypes = [
  { id: 'age', label: 'Age Verification' },
  { id: 'nationality', label: 'Nationality' },
  { id: 'email', label: 'Email Verification' },
  { id: 'hackerhouse', label: 'HackerHouse Invitation' },
];

const formSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  role: z.enum(['buyer', 'seller', 'both'] as const),
  dataToSell: z.array(z.string()).optional(),
  dataToBuy: z.array(z.string()).optional(),
});

type FormData = z.infer<typeof formSchema>;

interface OnboardingModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function OnboardingModal({ open, onClose, onSuccess }: OnboardingModalProps) {
  const { address } = useAccount();
  const { createUser, isPending: isCreatingContract, hash } = useCreateUser();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });
  const { data: userContractAddress, refetch: refetchUserContract } = useGetUserContract(address);
  const [step, setStep] = useState<'form' | 'creating' | 'saving' | 'success'>('form');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    // @ts-ignore - Zod v4 compatibility issue with @hookform/resolvers
    resolver: zodResolver(formSchema),
    defaultValues: {
      role: 'both',
      dataToSell: [],
      dataToBuy: [],
    },
  });

  const role = watch('role');
  const dataToSell = watch('dataToSell') || [];
  const dataToBuy = watch('dataToBuy') || [];

  const handleDataTypeToggle = (field: 'dataToSell' | 'dataToBuy', value: string) => {
    const current = watch(field) || [];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    setValue(field, updated);
  };

  const onSubmit = async (data: FormData) => {
    if (!address) return;

    try {
      setStep('creating');
      const txHash = await createUser();

      if (!txHash) {
        throw new Error('Transaction failed');
      }

      let attempts = 0;
      const maxAttempts = 30;

      while (attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const result = await refetchUserContract();

        if (result.data && result.data !== '0x0000000000000000000000000000000000000000') {
          const contractAddress = result.data;

          setStep('saving');
          const response = await fetch('/api/user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              walletAddress: address.toLowerCase(),
              userContractAddress: contractAddress.toLowerCase(),
              fullName: data.fullName,
              role: data.role,
              dataToSell: data.dataToSell?.join(','),
              dataToBuy: data.dataToBuy?.join(','),
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            console.error('API error:', errorData);
            throw new Error(errorData.error || 'Failed to save profile');
          }

          setStep('success');
          setTimeout(() => {
            onSuccess();
          }, 1000);
          return;
        }

        attempts++;
      }

      throw new Error('Timeout waiting for user contract creation');
    } catch (error) {
      console.error('Onboarding error:', error);
      setStep('form');
      alert(`Failed to complete onboarding: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !isSubmitting && onClose()}>
      <DialogContent className="max-w-5xl border-2 border-border bg-background p-0">
        {/* Top Status Bar */}
        <div className="border-b-2 border-border bg-card px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center border-2 border-foreground bg-foreground font-mono text-lg text-background">
                {step === 'form' && '●'}
                {step === 'creating' && '◐'}
                {step === 'saving' && '◑'}
                {step === 'success' && '✓'}
              </div>
              <div>
                <h2 className="font-mono text-sm font-black uppercase tracking-tight">
                  {step === 'form' && 'Account Setup'}
                  {step === 'creating' && 'Creating Contract'}
                  {step === 'saving' && 'Saving Profile'}
                  {step === 'success' && 'Complete'}
                </h2>
              </div>
            </div>
            <div className="font-mono text-xs text-muted-foreground uppercase">
              {step === 'form' && 'Step 1 of 3'}
              {step === 'creating' && 'Step 2 of 3'}
              {step === 'saving' && 'Step 3 of 3'}
              {step === 'success' && 'Done'}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'form' && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-6">
                  {/* Full Name */}
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Full Name
                    </Label>
                    <Input
                      id="fullName"
                      {...register('fullName')}
                      placeholder="Enter your name"
                      className="h-11 border-2 border-border bg-background font-mono text-sm focus:border-foreground"
                    />
                    {errors.fullName && (
                      <p className="font-mono text-xs text-muted-foreground">{errors.fullName.message}</p>
                    )}
                  </div>

                  {/* Role Selection */}
                  <div className="space-y-2">
                    <Label className="font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Account Type
                    </Label>
                    <RadioGroup
                      value={role}
                      onValueChange={(value) => setValue('role', value as FormData['role'])}
                      className="grid gap-2"
                    >
                      <label
                        htmlFor="buyer"
                        className={`flex cursor-pointer items-center gap-3 border-2 p-3 transition-colors ${
                          role === 'buyer'
                            ? 'border-foreground bg-foreground/5'
                            : 'border-border bg-background hover:border-muted-foreground'
                        }`}
                      >
                        <RadioGroupItem value="buyer" id="buyer" />
                        <div className="flex-1">
                          <div className="font-mono text-xs font-bold uppercase">Buyer</div>
                          <div className="font-mono text-[10px] text-muted-foreground">Purchase data</div>
                        </div>
                      </label>

                      <label
                        htmlFor="seller"
                        className={`flex cursor-pointer items-center gap-3 border-2 p-3 transition-colors ${
                          role === 'seller'
                            ? 'border-foreground bg-foreground/5'
                            : 'border-border bg-background hover:border-muted-foreground'
                        }`}
                      >
                        <RadioGroupItem value="seller" id="seller" />
                        <div className="flex-1">
                          <div className="font-mono text-xs font-bold uppercase">Seller</div>
                          <div className="font-mono text-[10px] text-muted-foreground">Sell data</div>
                        </div>
                      </label>

                      <label
                        htmlFor="both"
                        className={`flex cursor-pointer items-center gap-3 border-2 p-3 transition-colors ${
                          role === 'both'
                            ? 'border-foreground bg-foreground/5'
                            : 'border-border bg-background hover:border-muted-foreground'
                        }`}
                      >
                        <RadioGroupItem value="both" id="both" />
                        <div className="flex-1">
                          <div className="font-mono text-xs font-bold uppercase">Both</div>
                          <div className="font-mono text-[10px] text-muted-foreground">Buy & sell</div>
                        </div>
                      </label>
                    </RadioGroup>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Data to Sell */}
                  {(role === 'seller' || role === 'both') && (
                    <div className="space-y-2">
                      <Label className="font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Data You Provide
                      </Label>
                      <div className="grid grid-cols-1 gap-2">
                        {dataTypes.map((type) => (
                          <label
                            key={type.id}
                            htmlFor={`sell-${type.id}`}
                            className={`flex cursor-pointer items-center gap-3 border p-2.5 transition-colors ${
                              dataToSell.includes(type.id)
                                ? 'border-foreground bg-foreground/5'
                                : 'border-border bg-background hover:border-muted-foreground'
                            }`}
                          >
                            <Checkbox
                              id={`sell-${type.id}`}
                              checked={dataToSell.includes(type.id)}
                              onCheckedChange={() => handleDataTypeToggle('dataToSell', type.id)}
                            />
                            <span className="font-mono text-xs">{type.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Data to Buy */}
                  {(role === 'buyer' || role === 'both') && (
                    <div className="space-y-2">
                      <Label className="font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Data You Need
                      </Label>
                      <div className="grid grid-cols-1 gap-2">
                        {dataTypes.map((type) => (
                          <label
                            key={type.id}
                            htmlFor={`buy-${type.id}`}
                            className={`flex cursor-pointer items-center gap-3 border p-2.5 transition-colors ${
                              dataToBuy.includes(type.id)
                                ? 'border-foreground bg-foreground/5'
                                : 'border-border bg-background hover:border-muted-foreground'
                            }`}
                          >
                            <Checkbox
                              id={`buy-${type.id}`}
                              checked={dataToBuy.includes(type.id)}
                              onCheckedChange={() => handleDataTypeToggle('dataToBuy', type.id)}
                            />
                            <span className="font-mono text-xs">{type.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex gap-3 border-t-2 border-border pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 h-11 border-2 font-mono text-xs font-bold uppercase tracking-wider"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-11 border-2 border-foreground bg-foreground font-mono text-xs font-bold uppercase tracking-wider text-background hover:bg-foreground/90"
                  disabled={isSubmitting}
                >
                  Create Account
                </Button>
              </div>
            </form>
          )}

          {(step === 'creating' || step === 'saving') && (
            <div className="flex min-h-[300px] flex-col items-center justify-center space-y-4">
              <div className="relative">
                <div className="h-12 w-12 animate-spin border-4 border-border border-t-foreground"></div>
              </div>
              <div className="text-center">
                <p className="font-mono text-xs font-bold uppercase tracking-wider">
                  {step === 'creating' && 'Deploying Contract'}
                  {step === 'saving' && 'Saving Profile'}
                </p>
                <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                  {step === 'creating' && 'Confirm in wallet'}
                  {step === 'saving' && 'Please wait'}
                </p>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="flex min-h-[300px] flex-col items-center justify-center space-y-4">
              <div className="flex h-12 w-12 items-center justify-center border-4 border-foreground bg-foreground font-mono text-xl text-background">
                ✓
              </div>
              <div className="text-center">
                <p className="font-mono text-xs font-bold uppercase tracking-wider">Account Created</p>
                <p className="mt-1 font-mono text-[10px] text-muted-foreground">Redirecting...</p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
