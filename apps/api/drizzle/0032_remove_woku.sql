-- CP5.6: bỏ Woku. Cấu hình chỉ giữ cặp model OpenRouter đang lưu; lịch sử ai_routing_audit giữ nguyên.
UPDATE "ai_routing_settings" SET "settings" = jsonb_build_object('openrouter', "settings" -> 'openrouter')
WHERE "settings" ? 'woku' OR "settings" ? 'selectedProvider';--> statement-breakpoint
-- Xóa phí và nguồn Woku (dữ liệu thử) trước khi siết CHECK provider.
DELETE FROM "ai_provider_charges" WHERE "source_id" IN (SELECT "id" FROM "ai_billing_sources" WHERE "provider" = 'woku');--> statement-breakpoint
DELETE FROM "ai_billing_sources" WHERE "provider" = 'woku';--> statement-breakpoint
ALTER TABLE "ai_billing_sources" DROP CONSTRAINT IF EXISTS "ai_billing_sources_provider_valid";--> statement-breakpoint
ALTER TABLE "ai_billing_sources" ADD CONSTRAINT "ai_billing_sources_provider_valid" CHECK ("ai_billing_sources"."provider" IN ('openrouter'));
