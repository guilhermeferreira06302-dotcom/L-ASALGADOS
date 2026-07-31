import React from 'react';
import { useApp } from '../../context/AppContext';
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';

export const ReceitasDespesas: React.FC = () => {
  const { transactions } = useApp();

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-amber-500" />
              Receita / Despesas
            </h2>
            <p className="text-xs text-slate-600 mt-1">Gerenciamento de receitas e despesas.</p>
          </div>
        </div>
        
        <div className="py-10 text-center">
          <p className="text-slate-500 text-sm font-medium">Conteúdo da aba em desenvolvimento...</p>
        </div>
      </div>
    </div>
  );
};
