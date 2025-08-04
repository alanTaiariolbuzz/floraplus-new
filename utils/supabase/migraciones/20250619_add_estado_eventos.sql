ALTER TABLE eventos
  ADD COLUMN estado TEXT DEFAULT 'pendiente';

CREATE INDEX IF NOT EXISTS idx_eventos_estado_recibido ON eventos (estado, recibido_en);

ALTER TABLE eventos ENABLE ROW LEVEL SECURITY;

CREATE POLICY solo_service_role
  ON eventos
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
