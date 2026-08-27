CREATE TABLE "bfp_corner_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"youtube_url" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "bfp_corner_entries_sort_order_idx" ON "bfp_corner_entries" USING btree ("sort_order");