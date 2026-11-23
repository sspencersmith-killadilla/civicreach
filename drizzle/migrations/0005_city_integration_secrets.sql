CREATE TABLE public.city_integration_secrets (
  city_id uuid PRIMARY KEY REFERENCES public.cities(id) ON DELETE CASCADE,
  secrets jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.city_integration_secrets TO service_role;
ALTER TABLE public.city_integration_secrets ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.set_city_integration_secret(_key text, _value text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _city uuid := public.current_city_id();
BEGIN
  IF _city IS NULL OR public.staff_role(auth.uid()) IS DISTINCT FROM 'supervisor' THEN RAISE EXCEPTION 'Supervisor access required'; END IF;
  IF _key NOT IN ('resend_api_key','twilio_account_sid','twilio_auth_token') THEN RAISE EXCEPTION 'Unknown key'; END IF;
  INSERT INTO public.city_integration_secrets(city_id) VALUES (_city) ON CONFLICT DO NOTHING;
  UPDATE public.city_integration_secrets
    SET secrets = CASE WHEN coalesce(_value,'') = '' THEN secrets - _key ELSE secrets || jsonb_build_object(_key, _value) END,
        updated_at = now()
    WHERE city_id = _city;
  INSERT INTO public.audit_log(city_id, actor_id, action, details)
    VALUES (_city, auth.uid(), CASE WHEN coalesce(_value,'')='' THEN 'integration.key_cleared' ELSE 'integration.key_saved' END, jsonb_build_object('key', _key));
END $$;

CREATE OR REPLACE FUNCTION public.city_integration_status()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT coalesce((SELECT jsonb_object_agg(k, true) FROM public.city_integration_secrets s, jsonb_object_keys(s.secrets) k
    WHERE s.city_id = public.current_city_id() AND public.staff_role(auth.uid()) = 'supervisor'), '{}'::jsonb)
$$;
REVOKE ALL ON FUNCTION public.set_city_integration_secret(text,text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.city_integration_status() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_city_integration_secret(text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.city_integration_status() TO authenticated;