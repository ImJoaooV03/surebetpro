import React from 'react';
import { NavLink } from 'react-router-dom';
import { Activity, Calculator, Bell, Settings, ShieldAlert, TrendingUp, LogOut } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '../contexts/AuthContext';

const navItems = [
  { icon: Activity, label: 'Oportunidades', path: '/' },
  { icon: Calculator, label: 'Calculadora', path: '/calculator' },
  { icon: Bell, label: 'Meus Alertas', path: '/alerts' },
  { icon: TrendingUp, label: 'Relatórios', path: '/reports' },
  { icon: ShieldAlert, label: 'Admin (Scanner)', path: '/admin' },
  { icon: Settings, label: 'Configurações', path: '/settings' },
];

export function Sidebar() {
  const { profile, signOut } = useAuth();

  return (
    <aside className="w-64 bg-white border-r border-slate-200 h-screen flex flex-col shadow-sm z-10">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm shadow-indigo-200">
          <Activity className="text-white w-5 h-5" />
        </div>
        <span className="text-slate-900 font-extrabold text-xl tracking-tight">Surebet<span className="text-indigo-600">Pro</span></span>
      </div>
      
      <nav className="flex-1 px-4 space-y-1.5 mt-4">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => clsx(
              "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
              isActive 
                ? "bg-indigo-50 text-indigo-700" 
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <item.icon className={clsx("w-5 h-5", "transition-colors")} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-200 space-y-4 bg-slate-50/50">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs text-slate-500 mb-1 truncate font-medium">{profile?.email}</div>
          <div className="text-sm font-bold text-slate-900 mb-3 capitalize">Plano {profile?.plan || 'Free'}</div>
          {profile?.plan === 'free' && (
            <button className="w-full py-2 bg-white border border-slate-300 hover:bg-slate-50 hover:border-slate-400 text-slate-700 text-xs font-bold rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1">
              Fazer Upgrade
            </button>
          )}
        </div>
        
        <button 
          onClick={signOut}
          className="flex items-center gap-3 px-4 py-2 w-full rounded-xl text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
        >
          <LogOut className="w-5 h-5" />
          Sair da conta
        </button>
      </div>
    </aside>
  );
}
