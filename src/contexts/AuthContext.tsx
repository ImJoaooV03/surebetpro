import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface Profile {
  id: string;
  email: string;
  plan: string;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('[AuthContext] 🔄 Inicializando verificação de sessão...');
    
    // Busca a sessão inicial
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('[AuthContext] ❌ Erro ao buscar sessão:', error);
      }
      
      console.log('[AuthContext] ✅ Sessão inicial:', session ? 'Usuário logado' : 'Nenhum usuário');
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setIsLoading(false);
      }
    }).catch(err => {
      console.error('[AuthContext] ❌ Falha crítica na Promessa do Supabase:', err);
      setIsLoading(false);
    });

    // Escuta mudanças de estado da autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log(`[AuthContext] 🔄 Mudança de estado detectada: ${_event}`);
      setSession(session);
      setUser(session?.user ?? null);
      
      // Prevenção de deadlock: usando setTimeout para chamadas async subsequentes
      setTimeout(async () => {
        try {
          if (session?.user) {
            await fetchProfile(session.user.id);
          } else {
            setProfile(null);
            setIsLoading(false);
          }
        } catch (err) {
          console.error('[AuthContext] ❌ Erro no listener de auth:', err);
          setIsLoading(false);
        }
      }, 0);
    });

    return () => {
      console.log('[AuthContext] 🧹 Limpando listener de autenticação.');
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      console.log(`[AuthContext] 🔍 Buscando perfil para o usuário: ${userId}`);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      
      console.log('[AuthContext] ✅ Perfil carregado com sucesso.');
      setProfile(data);
    } catch (error) {
      console.error('[AuthContext] ❌ Erro ao buscar perfil:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      console.log('[AuthContext] 🚪 Realizando logout...');
      await supabase.auth.signOut();
    } catch (error) {
      console.error('[AuthContext] ❌ Erro ao fazer logout:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
