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
  proofType: varchar('proof_type', { length: 10 }).notNull(), // ProofType enum (0-3)
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
