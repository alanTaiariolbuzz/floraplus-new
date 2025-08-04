-- Tabla de eventos (ya existe, ampliada)
CREATE TABLE IF NOT EXISTS eventos (
  id UUID PRIMARY KEY,
  origen TEXT NOT NULL, -- 'stripe', 'internal', etc.
  tipo TEXT NOT NULL,   -- 'USER_SIGNUP', 'ORDER_PLACED', etc.
  payload JSONB NOT NULL,
  estado TEXT NOT NULL DEFAULT 'pendiente',
  intentos SMALLINT DEFAULT 0,
  procesado_en TIMESTAMP,
  recibido_en TIMESTAMP DEFAULT NOW()
);
