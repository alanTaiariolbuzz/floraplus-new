ALTER TABLE eventos
  ADD COLUMN externo_id TEXT;

ALTER TABLE eventos
  ADD COLUMN agencia_id INT;

ALTER TABLE eventos
  DROP COLUMN estado;

CREATE UNIQUE INDEX IF NOT EXISTS idx_eventos_externo_id ON eventos (externo_id);
