/**
 * TypeScript types for AccessFi smart contracts
 * Based on Solidity structs and enums
 */

// Pool proof requirements
export enum ProofType {
  AGE_VERIFICATION = 0,
  NATIONALITY = 1,
  EMAIL_VERIFICATION = 2,
  HACKERHOUSE_INVITATION = 3,
}

export const ProofTypeLabels: Record<ProofType, string> = {
  [ProofType.AGE_VERIFICATION]: 'Age Verification (>18)',
  [ProofType.NATIONALITY]: 'Nationality',
  [ProofType.EMAIL_VERIFICATION]: 'Email Verification',
  [ProofType.HACKERHOUSE_INVITATION]: 'HackerHouse Invitation',
};

// Pool Info struct
export interface PoolInfo {
  name: string;
  description: string;
  dataType: string;
  proofRequirements: ProofType[];
  pricePerData: bigint;
  totalBudget: bigint;
  remainingBudget: bigint;
  creator: `0x${string}`;
  isActive: boolean;
  createdAt: bigint;
  deadline: bigint;
}

// Verified Data struct
export interface VerifiedData {
  encryptedCID: string;
  encryptedDataHash: `0x${string}`;
  isEncrypted: boolean;
  isAccessTransferred: boolean;
  timestamp: bigint;
}

// ZK Verification Parameters
export interface VerificationParams {
  aggregationId: bigint;
  domainId: bigint;
  merklePath: `0x${string}`[];
  leaf: `0x${string}`;
  leafCount: bigint;
  index: bigint;
}

// Token Metadata
export interface TokenMetadata {
  encryptedCID: string;
  dataHash: `0x${string}`;
  seller: `0x${string}`;
  pool: `0x${string}`;
  mintedAt: bigint;
  transferred: boolean;
}

// User Stats
export interface UserStats {
  totalSpent: bigint;
  totalEarned: bigint;
  createdPoolsCount: number;
  joinedPoolsCount: number;
  ownedTokensCount: number;
  createdTokensCount: number;
}

// Pool Status
export interface PoolStatus {
  remaining: bigint;
  spent: bigint;
  dataCollected: bigint;
  active: boolean;
}

// Frontend-specific types
export interface PoolData extends PoolInfo {
  address: `0x${string}`;
  status: PoolStatus;
  joinedSellers: `0x${string}`[];
  verifiedSellers: `0x${string}`[];
}

export interface UserData {
  address: `0x${string}`;
  userContractAddress: `0x${string}`;
  stats: UserStats;
  createdPools: `0x${string}`[];
  joinedPools: `0x${string}`[];
  ownedTokens: bigint[];
  createdTokens: bigint[];
}
