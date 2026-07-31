import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { isStockActive } from '../../types';
import { 
  DollarSign, TrendingUp, Package, AlertTriangle, ArrowUpRight, 
  ShoppingBag, Award
} from 'lucide-react';
import { 
  XAxis, YAxis, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell
} from 'recharts';

export const AdminDashboard: React.FC<{ onNavigateTab: (tab: string) => void }> = ({ onNavigateTab }) => {
  const { transactions, ingredients, products, orders } = useApp();

  // Financial KPIs
  const inflow = transactions.filter(t => t.type === 'ENTRADA').reduce((s, t) => s + t.amount, 0);
  const outflow = transactions.filter(t => t.type === 'SAIDA').reduce((s, t) => s + t.amount, 0);
  const netProfit = inflow - outflow;
  const margin = inflow > 0 ? ((netProfit / inflow) * 100).toFixed(1) : '0';

  const lowStockItems = ingredients.filter(i => isStockActive(i) && i.currentStock <= i.minStock);
  const totalOrdersCount = orders.length + 380; // realistic aggregate monthly count

  // Hourly rush data
  const hourlyRushData = [
    { hour: '11h', pedidos: 15 },
    { hour: '12h', pedidos: 42 },
    { hour: '13h', pedidos: 38 },
    { hour: '14h', pedidos: 18 },
    { hour: '18h', pedidos: 28 },
    { hour: '19h', pedidos: 65 },
    { hour: '20h', pedidos: 84 },
    { hour: '21h', pedidos: 78 },
    { hour: '22h', pedidos: 45 },
  ];

  const topProducts = [...products].sort((a,b) => b.salesCountMonthly - a.salesCountMonthly).slice(0, 6);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-xl flex items-start justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-700 whitespace-nowrap truncate">Faturamento Bruto</p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">R$ {inflow.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 mt-2 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              <ArrowUpRight className="w-3 h-3" /> +14.2% esta semana
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-xl flex items-start justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-700 whitespace-nowrap truncate">Lucro Líquido</p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">R$ {netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 mt-2 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              Margem de {margin}%
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-xl flex items-start justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-700 whitespace-nowrap truncate">Pedidos Mensais</p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{totalOrdersCount}</h3>
            <span className="inline-flex items-center gap-1 text-[11px] text-slate-700 mt-2 py-0.5">
              Ticket Médio: R$ 48,20
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/30 flex items-center justify-center text-slate-900">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </div>

        <div 
          onClick={() => onNavigateTab('ESTOQUE')}
          className="bg-white border border-slate-200 p-5 rounded-3xl shadow-xl flex items-start justify-between cursor-pointer hover:border-amber-500/50 transition group"
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-700 whitespace-nowrap truncate group-hover:text-amber-400 transition">Estoque Crítico</p>
            <h3 className={`text-2xl font-extrabold mt-1 ${lowStockItems.length > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
              {lowStockItems.length} insumos
            </h3>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 mt-2 underline py-0.5">
              Ver ou Repor Estoque &rarr;
            </span>
          </div>
          <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${
            lowStockItems.length > 0 
              ? 'bg-red-500/10 border-red-500/30 text-red-400' 
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
          }`}>
            {lowStockItems.length > 0 ? <AlertTriangle className="w-6 h-6 animate-pulse" /> : <Package className="w-6 h-6" />}
          </div>
        </div>
      </div>

      {/* Second Row: Top Sellers + Rush Hours */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Top Sellers Table */}
        <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-xl">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              <span>Produtos Campeões de Venda</span>
            </h3>
            <button 
              onClick={() => onNavigateTab('PRODUTOS')}
              className="text-xs text-amber-400 font-semibold hover:underline cursor-pointer"
            >
              Ver todos &rarr;
            </button>
          </div>

          <div className="space-y-4">
            {topProducts.map((prod, idx) => {
              const profitPerUnit = prod.price - prod.costPrice;
              const marginPct = ((profitPerUnit / prod.price) * 100).toFixed(0);
              return (
                <div key={prod.id} className="flex items-center gap-4 p-3 rounded-2xl bg-slate-50/60 border border-slate-200/80 hover:border-slate-300 transition">
                  <img src={prod.image} alt={prod.name} className="w-12 h-12 rounded-xl object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{prod.name}</p>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-700">
                      <span>R$ {prod.price.toFixed(2)}</span>
                      <span className="text-emerald-400 font-medium">Lucro R$ {profitPerUnit.toFixed(2)} ({marginPct}%)</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-extrabold text-slate-900">{prod.salesCountMonthly}</span>
                    <p className="text-[10px] text-slate-600 uppercase">vendidos</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Rush Hours Bar Chart */}
        <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Horários de Pico da Lanchonete</h3>
            <p className="text-xs text-slate-700">Volume médio de pedidos por horário</p>
          </div>

          <div className="h-56 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyRushData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="hour" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', fontSize: '12px' }}
                  formatter={(val: number) => [`${val} pedidos/hora`, 'Pico']}
                />
                <Bar dataKey="pedidos" radius={[6, 6, 0, 0]}>
                  {hourlyRushData.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={entry.pedidos > 60 ? '#f59e0b' : '#ffffff'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-700 pt-3 border-t border-slate-200 mt-2">
            <span>🔥 Pico Principal: 19h às 21h</span>
            <span className="text-amber-400 font-semibold">Recomendado: +1 Chapeiro</span>
          </div>
        </div>

      </div>

    </div>
  );
};
