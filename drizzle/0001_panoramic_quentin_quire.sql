ALTER TABLE "icons" ADD COLUMN "svg" text NOT NULL;--> statement-breakpoint
ALTER TABLE "icons" ADD COLUMN "is_premium" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "icons" ADD COLUMN "tags" text[] DEFAULT '{}' NOT NULL;