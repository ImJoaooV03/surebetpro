/*
  # Adicionar Chave de API nas Configurações do Sistema
  Esta migração adiciona a coluna para armazenar a chave da Odds API de forma global,
  permitindo que o backend leia a chave configurada pelo painel de administração.

  ## Query Description:
  Adiciona a coluna `odds_api_key` na tabela `system_settings`. Operação segura e sem perda de dados.
  
  ## Metadata:
  - Schema-Category: "Safe"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true
*/

ALTER TABLE public.system_settings 
ADD COLUMN IF NOT EXISTS odds_api_key text;
