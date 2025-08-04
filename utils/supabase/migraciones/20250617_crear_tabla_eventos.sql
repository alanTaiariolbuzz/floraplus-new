CREATE TABLE IF NOT EXISTS eventos (
  id           TEXT PRIMARY KEY,
  origen       TEXT NOT NULL,
  tipo         TEXT NOT NULL,
  payload      JSONB NOT NULL,
  estado       TEXT DEFAULT 'pendiente',
  intentos     INT  DEFAULT 0,
  recibido_en  TIMESTAMPTZ DEFAULT now(),
  procesado_en TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_eventos_estado_recibido ON eventos (estado, recibido_en);
ALTER TABLE eventos ENABLE ROW LEVEL SECURITY;
