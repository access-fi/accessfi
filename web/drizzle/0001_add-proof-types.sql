CREATE TABLE "data_tokens" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"token_id" varchar(78) NOT NULL,
	"seller_address" varchar(42) NOT NULL,
	"buyer_address" varchar(42) NOT NULL,
	"pool_address" varchar(42) NOT NULL,
	"encrypted_cid" text NOT NULL,
	"data_hash" varchar(66) NOT NULL,
	"minted_at" timestamp NOT NULL,
	"transferred" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "data_tokens_token_id_unique" UNIQUE("token_id")
);
--> statement-breakpoint
CREATE TABLE "proof_submissions" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"seller_address" varchar(42) NOT NULL,
	"pool_address" varchar(42) NOT NULL,
	"proof_type" text NOT NULL,
	"proof_hash" varchar(66) NOT NULL,
	"status" varchar(20) NOT NULL,
	"tx_hash" varchar(66),
	"encrypted_cid" text,
	"data_hash" varchar(66),
	"attestation" text,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "proof_types" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"kind" varchar(20) NOT NULL,
	"blueprint_id" text,
	"is_public" boolean DEFAULT true NOT NULL,
	"created_by" varchar(42) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
