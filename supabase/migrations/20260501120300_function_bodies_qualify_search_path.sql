-- ============================================================
-- Re-define functions whose bodies referenced unqualified names.
-- With search_path='' enforced earlier, every reference must be
-- schema-qualified or the function fails at runtime.
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_lead_quality_score()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $function$
BEGIN
  NEW.lead_quality_score := public.calculate_lead_quality_score(
    NEW.is_premium,
    NEW.follower_count,
    NEW.connections_count,
    pg_catalog.length(pg_catalog.btrim(NEW.current_company)) > 0,
    pg_catalog.array_length(NEW.top_skills, 1)
  );
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = pg_catalog.now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = pg_catalog.now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at := pg_catalog.now();
  RETURN NEW;
END;
$function$;
