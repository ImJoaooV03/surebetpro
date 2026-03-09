/*
# Add Bookmakers Table
Creates a table to manage active bookmakers dynamically.

## Query Description:
This operation adds a `bookmakers` table to allow users to toggle which betting sites are scanned, making the system scalable for future API plan upgrades.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true

## Structure Details:
Creates `bookmakers` table, adds RLS policies, and inserts default bookmakers (superbet, novibet).
*/

CREATE TABLE IF NOT EXISTS public.bookmakers (
    key text PRIMARY KEY,
    title text NOT NULL,
    active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);

-- Habilita RLS
ALTER TABLE public.bookmakers ENABLE ROW LEVEL SECURITY;

-- Políticas de Segurança
CREATE POLICY "Authenticated users can read bookmakers" ON public.bookmakers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can update bookmakers" ON public.bookmakers FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert bookmakers" ON public.bookmakers FOR INSERT TO authenticated WITH CHECK (true);

-- Insere as casas de apostas iniciais do plano Free
INSERT INTO public.bookmakers (key, title, active) VALUES
    ('superbet', 'Superbet', true),
    ('novibet', 'Novibet', true)
ON CONFLICT (key) DO NOTHING;
