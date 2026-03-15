import { keccak256, stringToHex } from 'viem';

export type ResalePolicy = 'exclusive' | 'limited_resale' | 'open_resale';
export type AssetSource = 'direct' | 'pool_fulfillment' | 'external';

export function normalizeRecipientEmail(email: string) {
  return email.trim().toLowerCase();
}

export function createAssetId(
  sellerAddress: string,
  proofTypeId: string,
  normalizedVerifiedKey: string
) {
  return keccak256(
    stringToHex(`${sellerAddress.toLowerCase()}::${proofTypeId}::${normalizedVerifiedKey}`)
  );
}

export function computeRevenueSplit(amountEth: string, feePercent = 5) {
  const amount = Number(amountEth);
  const platformFee = ((amount * feePercent) / 100).toFixed(6);
  const sellerPayout = (amount - Number(platformFee)).toFixed(6);
  return {
    grossAmount: amount.toFixed(6),
    platformFee,
    sellerPayout,
  };
}
