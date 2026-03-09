/*
  # Correção de RLS e Inserção de Esportes Padrão
  
  ## Query Description: 
  Esta migração corrige as políticas de segurança (RLS) da tabela `sports` para permitir que o painel de administração leia TODOS os esportes (ativos e inativos), insira e atualize os esportes corretamente. Também insere uma lista padrão de esportes populares para o scanner iniciar.
  
  ## Metadata:
  - Schema-Category: "Data"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true
  
  ## Structure Details:
  - Atualiza RLS da tabela `sports`
  - Insere dados iniciais na tabela `sports`
*/

-- 1. Permite que usuários autenticados leiam TODOS os esportes (mesmo os desativados)
CREATE POLICY "Authenticated users can read all sports" ON public.sports FOR SELECT TO authenticated USING (true);

-- 2. Permite que usuários autenticados insiram e atualizem esportes
CREATE POLICY "Authenticated users can insert sports" ON public.sports FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update sports" ON public.sports FOR UPDATE TO authenticated USING (true);

-- 3. Inserir os esportes padrão da Odds API
INSERT INTO public.sports (key, title, active) VALUES
('soccer_brazil_campeonato', 'Futebol - Brasileirão Série A', true),
('soccer_brazil_serie_b', 'Futebol - Brasileirão Série B', true),
('soccer_uefa_champs_league', 'Futebol - Champions League', true),
('soccer_epl', 'Futebol - Premier League', true),
('soccer_spain_la_liga', 'Futebol - La Liga (Espanha)', true),
('basketball_nba', 'Basquete - NBA', true),
('basketball_euroleague', 'Basquete - Euroleague', true),
('tennis_atp_wimbledon', 'Tênis - ATP Wimbledon', true),
('tennis_wta_wimbledon', 'Tênis - WTA Wimbledon', true),
('americanfootball_nfl', 'Futebol Americano - NFL', false),
('mma_mixed_martial_arts', 'MMA - UFC', false),
('icehockey_nhl', 'Hóquei - NHL', false)
ON CONFLICT (key) DO NOTHING;
