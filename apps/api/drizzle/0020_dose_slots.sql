CREATE TABLE "dose_slots" (
	"health_profile_id" uuid NOT NULL,
	"family_id" uuid NOT NULL,
	"slot" text NOT NULL,
	"time_of_day" time(0) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "dose_slots_pk" PRIMARY KEY("health_profile_id","slot"),
	CONSTRAINT "dose_slots_slot_valid" CHECK ("dose_slots"."slot" IN ('morning', 'noon', 'afternoon', 'evening')),
	CONSTRAINT "dose_slots_whole_minute" CHECK (extract(second from "dose_slots"."time_of_day") = 0)
);
--> statement-breakpoint
ALTER TABLE "dose_slots" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "dose_slots" ADD CONSTRAINT "dose_slots_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dose_slots" ADD CONSTRAINT "dose_slots_profile_family_fk" FOREIGN KEY ("health_profile_id","family_id") REFERENCES "public"."health_profiles"("id","family_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "family_isolation_policy" ON "dose_slots" AS PERMISSIVE FOR ALL TO public USING (family_id = NULLIF(current_setting('app.family_id', true), '')::uuid);