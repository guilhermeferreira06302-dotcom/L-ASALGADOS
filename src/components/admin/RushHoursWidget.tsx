import React, { useState, useMemo } from 'react';
import { BarChart2, X, Calendar, Flame, Table2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { 
  XAxis, YAxis, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell
} from 'recharts';

export const RushHoursWidget: React.FC = () => {
  const { stockMovements } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'CHART' | 'TABLE'>('CHART');

  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const [startDate, setStartDate] = useState<string>(firstDayOfMonth.toBRTISOString().toBRTDateString());
  const [endDate, setEndDate] = useState<string>(now.toBRTISOString().toBRTDateString());

  const hourlyRushData = useMemo(() => {
    const counts: Record<number, number> = {};
    const filteredMovements = stockMovements.filter(m => {
      if (m.type !== 'SAIDA' || m.reason === 'Prejuízo') return false;
      const movDate = m.date.toBRTDateString();
      if (movDate < startDate || movDate > endDate) return false;
      return true;
    });

    filteredMovements.forEach(movement => {
      const dateObj = new Date(movement.date);
      const timeStr = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', timeZone: 'America/Sao_Paulo' });
      const hour = parseInt(timeStr, 10);
      counts[hour] = (counts[hour] || 0) + movement.quantity;
    });

    const dynamicHours = Object.keys(counts).map(Number);
    dynamicHours.sort((a, b) => {
      const aAdjusted = a >= 3 ? a : a + 24;
      const bAdjusted = b >= 3 ? b : b + 24;
      return aAdjusted - bAdjusted;
    });

    const sDate = new Date(startDate + 'T00:00:00-03:00');
    const eDate = new Date(endDate + 'T23:59:59-03:00');
    const diffTime = Math.abs(eDate.getTime() - sDate.getTime());
    const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    return dynamicHours.map(hour => ({
      hourNum: hour,
      hour: `${String(hour).padStart(2, '0')}h`,
      pedidos: Math.round(counts[hour] / diffDays),
      total: counts[hour]
    }));
  }, [stockMovements, startDate, endDate]);

  let maxPedidos = 0;
  hourlyRushData.forEach(d => {
    if (d.pedidos > maxPedidos) maxPedidos = d.pedidos;
  });
  
  const peakEntries = hourlyRushData.filter(d => d.pedidos === maxPedidos && maxPedidos > 0);
  const peakText = peakEntries.length > 0 
    ? `${peakEntries.map(e => e.hour).join(', ')} (${maxPedidos} pedidos/h médio)` 
    : 'N/A';

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 p-4 bg-amber-500 hover:bg-amber-600 text-white rounded-full shadow-xl hover:shadow-2xl hover:shadow-amber-500/20 transition-all duration-300 transform hover:scale-110 flex items-center justify-center group"
        title="Análise de Horários de Pico"
      >
        <BarChart2 className="w-6 h-6" />
        <span className="absolute right-full mr-4 bg-slate-900 text-white text-xs px-3 py-1.5 rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Horários de Pico
        </span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-500">
                  <Flame className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 leading-none">Horários de Pico da Lanchonete</h2>
                  <p className="text-xs text-slate-500 mt-1 font-medium">Análise de volume de pedidos por faixa de horário</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto space-y-6">
              
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="flex flex-wrap gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Data Inicial</label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                      <input 
                        type="date"
                        value={startDate}
                        max={endDate}
                        onChange={e => setStartDate(e.target.value)}
                        className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Data Final</label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                      <input 
                        type="date"
                        value={endDate}
                        min={startDate}
                        max={now.toBRTISOString().toBRTDateString()}
                        onChange={e => setEndDate(e.target.value)}
                        className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex bg-white rounded-xl border border-slate-200 p-1">
                  <button
                    onClick={() => setViewMode('CHART')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${viewMode === 'CHART' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                  >
                    <BarChart2 className="w-3.5 h-3.5" /> Gráfico
                  </button>
                  <button
                    onClick={() => setViewMode('TABLE')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${viewMode === 'TABLE' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                  >
                    <Table2 className="w-3.5 h-3.5" /> Tabela
                  </button>
                </div>
              </div>

              {hourlyRushData.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-sm font-medium">
                  Nenhuma venda registrada neste período.
                </div>
              ) : (
                <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                  {viewMode === 'CHART' ? (
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={hourlyRushData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <XAxis dataKey="hour" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                          <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            cursor={{ fill: '#f8fafc' }}
                            formatter={(val: number) => [`${val} pedidos (média)`, 'Volume']}
                          />
                          <Bar dataKey="pedidos" radius={[6, 6, 0, 0]}>
                            {hourlyRushData.map((entry, index) => (
                              <Cell key={`bar-${index}`} fill={entry.pedidos >= maxPedidos * 0.8 && maxPedidos > 0 ? '#f59e0b' : '#e2e8f0'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider">
                          <tr>
                            <th className="py-3 px-4 rounded-l-xl">Horário</th>
                            <th className="py-3 px-4">Total no Período</th>
                            <th className="py-3 px-4 rounded-r-xl">Média Diária</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {hourlyRushData.map((data, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50 transition">
                              <td className="py-3 px-4">
                                <span className="font-bold text-slate-900">{data.hour}</span>
                                {data.pedidos === maxPedidos && maxPedidos > 0 && (
                                  <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 text-[10px] font-bold border border-amber-200">
                                    <Flame className="w-3 h-3 fill-current" /> Pico
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-slate-700">{data.total} pedidos</td>
                              <td className="py-3 px-4 font-semibold text-slate-900">{data.pedidos} pedidos/dia</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-slate-600">
              <div className="flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-500 fill-current" />
                <span>Pico Principal: <strong className="text-slate-900">{peakText}</strong></span>
              </div>
              {maxPedidos > 10 && (
                <span className="text-amber-500 font-bold">Alto Volume de Vendas</span>
              )}
            </div>

          </div>
        </div>
      )}
    </>
  );
};
