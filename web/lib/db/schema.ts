/**
 * Database Schema for AccessFi
 * Using Drizzle ORM with Neon PostgreSQL
 */

import { pgTable, text, varchar, timestamp, boolean, pgEnum } from 'drizzle-orm/pg-core';

// User role enum
export const userRoleEnum = pgEnum('user_role', ['buyer', 'seller', 'both']);

// User profiles table
export const userProfiles = pgTable('user_profiles', {
  // Wallet address (EOA) - primary key
  walletAddress: varchar('wallet_address', { length: 42 }).primaryKey(),

  // User contract address (deployed by FactoryUser)
  userContractAddress: varchar('user_contract_address', { length: 42 }).unique(),

  // Profile information
  fullName: text('full_name').notNull(),
  role: userRoleEnum('role').notNull(),

  // Data preferences (comma-separated or JSON)
  dataToSell: text('data_to_sell'), // For sellers: "age,nationality,email"
  dataToBuy: text('data_to_buy'),   // For buyers: "age,nationality,email"

  // Metadata
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),

  // Onboarding completion
  onboardingCompleted: boolean('onboarding_completed').default(false).notNull(),
});

export type UserProfile = typeof userProfiles.$inferSelect;
export type NewUserProfile = typeof userProfiles.$inferInsert;

// Proof submissions tracking
export const proofSubmissions = pgTable('proof_submissions', {
  id: varchar('id', { length: 36 }).primaryKey(), // UUID
  sellerAddress: varchar('seller_address', { length: 42 }).notNull(),
  poolAddress: varchar('pool_address', { length: 42 }).notNull(),
  proofType: text('proof_type').notNull(), // Proof type string id (off-chain)
  proofHash: varchar('proof_hash', { length: 66 }).notNull(),
  status: varchar('status', { length: 20 }).notNull(), // 'pending', 'verified', 'failed'
  txHash: varchar('tx_hash', { length: 66 }),
  encryptedCID: text('encrypted_cid'),
  dataHash: varchar('data_hash', { length: 66 }),
  attestation: text('attestation'), // TEE attestation
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Proof types registry
export const proofTypes = pgTable('proof_types', {
  id: text('id').primaryKey(), // e.g., "zkemail:accessfi_email_v1"
  title: text('title').notNull(),
  description: text('description').notNull(),
  kind: varchar('kind', { length: 20 }).notNull(), // zkemail, reclaim, custom
  blueprintId: text('blueprint_id'), // zkEmail blueprint id
  isPublic: boolean('is_public').default(true).notNull(),
  createdBy: varchar('created_by', { length: 42 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Data tokens tracking
export const dataTokens = pgTable('data_tokens', {
  id: varchar('id', { length: 36 }).primaryKey(), // UUID
  tokenId: varchar('token_id', { length: 78 }).unique().notNull(),
  sellerAddress: varchar('seller_address', { length: 42 }).notNull(),
  buyerAddress: varchar('buyer_address', { length: 42 }).notNull(),
  poolAddress: varchar('pool_address', { length: 42 }).notNull(),
  encryptedCID: text('encrypted_cid').notNull(),
  dataHash: varchar('data_hash', { length: 66 }).notNull(),
  mintedAt: timestamp('minted_at').notNull(),
  transferred: boolean('transferred').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// TypeScript types
export type ProofSubmission = typeof proofSubmissions.$inferSelect;
export type NewProofSubmission = typeof proofSubmissions.$inferInsert;
export type DataToken = typeof dataTokens.$inferSelect;
export type NewDataToken = typeof dataTokens.$inferInsert;
export type ProofType = typeof proofTypes.$inferSelect;
export type NewProofType = typeof proofTypes.$inferInsert;
