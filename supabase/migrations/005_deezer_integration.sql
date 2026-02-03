-- ============================================================
-- WhatsSound — Deezer Integration
-- Añadir datos de Deezer API para carátulas y previews
-- ============================================================

-- Añadir columnas de Deezer a ws_songs
ALTER TABLE ws_songs ADD COLUMN IF NOT EXISTS deezer_id INTEGER;
ALTER TABLE ws_songs ADD COLUMN IF NOT EXISTS cover_url TEXT;
ALTER TABLE ws_songs ADD COLUMN IF NOT EXISTS album_name TEXT CHECK (char_length(album_name) <= 200);

-- Actualizar external_id para ser más flexible (no solo deezer:id)
-- La columna ya existe, solo añadimos un comentario para claridad
COMMENT ON COLUMN ws_songs.external_id IS 'ID externo del track: deezer:123, spotify:abc, etc.';
COMMENT ON COLUMN ws_songs.deezer_id IS 'Deezer track ID (numérico)';
COMMENT ON COLUMN ws_songs.cover_url IS 'URL de la carátula del álbum (250x250, 500x500, 1000x1000)';
COMMENT ON COLUMN ws_songs.album_name IS 'Nombre del álbum';

-- Índice para búsquedas por deezer_id
CREATE INDEX IF NOT EXISTS idx_songs_deezer_id ON ws_songs(deezer_id);

-- Migrar datos existentes: extraer deezer_id de external_id donde sea posible
UPDATE ws_songs 
SET deezer_id = CAST(SPLIT_PART(external_id, ':', 2) AS INTEGER)
WHERE external_id LIKE 'deezer:%' 
AND deezer_id IS NULL
AND SPLIT_PART(external_id, ':', 2) ~ '^[0-9]+$';