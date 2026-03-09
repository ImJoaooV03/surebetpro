import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn('[Supabase] AVISO: Credenciais do Supabase não encontradas no backend.');
}

// Cliente Supabase dedicado para o Backend (Motor de Busca)
export const supabase = createClient(supabaseUrl, supabaseKey);
