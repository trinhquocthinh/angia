-- BR-002: hồ sơ sức khỏe không bao giờ đổi nhóm gia đình (ERD §2 — trigger chặn UPDATE cột family_id).
CREATE FUNCTION "health_profiles_family_immutable"() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.family_id IS DISTINCT FROM OLD.family_id THEN
    RAISE EXCEPTION 'BR-002: health_profiles.family_id is immutable' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER "health_profiles_family_immutable"
  BEFORE UPDATE OF "family_id" ON "health_profiles"
  FOR EACH ROW EXECUTE FUNCTION "health_profiles_family_immutable"();
