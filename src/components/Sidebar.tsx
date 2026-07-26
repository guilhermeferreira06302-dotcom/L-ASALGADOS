import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Shield, ChefHat, LayoutDashboard, DollarSign, Package, Utensils,
  Bell, AlertTriangle, CheckCircle2, RotateCcw, LogOut, X,
  ChevronUp, ChevronDown, Plus, Minus, ArrowDownRight, ArrowUpRight, Calendar, Clock, Tag
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { quantityMask, parseQuantity } from '../utils/masks';
import { isStockActive } from '../types';

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
  const { currentUser, logout, switchRole, ingredients, resetToDefaultData, adjustStock } = useApp();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Material Inflow/Outflow modal state
  const [materialModalType, setMaterialModalType] = useState<'ENTRADA' | 'SAIDA' | null>(null);
  const [selectedCat, setSelectedCat] = useState<string>('');
  const [selectedMatId, setSelectedMatId] = useState<string>('');
  const [matQty, setMatQty] = useState<string>('');
  const [matDate, setMatDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [matTime, setMatTime] = useState<string>(new Date().toTimeString().slice(0, 5));
  const [matNotes, setMatNotes] = useState<string>('');
  const [outflowReason, setOutflowReason] = useState<string>('Venda');

  useEffect(() => {
    if (!materialModalType) return;
    
    // Atualiza a cada segundo para garantir a virada do minuto
    const interval = setInterval(() => {
      setMatDate(new Date().toISOString().split('T')[0]);
      setMatTime(new Date().toTimeString().slice(0, 5));
    }, 1000);

    return () => clearInterval(interval);
  }, [materialModalType]);

  const materialCategories = Array.from(new Set(
    ingredients.map(ing => ing.category || 'INSUMOS GERAIS')
  )).sort();

  const availableMaterials = ingredients.filter(ing => {
    if (!selectedCat) return false;
    if (materialModalType === 'SAIDA' && !isStockActive(ing)) return false;
    return (ing.category || 'INSUMOS GERAIS') === selectedCat;
  });

  const openMaterialModal = (type: 'ENTRADA' | 'SAIDA') => {
    setMaterialModalType(type);
    setSelectedCat('');
    setSelectedMatId('');
    setMatQty('');
    setMatDate(new Date().toISOString().split('T')[0]);
    setMatTime(new Date().toTimeString().slice(0, 5));
    setOutflowReason('Venda');
    setMatNotes('');
  };

  const handleConfirmMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatId || !matQty || !materialModalType) return;
    
    const qtyNum = parseQuantity(matQty);
    if (qtyNum <= 0) return;

    const targetIng = ingredients.find(i => i.id === selectedMatId);
    if (!targetIng) return;

    const changeNum = materialModalType === 'ENTRADA' ? qtyNum : -qtyNum;
    const formattedDateTime = `${matDate.split('-').reverse().join('/')} às ${matTime}`;
    
    let finalNotes = matNotes;
    if (materialModalType === 'SAIDA') {
      if (outflowReason === 'Venda') {
        finalNotes = 'Venda';
      } else if (outflowReason === 'Prejuízo') {
        finalNotes = `Prejuízo: ${matNotes}`;
      }
    }
    const reasonText = finalNotes || (materialModalType === 'ENTRADA' ? 'Sem observação' : 'Sem observação');

    adjustStock(selectedMatId, changeNum, reasonText, currentUser?.name || 'Operador da Loja');
    
    setMaterialModalType(null);

    // Trigger celebration confetti on Entrada
    if (materialModalType === 'ENTRADA') {
      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 }
        });
      } catch (err) {
        // ignore
      }
    }
  };

  const lowStockItems = ingredients.filter(i => isStockActive(i) && i.currentStock <= i.minStock);

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
                  <span>Estoque</span>
                </div>
                {lowStockItems.length > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-extrabold">
                    {lowStockItems.length}
                  </span>
                )}
              </button>

              {/* Sub-actions for Estoque in Sidebar */}
              <div className="grid grid-cols-2 gap-1.5 px-1 pt-0.5 pb-1">
                <button
                  type="button"
                  onClick={() => {
                    if (adminTab !== 'ESTOQUE') handleTabClick('ESTOQUE');
                    openMaterialModal('ENTRADA');
                  }}
                  className="flex items-center justify-center gap-1 px-2 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-[11px] shadow-sm transition cursor-pointer border border-emerald-600/20"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Entrada</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (adminTab !== 'ESTOQUE') handleTabClick('ESTOQUE');
                    openMaterialModal('SAIDA');
                  }}
                  className="flex items-center justify-center gap-1 px-2 py-1.5 rounded-xl bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-extrabold text-[11px] shadow-sm transition cursor-pointer border border-orange-600/20"
                >
                  <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Saída</span>
                </button>
              </div>

              <button
                onClick={() => handleTabClick('MOVIMENTACAO')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  adminTab === 'MOVIMENTACAO'
                    ? 'bg-gradient-to-r from-blue-500/15 to-blue-500/5 text-blue-500 border-l-4 border-blue-500 shadow-xs'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <RotateCcw className={`w-4 h-4 ${adminTab === 'MOVIMENTACAO' ? 'text-blue-500' : 'text-slate-700'}`} />
                  <span>Movimentação</span>
                </div>
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
                  <span>Cadastrar Produtos</span>
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

      {/* Material Inflow / Outflow Modal (Entrada/Saída de Material) from Sidebar */}
      {materialModalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                {materialModalType === 'ENTRADA' ? (
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-sm">
                    <ArrowDownRight className="w-6 h-6 stroke-[2.5]" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center shadow-sm">
                    <ArrowUpRight className="w-6 h-6 stroke-[2.5]" />
                  </div>
                )}
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg">
                    {materialModalType === 'ENTRADA' ? 'Entrada de Material' : 'Saída de Material'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {materialModalType === 'ENTRADA' ? 'Recebimento de mercadoria / reposição' : 'Baixa de estoque / consumo interno'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMaterialModalType(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmMaterial} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-slate-500" />
                  <span>Categoria do Produto</span>
                </label>
                <select
                  value={selectedCat}
                  onChange={(e) => {
                    const newCat = e.target.value;
                    setSelectedCat(newCat);
                    setSelectedMatId('');
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-bold text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none transition"
                  required
                >
                  <option value="">Selecione a categoria...</option>
                  {materialCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-slate-500" />
                  <span>Nome do Produto</span>
                </label>
                <select
                  value={selectedMatId}
                  onChange={(e) => setSelectedMatId(e.target.value)}
                  disabled={!selectedCat}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-bold text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none transition disabled:bg-slate-100 disabled:text-slate-400"
                  required
                >
                  {!selectedCat ? (
                    <option value="">← Selecione a categoria acima primeiro</option>
                  ) : (
                    <>
                      <option value="">Selecione o produto/material...</option>
                      {availableMaterials.map(mat => (
                        <option key={mat.id} value={mat.id}>
                          {mat.name} — Estoque atual: {mat.currentStock} {mat.unit}
                        </option>
                      ))}
                    </>
                  )}
                </select>
                {selectedMatId && (
                  <p className="text-[11px] font-semibold text-slate-500 mt-1 pl-1">
                    ✓ Item selecionado. Unidade de medida: <span className="text-slate-800 font-bold uppercase">{ingredients.find(i => i.id === selectedMatId)?.unit || 'un'}</span>
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Quantidade
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="0"
                    value={matQty}
                    onChange={(e) => setMatQty(quantityMask(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-extrabold text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none transition text-center"
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>Data</span>
                  </label>
                  <input
                    type="date"
                    required
                    disabled
                    readOnly
                    max={new Date().toISOString().split('T')[0]}
                    value={matDate}
                    onChange={(e) => setMatDate(e.target.value)}
                    className="w-full bg-slate-100/80 border border-slate-200 rounded-xl p-3 text-slate-700 font-bold text-xs cursor-not-allowed select-none focus:outline-none transition opacity-80"
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>Hora</span>
                  </label>
                  <input
                    type="time"
                    required
                    disabled
                    readOnly
                    value={matTime}
                    onChange={(e) => setMatTime(e.target.value)}
                    className="w-full bg-slate-100/80 border border-slate-200 rounded-xl p-3 text-slate-700 font-bold text-xs cursor-not-allowed select-none focus:outline-none transition opacity-80"
                  />
                </div>
              </div>

              {materialModalType === 'SAIDA' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-slate-500" />
                    <span>Motivo da Saída</span>
                  </label>
                  <select
                    value={outflowReason}
                    onChange={(e) => setOutflowReason(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-bold text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none transition"
                  >
                    <option value="Venda">Venda</option>
                    <option value="Prejuízo">Prejuízo</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
              )}

              {(materialModalType === 'ENTRADA' || (materialModalType === 'SAIDA' && (outflowReason === 'Outros' || outflowReason === 'Prejuízo'))) && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Observação / Motivo {materialModalType === 'SAIDA' && (outflowReason === 'Outros' || outflowReason === 'Prejuízo') ? <span className="text-red-500">(Obrigatório)</span> : '(Opcional)'}
                  </label>
                  <input
                    type="text"
                    required={materialModalType === 'SAIDA' && (outflowReason === 'Outros' || outflowReason === 'Prejuízo')}
                    placeholder={materialModalType === 'ENTRADA' ? 'Ex: NF #12345 - Compra semanal' : (outflowReason === 'Prejuízo' ? 'Ex: Produto vencido, queimou na chapa...' : 'Ex: Consumo na cozinha / Descarte')}
                    value={matNotes}
                    onChange={(e) => setMatNotes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-medium text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none transition placeholder-slate-400"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setMaterialModalType(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2.5 text-white font-extrabold rounded-xl text-xs shadow-md transition cursor-pointer flex items-center gap-1.5 ${
                    materialModalType === 'ENTRADA'
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-500/20'
                      : 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 shadow-orange-500/20'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                  <span>{materialModalType === 'ENTRADA' ? 'Confirmar Entrada' : 'Confirmar Saída'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
