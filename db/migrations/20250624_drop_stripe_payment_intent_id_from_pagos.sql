-- Elimina la columna stripe_payment_intent_id de la tabla pagos
ALTER TABLE public.pagos DROP COLUMN IF EXISTS stripe_payment_intent_id;
