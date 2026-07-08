import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ShieldAlert, UserCheck, Utensils, Lock, Mail, ArrowRight, Sparkles, ChefHat } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { login, users } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const adminUser = users.find(u => u.role === 'ADMIN') || users[0];
  const staffUser = users.find(u => u.role === 'FUNCIONARIO') || users[1];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email) {
      setError('Por favor, informe seu e-mail de acesso.');
      return;
    }
    const success = login(email);
    if (!success) {
      setError('Credenciais inválidas. Tente usar um dos acessos rápidos abaixo.');
    }
  };

  const handleQuickLogin = (emailTarget: string) => {
    login(emailTarget);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden text-slate-900">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-red-600 shadow-xl shadow-amber-500/20 mb-4">
          <Utensils className="w-8 h-8 text-slate-900" />
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 font-sans">
          L&A SALGADOS
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
        <div className="bg-white/90 backdrop-blur-xl py-8 px-6 shadow-2xl rounded-3xl border border-slate-200 sm:px-10">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 bg-red-950/60 border border-red-500/40 rounded-xl text-red-300 text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                E-mail Corporativo
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-slate-600" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ex: carlos@lanchonete.com"
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-sm placeholder-slate-600 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Senha de Acesso
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-600" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-sm placeholder-slate-600 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-semibold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition duration-150 cursor-pointer"
              >
                <span>Entrar no Sistema</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-200/80">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-medium uppercase tracking-wider text-slate-700">
                Acesso Rápido para Demonstração
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {/* Admin login button */}
              {adminUser && (
                <button
                  type="button"
                  onClick={() => handleQuickLogin(adminUser.email)}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-r from-slate-800/80 to-slate-800/40 border border-amber-500/30 hover:border-amber-500/70 hover:bg-slate-100 transition text-left cursor-pointer group"
                >
                  <img
                    src={adminUser.avatar}
                    alt={adminUser.name}
                    className="w-10 h-10 rounded-xl object-cover border border-amber-500/50 group-hover:scale-105 transition"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-bold text-slate-900 truncate">{adminUser.name}</p>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        ADMIN
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 truncate">{adminUser.position || 'Gerente & Gestor'}</p>
                  </div>
                  <UserCheck className="w-5 h-5 text-amber-400 opacity-60 group-hover:opacity-100 transition" />
                </button>
              )}

              {/* Staff login button */}
              {staffUser && (
                <button
                  type="button"
                  onClick={() => handleQuickLogin(staffUser.email)}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-r from-slate-800/80 to-slate-800/40 border border-emerald-500/30 hover:border-emerald-500/70 hover:bg-slate-100 transition text-left cursor-pointer group"
                >
                  <img
                    src={staffUser.avatar}
                    alt={staffUser.name}
                    className="w-10 h-10 rounded-xl object-cover border border-emerald-500/50 group-hover:scale-105 transition"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-bold text-slate-900 truncate">{staffUser.name}</p>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        FUNCIONÁRIO
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 truncate">{staffUser.position || 'PDV & Caixa'}</p>
                  </div>
                  <ChefHat className="w-5 h-5 text-emerald-400 opacity-60 group-hover:opacity-100 transition" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
