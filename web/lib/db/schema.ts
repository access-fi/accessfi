/**
 * Database Schema for AccessFi
 * Using Drizzle ORM with Neon PostgreSQL
 */

import { pgTable, text, varchar, timestamp, boolean, pgEnum, jsonb, uniqueIndex } from 'drizzle-orm/pg-core';

// User role enum
export const userRoleEnum = pgEnum('user_role', ['buyer', 'seller', 'both']);
export const assetSourceEnum = pgEnum('asset_source', ['direct', 'pool_fulfillment', 'external']);
export const verificationStatusEnum = pgEnum('verification_status', ['pending', 'verified', 'expired', 'revoked', 'failed']);
export const resalePolicyEnum = pgEnum('resale_policy', ['exclusive', 'limited_resale', 'open_resale']);
export const listingStatusEnum = pgEnum('listing_status', ['draft', 'listed', 'paused', 'sold_out', 'archived']);
export const accessGrantStatusEnum = pgEnum('access_grant_status', ['active', 'revoked', 'expired']);
export const providerTypeEnum = pgEnum('provider_type', ['zkemail', 'reclaim', 'custom', 'external']);

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
  poolAddress: varchar('pool_address', { length: 42 }),
  assetId: varchar('asset_id', { length: 90 }),
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

export const globalAssets = pgTable('global_assets', {
  assetId: varchar('asset_id', { length: 90 }).primaryKey(),
  sellerAddress: varchar('seller_address', { length: 42 }).notNull(),
  sourceType: assetSourceEnum('source_type').notNull(),
  category: text('category').notNull(),
  subtype: text('subtype'),
  proofTypeId: varchar('proof_type_id', { length: 90 }).notNull(),
  encryptedRef: text('encrypted_ref').notNull(),
  encryptedCID: text('encrypted_cid').notNull(),
  dataHash: varchar('data_hash', { length: 66 }).notNull(),
  searchableAttributes: jsonb('searchable_attributes').$type<Record<string, unknown>>().notNull().default({}),
  verificationStatus: verificationStatusEnum('verification_status').notNull().default('pending'),
  verifiedAt: timestamp('verified_at'),
  expiresAt: timestamp('expires_at'),
  resalePolicy: resalePolicyEnum('resale_policy').notNull().default('exclusive'),
  listingStatus: listingStatusEnum('listing_status').notNull().default('draft'),
  basePrice: text('base_price').notNull(),
  proofStatement: text('proof_statement'),
  poolAddress: varchar('pool_address', { length: 42 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  sellerAssetIdx: uniqueIndex('global_assets_seller_asset_idx').on(table.sellerAddress, table.assetId),
}));

export const assetVerifications = pgTable('asset_verifications', {
  id: varchar('id', { length: 36 }).primaryKey(),
  assetId: varchar('asset_id', { length: 90 }).notNull(),
  providerType: providerTypeEnum('provider_type').notNull(),
  proofHash: varchar('proof_hash', { length: 66 }).notNull(),
  aggregationId: varchar('aggregation_id', { length: 78 }),
  domainId: varchar('domain_id', { length: 78 }),
  verificationTxHash: varchar('verification_tx_hash', { length: 66 }),
  verifiedAt: timestamp('verified_at'),
  expiresAt: timestamp('expires_at'),
  status: verificationStatusEnum('status').notNull().default('pending'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const assetAccessGrants = pgTable('asset_access_grants', {
  id: varchar('id', { length: 36 }).primaryKey(),
  assetId: varchar('asset_id', { length: 90 }).notNull(),
  buyerAddress: varchar('buyer_address', { length: 42 }).notNull(),
  purchaseId: varchar('purchase_id', { length: 36 }).notNull(),
  grantedAt: timestamp('granted_at').defaultNow().notNull(),
  revokedAt: timestamp('revoked_at'),
  status: accessGrantStatusEnum('status').notNull().default('active'),
}, (table) => ({
  uniqueAccessGrant: uniqueIndex('asset_access_grants_asset_buyer_idx').on(table.assetId, table.buyerAddress),
}));

export const assetPurchases = pgTable('asset_purchases', {
  purchaseId: varchar('purchase_id', { length: 36 }).primaryKey(),
  assetId: varchar('asset_id', { length: 90 }).notNull(),
  buyerAddress: varchar('buyer_address', { length: 42 }).notNull(),
  sellerAddress: varchar('seller_address', { length: 42 }).notNull(),
  grossAmount: text('gross_amount').notNull(),
  platformFee: text('platform_fee').notNull(),
  sellerPayout: text('seller_payout').notNull(),
  txHash: varchar('tx_hash', { length: 66 }),
  purchasedAt: timestamp('purchased_at').defaultNow().notNull(),
});

export const poolAssetLinks = pgTable('pool_asset_links', {
  id: varchar('id', { length: 36 }).primaryKey(),
  poolAddress: varchar('pool_address', { length: 42 }).notNull(),
  sellerAddress: varchar('seller_address', { length: 42 }).notNull(),
  assetId: varchar('asset_id', { length: 90 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// TypeScript types
export type ProofSubmission = typeof proofSubmissions.$inferSelect;
export type NewProofSubmission = typeof proofSubmissions.$inferInsert;
export type DataToken = typeof dataTokens.$inferSelect;
export type NewDataToken = typeof dataTokens.$inferInsert;
export type GlobalAsset = typeof globalAssets.$inferSelect;
export type NewGlobalAsset = typeof globalAssets.$inferInsert;
export type AssetVerification = typeof assetVerifications.$inferSelect;
export type NewAssetVerification = typeof assetVerifications.$inferInsert;
export type AssetAccessGrant = typeof assetAccessGrants.$inferSelect;
export type NewAssetAccessGrant = typeof assetAccessGrants.$inferInsert;
export type AssetPurchase = typeof assetPurchases.$inferSelect;
export type NewAssetPurchase = typeof assetPurchases.$inferInsert;
export type PoolAssetLink = typeof poolAssetLinks.$inferSelect;
export type NewPoolAssetLink = typeof poolAssetLinks.$inferInsert;
