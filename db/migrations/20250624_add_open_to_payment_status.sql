-- Agrega el valor 'open' al enum payment_status en PostgreSQL
ALTER TYPE payment_status ADD VALUE IF NOT EXISTS 'open';
