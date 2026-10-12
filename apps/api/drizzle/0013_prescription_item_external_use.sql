ALTER TABLE "medication_courses" DROP CONSTRAINT "medication_courses_quantity_positive";--> statement-breakpoint
ALTER TABLE "prescription_items" DROP CONSTRAINT "prescription_items_quantity_positive";--> statement-breakpoint
ALTER TABLE "medication_courses" ALTER COLUMN "quantity_per_dose" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "prescription_items" ALTER COLUMN "quantity_per_dose" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "prescription_items" ADD COLUMN "external_use" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "medication_courses" ADD CONSTRAINT "medication_courses_quantity_valid" CHECK (CASE WHEN "medication_courses"."quantity_per_dose" IS NULL THEN "medication_courses"."source" = 'prescription' ELSE "medication_courses"."quantity_per_dose" > 0 END);--> statement-breakpoint
ALTER TABLE "prescription_items" ADD CONSTRAINT "prescription_items_quantity_valid" CHECK (CASE WHEN "prescription_items"."quantity_per_dose" IS NULL THEN "prescription_items"."external_use" ELSE "prescription_items"."quantity_per_dose" > 0 END);