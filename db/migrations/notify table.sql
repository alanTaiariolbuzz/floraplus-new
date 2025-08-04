CREATE TABLE notificaciones_enviadas (
  id               SERIAL PRIMARY KEY,
  entidad_tipo     VARCHAR(32) NOT NULL DEFAULT 'reserva',          -- p.e.  reserva, pago, turno…
  entidad_id       INTEGER NULL,                                    -- FK opcional
  tipo_aviso       VARCHAR(32) NOT NULL,                            -- recordatorio_24h, recordatorio_48h…
  enviado_en       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  extra_data       JSONB NULL,                                      -- datos libres (por si acaso)

  -- FK condicional: solo se aplica cuando entidad_tipo = 'reserva'
  CONSTRAINT fk_reserva
    FOREIGN KEY (entidad_id)
    REFERENCES reservas(id)
    DEFERRABLE INITIALLY DEFERRED
);

-- Evita duplicados **solo** si es sobre la misma entidad+tipo.
-- Si entidad_id está NULL no se aplica la unicidad (permite avisos globales).
CREATE UNIQUE INDEX unq_aviso_reserva
  ON notificaciones_enviadas (entidad_tipo, entidad_id, tipo_aviso)
  WHERE entidad_id IS NOT NULL;