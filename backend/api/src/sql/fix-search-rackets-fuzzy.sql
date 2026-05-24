-- Fix search_rackets_fuzzy: correct column types from real schema.
-- view_count computed from racket_views (not a column in rackets).

DROP FUNCTION IF EXISTS search_rackets_fuzzy(text,text,text,text,text,text,text,text,text,boolean,boolean,boolean,integer,integer);

CREATE OR REPLACE FUNCTION search_rackets_fuzzy(
  search_query TEXT,
  filter_brand TEXT DEFAULT NULL,
  filter_shape TEXT DEFAULT NULL,
  filter_balance TEXT DEFAULT NULL,
  filter_core TEXT DEFAULT NULL,
  filter_face TEXT DEFAULT NULL,
  filter_game_level TEXT DEFAULT NULL,
  filter_game_type TEXT DEFAULT NULL,
  filter_hardness TEXT DEFAULT NULL,
  filter_available_only BOOLEAN DEFAULT FALSE,
  filter_on_offer BOOLEAN DEFAULT FALSE,
  filter_most_viewed BOOLEAN DEFAULT FALSE,
  result_limit INT DEFAULT 50,
  result_offset INT DEFAULT 0
)
RETURNS TABLE(
  id BIGINT,
  name TEXT,
  brand TEXT,
  model TEXT,
  similarity_score REAL,
  characteristics_brand TEXT,
  characteristics_shape TEXT,
  characteristics_balance TEXT,
  characteristics_core TEXT,
  characteristics_face TEXT,
  characteristics_format TEXT,
  characteristics_hardness TEXT,
  characteristics_game_level TEXT,
  characteristics_finish TEXT,
  characteristics_surface TEXT,
  characteristics_game_type TEXT,
  characteristics_player_collection TEXT,
  characteristics_player TEXT,
  characteristics_color TEXT,
  characteristics_color_2 TEXT,
  characteristics_product TEXT,
  specs JSONB,
  images JSONB,
  description TEXT,
  on_offer BOOLEAN,
  comparison_only BOOLEAN,
  view_count INT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  padelnuestro_actual_price NUMERIC,
  padelnuestro_original_price NUMERIC,
  padelnuestro_discount_percentage INTEGER,
  padelnuestro_link TEXT,
  padelmarket_actual_price NUMERIC,
  padelmarket_original_price NUMERIC,
  padelmarket_discount_percentage INTEGER,
  padelmarket_link TEXT,
  padelproshop_actual_price NUMERIC,
  padelproshop_original_price NUMERIC,
  padelproshop_discount_percentage INTEGER,
  padelproshop_link TEXT,
  radar_potencia NUMERIC,
  radar_control NUMERIC,
  radar_manejabilidad NUMERIC,
  radar_punto_dulce NUMERIC,
  radar_salida_bola NUMERIC,
  slug TEXT,
  discontinued BOOLEAN,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id,
    r.name,
    r.brand,
    r.model,
    similarity(r.search_document, search_query)::REAL AS similarity_score,
    r.characteristics_brand,
    r.characteristics_shape,
    r.characteristics_balance,
    r.characteristics_core,
    r.characteristics_face,
    r.characteristics_format,
    r.characteristics_hardness,
    r.characteristics_game_level,
    r.characteristics_finish,
    r.characteristics_surface,
    r.characteristics_game_type,
    r.characteristics_player_collection,
    r.characteristics_player,
    r.characteristics_color,
    r.characteristics_color_2,
    r.characteristics_product,
    r.specs,
    r.images,
    r.description,
    r.on_offer,
    r.comparison_only,
    COALESCE((SELECT COUNT(*)::INT FROM racket_views rv WHERE rv.racket_id = r.id), 0) AS view_count,
    r.created_at,
    r.updated_at,
    r.padelnuestro_actual_price,
    r.padelnuestro_original_price,
    r.padelnuestro_discount_percentage,
    r.padelnuestro_link,
    r.padelmarket_actual_price,
    r.padelmarket_original_price,
    r.padelmarket_discount_percentage,
    r.padelmarket_link,
    r.padelproshop_actual_price,
    r.padelproshop_original_price,
    r.padelproshop_discount_percentage,
    r.padelproshop_link,
    r.radar_potencia,
    r.radar_control,
    r.radar_manejabilidad,
    r.radar_punto_dulce,
    r.radar_salida_bola,
    r.slug,
    r.discontinued,
    r.status
  FROM rackets r
  WHERE
    similarity(r.search_document, search_query) > 0.1
    AND (filter_brand IS NULL OR r.brand = filter_brand)
    AND (filter_shape IS NULL OR r.characteristics_shape = filter_shape)
    AND (filter_balance IS NULL OR r.characteristics_balance = filter_balance)
    AND (filter_core IS NULL OR r.characteristics_core = filter_core)
    AND (filter_face IS NULL OR r.characteristics_face = filter_face)
    AND (filter_game_level IS NULL OR r.characteristics_game_level = filter_game_level)
    AND (filter_game_type IS NULL OR r.characteristics_game_type = filter_game_type)
    AND (filter_hardness IS NULL OR r.characteristics_hardness = filter_hardness)
    AND (filter_available_only = FALSE OR r.comparison_only = FALSE)
    AND (filter_on_offer = FALSE OR r.on_offer = TRUE)
  ORDER BY
    similarity_score DESC,
    COALESCE((SELECT COUNT(*)::INT FROM racket_views rv WHERE rv.racket_id = r.id), 0) DESC NULLS LAST
  LIMIT result_limit
  OFFSET result_offset;
END;
$$ LANGUAGE plpgsql;
