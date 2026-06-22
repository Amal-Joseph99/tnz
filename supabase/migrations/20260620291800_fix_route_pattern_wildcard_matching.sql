-- Fix path_matches_route_pattern so middle wildcards (e.g. /seller/products/*/edit/step/*)
-- match numeric product ids instead of treating * as a literal character.

CREATE OR REPLACE FUNCTION public.path_matches_route_pattern(p_path TEXT, p_pattern TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_path_parts TEXT[];
  v_pattern_parts TEXT[];
  v_prefix TEXT;
  i INT;
BEGIN
  IF p_pattern IS NULL OR p_path IS NULL THEN
    RETURN false;
  END IF;

  p_path := trim(both '/' from p_path);
  p_pattern := trim(both '/' from p_pattern);

  IF p_pattern = '' THEN
    RETURN p_path = '';
  END IF;

  -- Prefix match only when the sole wildcard is the trailing /*
  IF right(p_pattern, 2) = '/*'
     AND position('*' in left(p_pattern, greatest(length(p_pattern) - 2, 0))) = 0 THEN
    v_prefix := trim(trailing '/' from left(p_pattern, length(p_pattern) - 2));
    IF v_prefix = '' THEN
      RETURN true;
    END IF;
    RETURN p_path = v_prefix OR p_path LIKE v_prefix || '/%';
  END IF;

  IF position('*' in p_pattern) = 0 THEN
    RETURN p_path = p_pattern;
  END IF;

  v_path_parts := string_to_array(p_path, '/');
  v_pattern_parts := string_to_array(p_pattern, '/');

  IF array_length(v_pattern_parts, 1) IS DISTINCT FROM array_length(v_path_parts, 1) THEN
    RETURN false;
  END IF;

  FOR i IN 1..array_length(v_pattern_parts, 1) LOOP
    IF v_pattern_parts[i] = '*' THEN
      CONTINUE;
    END IF;
    IF v_pattern_parts[i] <> v_path_parts[i] THEN
      RETURN false;
    END IF;
  END LOOP;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.path_matches_route_pattern(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.path_matches_route_pattern(TEXT, TEXT) TO anon, authenticated;
