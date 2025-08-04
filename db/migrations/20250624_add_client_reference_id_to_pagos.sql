-- Migración para agregar la columna client_reference_id a la tabla pagos
ALTER TABLE public.pagos ADD COLUMN client_reference_id text;

