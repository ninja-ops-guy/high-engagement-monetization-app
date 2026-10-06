CREATE TABLE "hook_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"hook" text NOT NULL,
	"weight" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "player_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"item_key" text NOT NULL,
	"count" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "players" (
	"id" serial PRIMARY KEY NOT NULL,
	"token" text NOT NULL,
	"name" text NOT NULL,
	"avatar" text DEFAULT '🦝' NOT NULL,
	"gems" integer DEFAULT 300 NOT NULL,
	"coins" integer DEFAULT 250 NOT NULL,
	"dust" integer DEFAULT 0 NOT NULL,
	"keys" integer DEFAULT 3 NOT NULL,
	"energy" integer DEFAULT 20 NOT NULL,
	"energy_updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"streak_days" integer DEFAULT 0 NOT NULL,
	"best_streak" integer DEFAULT 0 NOT NULL,
	"last_daily_claim_at" timestamp with time zone,
	"shields_used" integer DEFAULT 0 NOT NULL,
	"streak_shields" integer DEFAULT 1 NOT NULL,
	"level" integer DEFAULT 1 NOT NULL,
	"xp" integer DEFAULT 0 NOT NULL,
	"pass_xp" integer DEFAULT 0 NOT NULL,
	"premium_pass" boolean DEFAULT false NOT NULL,
	"pass_claimed" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"jackpot_charge" integer DEFAULT 0 NOT NULL,
	"spent_cents" integer DEFAULT 0 NOT NULL,
	"purchase_count" integer DEFAULT 0 NOT NULL,
	"first_purchase_bonus_used" boolean DEFAULT false NOT NULL,
	"offer_key" text,
	"offer_expires_at" timestamp with time zone,
	"crates_opened" integer DEFAULT 0 NOT NULL,
	"mythics_pulled" integer DEFAULT 0 NOT NULL,
	"legendaries_pulled" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pulls" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"player_name" text NOT NULL,
	"item_key" text NOT NULL,
	"crate_key" text NOT NULL,
	"rarity" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "purchases" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"pack_key" text NOT NULL,
	"price_cents" integer NOT NULL,
	"gems" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "set_claims" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"set_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "hook_events" ADD CONSTRAINT "hook_events_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_items" ADD CONSTRAINT "player_items_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pulls" ADD CONSTRAINT "pulls_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "set_claims" ADD CONSTRAINT "set_claims_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "hook_events_player_idx" ON "hook_events" USING btree ("player_id","hook");--> statement-breakpoint
CREATE UNIQUE INDEX "player_items_unique_idx" ON "player_items" USING btree ("player_id","item_key");--> statement-breakpoint
CREATE UNIQUE INDEX "players_token_idx" ON "players" USING btree ("token");--> statement-breakpoint
CREATE INDEX "pulls_created_idx" ON "pulls" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "set_claims_unique_idx" ON "set_claims" USING btree ("player_id","set_key");