CREATE TABLE "ai_routing_audit" (
	"version" bigint PRIMARY KEY NOT NULL,
	"settings" jsonb NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"updated_by" uuid NOT NULL,
	CONSTRAINT "ai_routing_audit_version_valid" CHECK ("ai_routing_audit"."version" > 0 AND "ai_routing_audit"."version" <= 9007199254740991),
	CONSTRAINT "ai_routing_audit_payload_object" CHECK (jsonb_typeof("ai_routing_audit"."settings") = 'object')
);
--> statement-breakpoint
CREATE TABLE "ai_routing_settings" (
	"id" smallint PRIMARY KEY NOT NULL,
	"version" bigint NOT NULL,
	"settings" jsonb NOT NULL,
	"updated_at" timestamp with time zone,
	"updated_by" uuid,
	CONSTRAINT "ai_routing_settings_singleton" CHECK ("ai_routing_settings"."id" = 1),
	CONSTRAINT "ai_routing_settings_version_valid" CHECK ("ai_routing_settings"."version" >= 0 AND "ai_routing_settings"."version" <= 9007199254740991),
	CONSTRAINT "ai_routing_settings_payload_object" CHECK (jsonb_typeof("ai_routing_settings"."settings") = 'object'),
	CONSTRAINT "ai_routing_settings_metadata_valid" CHECK (("ai_routing_settings"."version" = 0 AND "ai_routing_settings"."updated_at" IS NULL AND "ai_routing_settings"."updated_by" IS NULL) OR ("ai_routing_settings"."version" > 0 AND "ai_routing_settings"."updated_at" IS NOT NULL AND "ai_routing_settings"."updated_by" IS NOT NULL))
);
--> statement-breakpoint
ALTER TABLE "ai_routing_audit" ADD CONSTRAINT "ai_routing_audit_updated_by_accounts_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_routing_settings" ADD CONSTRAINT "ai_routing_settings_updated_by_accounts_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
INSERT INTO "ai_routing_settings" ("id", "version", "settings", "updated_at", "updated_by")
VALUES (1, 0, '{"selectedProvider":"woku","woku":{"primaryModel":"gemini-3-flash-preview","fallbackModel":"gemini-3.8-flash","usdPerCredit":null},"openrouter":{"primaryModel":"google/gemini-3.1-flash-lite","fallbackModel":"moonshotai/kimi-k2.6"}}'::jsonb, NULL, NULL);
