import { keccak256, toBytes } from 'viem';
import type { ProofTypeId } from './contracts/types';

export type ProofTypeRecord = {
  id: string;
  title: string;
  description: string;
  kind: 'zkemail' | 'reclaim' | 'custom';
  blueprintId?: string | null;
  isPublic: boolean;
  createdBy: `0x${string}`;
};

export function toProofTypeId(id: string): ProofTypeId {
  return keccak256(toBytes(id)) as ProofTypeId;
}
