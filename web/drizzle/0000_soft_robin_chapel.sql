CREATE TYPE "public"."user_role" AS ENUM('buyer', 'seller', 'both');--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"wallet_address" varchar(42) PRIMARY KEY NOT NULL,
	"user_contract_address" varchar(42),
	"full_name" text NOT NULL,
	"role" "user_role" NOT NULL,
	"data_to_sell" text,
	"data_to_buy" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"onboarding_completed" boolean DEFAULT false NOT NULL,
	CONSTRAINT "user_profiles_user_contract_address_unique" UNIQUE("user_contract_address")
);
