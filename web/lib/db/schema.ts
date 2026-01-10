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
