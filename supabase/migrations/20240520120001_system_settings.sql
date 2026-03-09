/*
  # Add System Settings and Markets Tables
  Creates tables to store global scanner configurations and active markets, replacing local storage.

  ## Query Description:
  This operation creates two new tables: `system_settings` (singleton for global configs like scan intervals) and `markets` (to control which betting markets are scanned). It also inserts default data. No existing data is modified or deleted.
  
  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true
  
  ## Structure Details:
  - New table `system_settings` (id, scan_interval_seconds, min_roi, deep_scan)
  - New table `markets` (key, title, description, active)
  
  ## Security Implications:
  - RLS Status: Enabled on both tables
  - Policy Changes: Read/Write access granted to authenticated users
*/

-- Create System Settings Table
CREATE TABLE IF NOT EXISTS public.system_settings (
    id integer PRIMARY KEY DEFAULT 1,
    scan_interval_seconds integer NOT NULL DEFAULT 600,
    min_roi numeric NOT NULL DEFAULT 1.0,
    deep_scan boolean NOT NULL DEFAULT true,
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT single_row CHECK (id = 1)
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read system settings"
    ON public.system_settings FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can update system settings"
    ON public.system_settings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can insert system settings"
    ON public.system_settings FOR INSERT TO authenticated WITH CHECK (true);

-- Insert default settings
INSERT INTO public.system_settings (id, scan_interval_seconds, min_roi, deep_scan)
VALUES (1, 600, 1.0, true)
ON CONFLICT (id) DO NOTHING;

-- Create Markets Table
CREATE TABLE IF NOT EXISTS public.markets (
    key text PRIMARY KEY,
    title text NOT NULL,
    description text,
    active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.markets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read markets"
    ON public.markets FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can update markets"
    ON public.markets FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can insert markets"
    ON public.markets FOR INSERT TO authenticated WITH CHECK (true);

-- Insert default markets
INSERT INTO public.markets (key, title, description, active)
VALUES 
    ('h2h', 'Vencedor da Partida (1X2 / Moneyline)', 'O mercado mais tradicional. Quem vence o jogo.', true),
    ('totals', 'Mais/Menos Gols e Pontos (Over/Under)', 'Total de gols, pontos ou sets na partida.', true),
    ('spreads', 'Handicap Asiático e Europeu', 'Vantagens ou desvantagens de pontos/gols.', true),
    ('btts', 'Ambas as Equipes Marcam (BTTS)', 'Mercado focado em futebol.', true),
    ('draw_no_bet', 'Empate Anula Aposta (DNB)', 'Se empatar, a aposta é devolvida.', true),
    ('player_props', 'Mercados de Jogadores', 'Gols, assistências ou pontos de um jogador específico.', false)
ON CONFLICT (key) DO NOTHING;
