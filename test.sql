DO $$
DECLARE
  new_user_id uuid := gen_random_uuid();
  trip_a_id uuid;
  trip_b_id uuid;
  trip_c_id uuid;
BEGIN
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
  VALUES (new_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sql_test_' || new_user_id || '@test.com', '', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '');

  INSERT INTO public.trips (owner_id, title, start_date, end_date) VALUES (new_user_id, 'Trip A', '2026-09-01', '2026-09-01') RETURNING id INTO trip_a_id;
  INSERT INTO public.trips (owner_id, title, start_date, end_date) VALUES (new_user_id, 'Trip B', '2026-09-10', '2026-09-12') RETURNING id INTO trip_b_id;
  INSERT INTO public.trips (owner_id, title, start_date, end_date) VALUES (new_user_id, 'Trip C', '2026-12-30', '2027-01-02') RETURNING id INTO trip_c_id;
  
  -- Create a temporary table to view results
  CREATE TEMP TABLE results AS 
  SELECT 'Trip A' as trip, day_number, day_date FROM public.trip_days WHERE trip_id = trip_a_id
  UNION ALL
  SELECT 'Trip B' as trip, day_number, day_date FROM public.trip_days WHERE trip_id = trip_b_id
  UNION ALL
  SELECT 'Trip C' as trip, day_number, day_date FROM public.trip_days WHERE trip_id = trip_c_id
  ORDER BY trip, day_number;
END $$;

SELECT * FROM results;
