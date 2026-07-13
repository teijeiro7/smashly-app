CREATE OR REPLACE FUNCTION increment_store_counter(store_id uuid, col text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE format('UPDATE stores SET %I = COALESCE(%I, 0) + 1 WHERE id = $1', col, col) USING store_id;
END;
$$;
