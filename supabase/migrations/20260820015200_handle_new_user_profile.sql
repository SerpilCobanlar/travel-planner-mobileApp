CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  normalized_username text;
BEGIN
  normalized_username :=
    NULLIF(trim(lower(new.raw_user_meta_data ->> 'username')), '');

  INSERT INTO public.profiles (
    id,
    username,
    avatar_url
  )
  VALUES (
    new.id,
    COALESCE(
      normalized_username,
      'user_' || replace(new.id::text, '-', '')
    ),
    new.raw_user_meta_data ->> 'avatar_url'
  );

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();
