/*
  # Add API URL Configuration
  Adiciona colunas para configurar a URL base e endpoints da API dinamicamente.
  
  ## Query Description:
  Esta operação adiciona as colunas api_base_url e api_endpoint_odds na tabela system_settings. Isso permite que o usuário configure a URL exata da API pelo painel, resolvendo erros de 404 causados por mudanças de rotas no provedor.
  
  ## Metadata:
  - Schema-Category: "Safe"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true
  
  ## Structure Details:
  - Tabela `system_settings`: Adiciona `api_base_url` (text) e `api_endpoint_odds` (text)
*/

ALTER TABLE public.system_settings 
ADD COLUMN IF NOT EXISTS api_base_url text DEFAULT 'https://api.odds-api.io/v1';

ALTER TABLE public.system_settings 
ADD COLUMN IF NOT EXISTS api_endpoint_odds text DEFAULT '/odds';
