-- Crear tabla para almacenar información detallada de cuentas Stripe
CREATE TABLE IF NOT EXISTS stripe_accounts (
  id SERIAL PRIMARY KEY,
  agencia_id INTEGER NOT NULL REFERENCES agencias(id) ON DELETE CASCADE,
  stripe_account_id VARCHAR(255) NOT NULL UNIQUE,
  account_status VARCHAR(50) NOT NULL DEFAULT 'pending',
  country VARCHAR(2) NOT NULL,
  business_type VARCHAR(50),
  charges_enabled BOOLEAN DEFAULT FALSE,
  payouts_enabled BOOLEAN DEFAULT FALSE,
  external_account_last4 VARCHAR(4),
  external_account_bank_name VARCHAR(100),
  external_account_currency VARCHAR(3),
  requirements_currently_due JSONB,
  requirements_eventually_due JSONB,
  requirements_past_due JSONB,
  requirements_disabled_reason VARCHAR(255),
  representative_person_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_sync_at TIMESTAMP WITH TIME ZONE
);

-- Crear índices para mejorar el rendimiento de consultas comunes
CREATE INDEX idx_stripe_accounts_agencia_id ON stripe_accounts(agencia_id);
CREATE INDEX idx_stripe_accounts_stripe_account_id ON stripe_accounts(stripe_account_id);
CREATE INDEX idx_stripe_accounts_account_status ON stripe_accounts(account_status);


