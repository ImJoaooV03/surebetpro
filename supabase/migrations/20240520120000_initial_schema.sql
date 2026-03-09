/*
# Initial Database Schema for SurebetPro
Criação da estrutura de banco de dados para a plataforma de arbitragem de apostas.

## Query Description:
Esta operação cria as tabelas principais do sistema no schema `public`, incluindo perfis de usuários, esportes, eventos, oportunidades de surebet e logs da API. Também configura as políticas de segurança (RLS) e os gatilhos (triggers) para criação automática de perfis após o registro do usuário. Nenhuma exclusão de dados existentes ocorrerá.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Medium"
- Requires-Backup: false
- Reversible: true

## Structure Details:
- public.profiles (Extensão da tabela auth.users)
- public.sports (Esportes rastreados)
- public.events (Eventos esportivos)
- public.surebet_opportunities (Oportunidades de arbitragem detectadas)
- public.surebet_legs (As apostas individuais que compõem uma surebet)
- public.api_logs (Monitoramento de uso da Odds API)

## Security Implications:
- RLS Status: Enabled em todas as tabelas públicas.
- Policy Changes: Yes (Políticas de leitura para usuários autenticados e restrição de perfis).
- Auth Requirements: Autenticação do Supabase necessária para leitura de dados de arbitragem.

## Performance Impact:
- Indexes: Adicionados índices nas chaves estrangeiras e campos de busca frequente (event_id, sport_key).
- Triggers: Adicionado trigger em auth.users para popular public.profiles.
- Estimated Impact: Baixo impacto inicial, otimizado para leitura no dashboard.
*/

-- 1. Create Profiles Table (SaaS Users & Subscriptions)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'premium')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" 
    ON public.profiles FOR SELECT 
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = id);

-- Trigger to automatically create a profile for new users
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, plan)
    VALUES (NEW.id, NEW.email, 'free');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 2. Create Sports Table
CREATE TABLE public.sports (
    key TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.sports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read active sports" ON public.sports FOR SELECT USING (true);


-- 3. Create Events Table
CREATE TABLE public.events (
    id TEXT PRIMARY KEY,
    sport_key TEXT NOT NULL REFERENCES public.sports(key) ON DELETE CASCADE,
    home_team TEXT NOT NULL,
    away_team TEXT NOT NULL,
    commence_time TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read events" ON public.events FOR SELECT TO authenticated USING (true);
CREATE INDEX idx_events_sport_key ON public.events(sport_key);
CREATE INDEX idx_events_commence_time ON public.events(commence_time);


-- 4. Create Surebet Opportunities Table
CREATE TABLE public.surebet_opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id TEXT NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    market_key TEXT NOT NULL,
    roi NUMERIC(5,2) NOT NULL,
    profit NUMERIC(10,2) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.surebet_opportunities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read surebets" ON public.surebet_opportunities FOR SELECT TO authenticated USING (true);
CREATE INDEX idx_surebets_event_id ON public.surebet_opportunities(event_id);
CREATE INDEX idx_surebets_roi ON public.surebet_opportunities(roi DESC);


-- 5. Create Surebet Legs Table (The individual bets for the arbitrage)
CREATE TABLE public.surebet_legs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id UUID NOT NULL REFERENCES public.surebet_opportunities(id) ON DELETE CASCADE,
    outcome_name TEXT NOT NULL,
    bookmaker TEXT NOT NULL,
    price NUMERIC(6,2) NOT NULL,
    stake_percentage NUMERIC(5,2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.surebet_legs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read surebet legs" ON public.surebet_legs FOR SELECT TO authenticated USING (true);
CREATE INDEX idx_surebet_legs_opportunity_id ON public.surebet_legs(opportunity_id);


-- 6. Create API Logs Table (For monitoring limits)
CREATE TABLE public.api_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    endpoint TEXT NOT NULL,
    requests_used INTEGER NOT NULL,
    requests_remaining INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.api_logs ENABLE ROW LEVEL SECURITY;
-- Only admins/service role should read API logs ideally, but we'll allow authenticated for the admin dashboard MVP
CREATE POLICY "Authenticated users can read api logs" ON public.api_logs FOR SELECT TO authenticated USING (true);
