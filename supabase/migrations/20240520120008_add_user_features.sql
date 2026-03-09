-- Criação da tabela de Estratégias do Usuário
CREATE TABLE IF NOT EXISTS public.user_strategies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    opportunity_id UUID NOT NULL REFERENCES public.surebet_opportunities(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, won, lost, void
    invested_amount NUMERIC DEFAULT 0,
    expected_profit NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.user_strategies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their strategies" 
ON public.user_strategies 
FOR ALL 
USING (auth.uid() = user_id);

-- Criação da tabela de Alertas do Usuário
CREATE TABLE IF NOT EXISTS public.user_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    min_roi NUMERIC NOT NULL,
    sport_key TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.user_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their alerts" 
ON public.user_alerts 
FOR ALL 
USING (auth.uid() = user_id);
