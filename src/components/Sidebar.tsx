import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Shield, ChefHat, LayoutDashboard, DollarSign, Package, Utensils,
  Bell, AlertTriangle, CheckCircle2, RotateCcw, LogOut, X,
  ChevronUp, ChevronDown
} from 'lucide-react';

interface SidebarProps {
  activePortal: 'ADMIN' | 'FUNCIONARIO';
  setActivePortal: (portal: 'ADMIN' | 'FUNCIONARIO') => void;
  adminTab: string;
  setAdminTab: (tab: string) => void;
  openAIModal?: () => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePortal,
  setActivePortal,
  adminTab,
  setAdminTab,
  isMobileOpen,
  setIsMobileOpen,
}) => {
  const { currentUser, logout, switchRole, ingredients, resetToDefaultData } = useApp();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const lowStockItems = ingredients.filter(i => i.currentStock <= i.minStock);

  const handlePortalSwitch = (portal: 'ADMIN' | 'FUNCIONARIO') => {
    setActivePortal(portal);
    switchRole(portal);
    setIsMobileOpen(false);
  };

  const handleTabClick = (tab: string) => {
    setAdminTab(tab);
    setIsMobileOpen(false);
  };

  if (!currentUser) return null;

  return (
    <>
      {/* Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-50/80 backdrop-blur-xs z-40 transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Left Sidebar Panel */}
      <aside 
        id="admin-sidebar"
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 text-slate-900 flex flex-col h-screen transition-transform duration-300 ease-in-out shadow-2xl ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center font-bold text-slate-950 shadow-md shadow-amber-500/20 text-xl flex-shrink-0">
              🍔
            </div>
            <div className="min-w-0">
              <h1 className="font-extrabold text-base tracking-tight text-slate-900 flex items-center gap-1.5 truncate">
                <span>L&A SALGADOS</span>
              </h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  PRO v2.5
                </span>
                <span className="text-[11px] text-slate-700 truncate">ERP Lanchonete</span>
              </div>
            </div>
          </div>

          {/* Close button */}
          <button 
            onClick={() => setIsMobileOpen(false)}
            className="p-1.5 rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
            title="Fechar menu lateral"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Portal Switcher Card */}
        <div className="p-4 border-b border-slate-200/80 bg-slate-50/40">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-700 block mb-2">
            Módulo Operacional
          </label>
          <div className="grid grid-cols-2 gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => handlePortalSwitch('ADMIN')}
              className={`flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                activePortal === 'ADMIN'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-sm'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-white'
              }`}
            >
              <Shield className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Admin</span>
            </button>
            <button
              onClick={() => handlePortalSwitch('FUNCIONARIO')}
              className={`flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                activePortal === 'FUNCIONARIO'
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-slate-950 shadow-sm'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-white'
              }`}
            >
              <ChefHat className="w-3.5 h-3.5 flex-shrink-0" />
              <span>PDV / Loja</span>
            </button>
          </div>
        </div>

        {/* Scrollable Navigation Menu */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-800">
          
          {/* Admin Navigation */}
          {activePortal === 'ADMIN' ? (
            <div className="space-y-1.5">
              <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-700">
                Menu Principal
              </div>

              <button
                onClick={() => handleTabClick('DASHBOARD')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  adminTab === 'DASHBOARD'
                    ? 'bg-gradient-to-r from-amber-500/15 to-amber-500/5 text-amber-400 border-l-4 border-amber-500 shadow-xs'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <LayoutDashboard className={`w-4 h-4 ${adminTab === 'DASHBOARD' ? 'text-amber-400' : 'text-slate-700'}`} />
                  <span>Dashboard & Gráficos</span>
                </div>
              </button>

              <button
                onClick={() => handleTabClick('FINANCEIRO')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  adminTab === 'FINANCEIRO'
                    ? 'bg-gradient-to-r from-emerald-500/15 to-emerald-500/5 text-emerald-400 border-l-4 border-emerald-500 shadow-xs'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <DollarSign className={`w-4 h-4 ${adminTab === 'FINANCEIRO' ? 'text-emerald-400' : 'text-slate-700'}`} />
                  <span>Análise Financeira</span>
                </div>
              </button>

              <button
                onClick={() => handleTabClick('ESTOQUE')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  adminTab === 'ESTOQUE'
                    ? 'bg-gradient-to-r from-purple-500/15 to-purple-500/5 text-purple-400 border-l-4 border-purple-500 shadow-xs'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Package className={`w-4 h-4 ${adminTab === 'ESTOQUE' ? 'text-purple-400' : 'text-slate-700'}`} />
                  <span>Estoque & Inventário</span>
                </div>
                {lowStockItems.length > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-extrabold">
                    {lowStockItems.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => handleTabClick('PRODUTOS')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  adminTab === 'PRODUTOS'
                    ? 'bg-gradient-to-r from-white/15 to-white/5 text-slate-900 border-l-4 border-white shadow-xs'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Utensils className={`w-4 h-4 ${adminTab === 'PRODUTOS' ? 'text-slate-900' : 'text-slate-700'}`} />
                  <span>Cardápio & Produtos</span>
                </div>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-700">
                Acesso Operacional
              </div>
              <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 text-xs">
                <div className="flex items-center gap-2 font-bold text-emerald-400 mb-1">
                  <ChefHat className="w-4 h-4" />
                  <span>Modo Funcionário Ativo</span>
                </div>
                <p className="text-[11px] text-slate-700 leading-relaxed">
                  Terminal de PDV para registro de pedidos de balcão e conferência rápida da cozinha.
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Footer Area (Fixed bottom of sidebar) */}
        <div className="p-4 border-t border-slate-200/80 bg-slate-50/60 space-y-3">
          
          {/* Notifications Dropdown inside Sidebar */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-100/60 hover:bg-slate-100 border border-slate-300/80 text-xs font-semibold text-slate-700 hover:text-slate-900 transition cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-400" />
                <span>Alertas de Estoque</span>
              </div>
              {lowStockItems.length > 0 ? (
                <span className="px-2 py-0.5 rounded-full bg-red-500 text-slate-900 text-[10px] font-bold flex items-center gap-1 animate-pulse">
                  {lowStockItems.length} críticos
                </span>
              ) : (
                <span className="text-[10px] text-emerald-400 font-bold">Normal</span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute bottom-full left-0 mb-2 w-full bg-white border border-slate-300 rounded-2xl shadow-2xl py-3 px-3.5 z-50">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-2">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    Insumos em Alerta
                  </span>
                  <button 
                    onClick={() => setShowNotifications(false)}
                    className="text-slate-700 hover:text-slate-900 text-xs"
                  >
                    ✕
                  </button>
                </div>
                <div className="max-h-48 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-slate-800">
                  {lowStockItems.length === 0 ? (
                    <div className="py-3 text-center text-xs text-slate-700 flex flex-col items-center gap-1">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <span>Estoque devidamente abastecido!</span>
                    </div>
                  ) : (
                    lowStockItems.map(item => (
                      <div key={item.id} className="p-2 rounded-xl bg-red-950/40 border border-red-500/30 text-xs">
                        <div className="font-bold text-red-200 flex justify-between">
                          <span>{item.name}</span>
                          <span className="text-red-400">{item.currentStock} {item.unit}</span>
                        </div>
                        <p className="text-[10px] text-slate-700 mt-0.5">
                          Mínimo recomendado: {item.minStock} {item.unit}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Card */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-full flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 hover:border-slate-300 transition cursor-pointer text-left"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-lg object-cover border border-amber-500/50 flex-shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">{currentUser.name}</p>
                  <p className="text-[10px] text-slate-700 truncate">{currentUser.role === 'ADMIN' ? 'Administrador Principal' : 'Operador / PDV'}</p>
                </div>
              </div>
              {showUserMenu ? (
                <ChevronDown className="w-4 h-4 text-slate-700 flex-shrink-0" />
              ) : (
                <ChevronUp className="w-4 h-4 text-slate-700 flex-shrink-0" />
              )}
            </button>

            {showUserMenu && (
              <div className="absolute bottom-full left-0 mb-2 w-full bg-white border border-slate-300 rounded-2xl shadow-2xl py-1.5 z-50 text-xs">
                <button
                  onClick={() => {
                    if (confirm('Deseja resetar os dados iniciais de demonstração (pedidos, estoque e transações)?')) {
                      resetToDefaultData();
                      setShowUserMenu(false);
                    }
                  }}
                  className="w-full text-left px-3.5 py-2 text-slate-700 hover:bg-slate-100 flex items-center gap-2 transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                  <span>Resetar Dados de Demo</span>
                </button>

                <button
                  onClick={logout}
                  className="w-full text-left px-3.5 py-2 text-red-400 hover:bg-red-950/40 flex items-center gap-2 transition cursor-pointer rounded-b-xl"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sair da Conta</span>
                </button>
              </div>
            )}
          </div>

        </div>
      </aside>
    </>
  );
};
