-- Không hồi sinh đích đã hết hiệu lực theo chính sách0018 tại thời điểm chuyển đổi.
DELETE FROM "push_subscriptions" p WHERE NOT EXISTS (
  SELECT 1 FROM "sessions" s JOIN "accounts" a ON a.id=s.account_id
  WHERE s.id=p.session_id AND s.account_id=p.account_id AND s.expires_at>now()
    AND a.family_id=p.family_id
);
--> statement-breakpoint
ALTER TABLE "push_subscriptions" DROP CONSTRAINT "push_subscriptions_session_account_fk";
--> statement-breakpoint
ALTER TABLE "push_subscriptions" DROP CONSTRAINT "push_subscriptions_session_unique";
--> statement-breakpoint
ALTER TABLE "push_subscriptions" RENAME COLUMN "session_id" TO "last_session_id";
--> statement-breakpoint
ALTER TABLE "push_subscriptions" ALTER COLUMN "last_session_id" DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE "push_subscriptions" ADD COLUMN "authorized_at" timestamp with time zone;
--> statement-breakpoint
UPDATE "push_subscriptions" p SET authorized_at=s.created_at FROM "sessions" s WHERE s.id=p.last_session_id;
--> statement-breakpoint
ALTER TABLE "push_subscriptions" ALTER COLUMN "authorized_at" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_last_session_id_sessions_id_fk"
  FOREIGN KEY ("last_session_id") REFERENCES "public"."sessions"("id") ON DELETE set null ON UPDATE no action;
