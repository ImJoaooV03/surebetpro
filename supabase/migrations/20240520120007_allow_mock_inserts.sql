/*
# Allow mock inserts for testing
Adds INSERT policies for events, surebet_opportunities, and surebet_legs so the frontend can inject mock data.

## Query Description:
This operation adds Row Level Security (RLS) policies to allow authenticated users to insert records into the events, surebet_opportunities, and surebet_legs tables. This is necessary for the "Gerar Surebet de Exemplo" feature to work from the frontend.

## Metadata:
- Schema-Category: "Safe"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true

## Structure Details:
- events: Add INSERT policy
- surebet_opportunities: Add INSERT policy
- surebet_legs: Add INSERT policy

## Security Implications:
- RLS Status: Enabled
- Policy Changes: Yes
- Auth Requirements: Authenticated users only
*/

-- Adiciona permissão de INSERT na tabela events
CREATE POLICY "Authenticated users can insert events" 
ON public.events 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Adiciona permissão de INSERT na tabela surebet_opportunities
CREATE POLICY "Authenticated users can insert surebets" 
ON public.surebet_opportunities 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Adiciona permissão de INSERT na tabela surebet_legs
CREATE POLICY "Authenticated users can insert surebet legs" 
ON public.surebet_legs 
FOR INSERT 
TO authenticated 
WITH CHECK (true);
