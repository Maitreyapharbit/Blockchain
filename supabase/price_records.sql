-- Supabase SQL migration: price_records table
CREATE TABLE IF NOT EXISTS public.price_records (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id text NOT NULL,
  seller_id text NOT NULL,
  price numeric NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  effective_at timestamptz NOT NULL DEFAULT now(),
  actor_id text,
  notes text,
  file_hash text,
  file_url text,
  tx_hash text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_price_records_product ON public.price_records(product_id);
CREATE INDEX IF NOT EXISTS idx_price_records_seller ON public.price_records(seller_id);
CREATE INDEX IF NOT EXISTS idx_price_records_effective_at ON public.price_records(effective_at);
