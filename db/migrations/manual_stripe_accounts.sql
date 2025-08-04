-- Migración manual: tabla stripe_accounts
-- Puedes copiar y ejecutar este SQL en Supabase si necesitas crear la tabla manualmente

create table if not exists public.stripe_accounts (
  id serial not null,
  agencia_id integer not null,
  stripe_account_id character varying(255) not null,
  account_status character varying(50) not null default 'pending'::character varying,
  country character varying(2) not null,
  business_type character varying(50) null,
  charges_enabled boolean null default false,
  payouts_enabled boolean null default false,
  external_account_last4 character varying(4) null,
  external_account_bank_name character varying(100) null,
  external_account_currency character varying(3) null,
  requirements_currently_due jsonb null,
  requirements_eventually_due jsonb null,
  requirements_past_due jsonb null,
  requirements_disabled_reason character varying(255) null,
  representative_person_id character varying(255) null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  last_sync_at timestamp with time zone null,
  constraint stripe_accounts_pkey primary key (id),
  constraint stripe_accounts_stripe_account_id_key unique (stripe_account_id),
  constraint stripe_accounts_agencia_id_fkey foreign KEY (agencia_id) references agencias (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_stripe_accounts_agencia_id on public.stripe_accounts using btree (agencia_id) TABLESPACE pg_default;
create index IF not exists idx_stripe_accounts_stripe_account_id on public.stripe_accounts using btree (stripe_account_id) TABLESPACE pg_default;
create index IF not exists idx_stripe_accounts_account_status on public.stripe_accounts using btree (account_status) TABLESPACE pg_default;
