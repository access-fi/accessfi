CREATE TYPE "public"."asset_source" AS ENUM('direct', 'pool_fulfillment', 'external');--> statement-breakpoint
CREATE TYPE "public"."verification_status" AS ENUM('pending', 'verified', 'expired', 'revoked', 'failed');--> statement-breakpoint
CREATE TYPE "public"."resale_policy" AS ENUM('exclusive', 'limited_resale', 'open_resale');--> statement-breakpoint
CREATE TYPE "public"."listing_status" AS ENUM('draft', 'listed', 'paused', 'sold_out', 'archived');--> statement-breakpoint
CREATE TYPE "public"."access_grant_status" AS ENUM('active', 'revoked', 'expired');--> statement-breakpoint
CREATE TYPE "public"."provider_type" AS ENUM('zkemail', 'reclaim', 'custom', 'external');--> statement-breakpoint

ALTER TABLE "proof_submissions" ADD COLUMN "asset_id" varchar(90);--> statement-breakpoint
ALTER TABLE "proof_submissions" ALTER COLUMN "pool_address" DROP NOT NULL;--> statement-breakpoint

CREATE TABLE "global_assets" (
  "asset_id" varchar(90) PRIMARY KEY NOT NULL,
  "seller_address" varchar(42) NOT NULL,
  "source_type" "asset_source" NOT NULL,
  "category" text NOT NULL,
  "subtype" text,
  "proof_type_id" varchar(90) NOT NULL,
  "encrypted_ref" text NOT NULL,
  "encrypted_cid" text NOT NULL,
  "data_hash" varchar(66) NOT NULL,
  "searchable_attributes" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "verification_status" "verification_status" DEFAULT 'pending' NOT NULL,
  "verified_at" timestamp,
  "expires_at" timestamp,
  "resale_policy" "resale_policy" DEFAULT 'exclusive' NOT NULL,
  "listing_status" "listing_status" DEFAULT 'draft' NOT NULL,
  "base_price" text NOT NULL,
  "proof_statement" text,
  "pool_address" varchar(42),
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint

CREATE TABLE "asset_verifications" (
  "id" varchar(36) PRIMARY KEY NOT NULL,
  "asset_id" varchar(90) NOT NULL,
  "provider_type" "provider_type" NOT NULL,
  "proof_hash" varchar(66) NOT NULL,
  "aggregation_id" varchar(78),
  "domain_id" varchar(78),
  "verification_tx_hash" varchar(66),
  "verified_at" timestamp,
  "expires_at" timestamp,
  "status" "verification_status" DEFAULT 'pending' NOT NULL,
  "metadata" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint

CREATE TABLE "asset_access_grants" (
  "id" varchar(36) PRIMARY KEY NOT NULL,
  "asset_id" varchar(90) NOT NULL,
  "buyer_address" varchar(42) NOT NULL,
  "purchase_id" varchar(36) NOT NULL,
  "granted_at" timestamp DEFAULT now() NOT NULL,
  "revoked_at" timestamp,
  "status" "access_grant_status" DEFAULT 'active' NOT NULL
);--> statement-breakpoint

CREATE TABLE "asset_purchases" (
  "purchase_id" varchar(36) PRIMARY KEY NOT NULL,
  "asset_id" varchar(90) NOT NULL,
  "buyer_address" varchar(42) NOT NULL,
  "seller_address" varchar(42) NOT NULL,
  "gross_amount" text NOT NULL,
  "platform_fee" text NOT NULL,
  "seller_payout" text NOT NULL,
  "tx_hash" varchar(66),
  "purchased_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint

CREATE TABLE "pool_asset_links" (
  "id" varchar(36) PRIMARY KEY NOT NULL,
  "pool_address" varchar(42) NOT NULL,
  "seller_address" varchar(42) NOT NULL,
  "asset_id" varchar(90) NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint

CREATE UNIQUE INDEX "global_assets_seller_asset_idx" ON "global_assets" USING btree ("seller_address","asset_id");--> statement-breakpoint
CREATE UNIQUE INDEX "asset_access_grants_asset_buyer_idx" ON "asset_access_grants" USING btree ("asset_id","buyer_address");
