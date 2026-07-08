import React, { useState } from 'react';
import { POSScreen } from './POSScreen';
import { QuickStockCheck } from './QuickStockCheck';
import { ShoppingBag, Package } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const EmployeePortal: React.FC<{ initialTab?: string }> = ({ initialTab = 'PDV' }) => {
  const [activeTab, setActiveTab] = useState<'PDV' | 'ESTOQUE'>('PDV');
  const { currentUser } = useApp();

  return (
    <div className="space-y-6">
      
      {/* Sub Navigation Bar for Employee */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-3 rounded-2xl border border-slate-200 shadow-lg">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-sm">
            👨‍🍳
          </span>
          <div>
            <h2 className="font-bold text-lg text-slate-900">Bem-vindo, {currentUser?.name || 'Usuário'}</h2>
            <p className="text-[11px] text-slate-700">Ambiente do Funcionário (Caixa & Chapa)</p>
          </div>
        </div>

        <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200 text-xs font-bold">
          <button
            onClick={() => setActiveTab('PDV')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition cursor-pointer ${
              activeTab === 'PDV' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Entrada</span>
          </button>

          <button
            onClick={() => setActiveTab('ESTOQUE')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition cursor-pointer ${
              activeTab === 'ESTOQUE' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Conferir Estoque</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="pt-2">
        {activeTab === 'PDV' && <POSScreen onOrderPlaced={() => {}} />}
        {activeTab === 'ESTOQUE' && <QuickStockCheck />}
      </div>

    </div>
  );
};
