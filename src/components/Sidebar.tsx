import React from 'react';
import { NavLink } from 'react-router-dom';
import { Activity, Calculator, Bell, Settings, ShieldAlert, TrendingUp, LogOut } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '../contexts/AuthContext';

const navItems = [
  { icon: Activity, label: 'Painel de Oportunidades', path: '/' },
  { icon: Calculator, label: 'Calculadora', path: '/calculator' },
  { icon: Bell, label: 'Meus Alertas', path: '/alerts' },
  { icon: TrendingUp, label: 'Relatórios', path: '/reports' },
  { icon: ShieldAlert, label: 'Admin (Scanner)', path: '/admin' },
  { icon: Settings, label: 'Configurações', path: '/settings' },
];

export function Sidebar() {
  const { profile, signOut } = useAuth();

  return (
    <aside className="w-64 bg-dark-800 border-r border-dark-700 h-screen flex flex-col">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-brand-600 flex items-center justify-center">
          <Activity className="text-white w-5 h-5" />
        </div>
        <span className="text-white font-bold text-xl tracking-tight">Surebet<span className="text-brand-500">Pro</span></span>
      </div>
      
      <nav className="flex-1 px-4 space-y-2 mt-4">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => clsx(
              "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
              isActive 
                ? "bg-brand-600/10 text-brand-500" 
                : "text-gray-400 hover:bg-dark-700 hover:text-white"
            )}
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-dark-700 space-y-4">
        <div className="bg-dark-700 rounded-lg p-4">
          <div className="text-xs text-gray-400 mb-1 truncate">{profile?.email}</div>
          <div className="text-sm font-bold text-white mb-3 capitalize">Plano {profile?.plan || 'Free'}</div>
          {profile?.plan === 'free' && (
            <button className="w-full py-1.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded transition-colors">
              Fazer Upgrade
            </button>
          )}
        </div>
        
        <button 
          onClick={signOut}
          className="flex items-center gap-3 px-4 py-2 w-full rounded-lg text-sm font-medium text-gray-400 hover:bg-dark-700 hover:text-red-400 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Sair da conta
        </button>
      </div>
    </aside>
  );
}
