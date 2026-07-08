import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Package, Search, AlertTriangle, CheckCircle2 } from 'lucide-react';

export const QuickStockCheck: React.FC = () => {
  const { ingredients } = useApp();
  const [search, setSearch] = useState('');

  const filtered = ingredients.filter(i => 
    !search || i.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Package className="w-6 h-6 text-emerald-400" />
            <span>Conferência Rápida de Estoque (Turno)</span>
          </h2>
          <p className="text-xs text-slate-700 mt-1">
            Consulte a disponibilidade dos ingredientes antes de abrir a chapa ou fechar o caixa.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-600" />
          <input
            type="text"
            placeholder="Pesquisar insumo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered.map(ing => {
          const isCritical = ing.currentStock <= ing.minStock;
          return (
            <div key={ing.id} className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between shadow-md">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-slate-900 text-sm">{ing.name}</h4>
                  {isCritical ? (
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  )}
                </div>
                <p className="text-xs text-slate-700">Fornecedor: {ing.supplier}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs font-extrabold">
                <span className="text-slate-700">Estoque:</span>
                <span className={isCritical ? 'text-red-400' : 'text-emerald-400'}>
                  {ing.currentStock} {ing.unit}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
