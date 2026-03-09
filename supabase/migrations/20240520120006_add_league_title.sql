-- Remove a restrição de chave estrangeira antiga que impedia salvar ligas específicas
ALTER TABLE IF EXISTS public.events DROP CONSTRAINT IF EXISTS events_sport_key_fkey;

-- Adiciona a coluna para armazenar o nome real da liga (ex: Premier League, Brasileirão Série A)
ALTER TABLE IF EXISTS public.events ADD COLUMN IF NOT EXISTS league_title text;
