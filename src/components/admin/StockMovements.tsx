import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  ArrowDownRight, ArrowUpRight, Search, Calendar, Filter, History, User,
  X, ChevronDown, FileText
} from 'lucide-react';
import { StockMovementType } from '../../types';

export const StockMovements: React.FC = () => {
  const { stockMovements } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | StockMovementType>('ALL');
  const [filterOperator, setFilterOperator] = useState('ALL');
  const [filterReason, setFilterReason] = useState('ALL');

  // Date filter states
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [dateFilterMode, setDateFilterMode] = useState<'ALL' | 'EXACT' | 'RANGE'>('ALL');
  const [exactDate, setExactDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [startDate, setStartDate] = useState<string>(new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
  };

  const uniqueOperators = Array.from(new Set(stockMovements.map(m => m.operator))).sort();
  const uniqueReasons = Array.from(new Set(stockMovements.map(m => m.reason))).filter(r => r.trim() !== '').sort();

  const filteredMovements = stockMovements.filter(mov => {
    if (filterType !== 'ALL' && mov.type !== filterType) return false;
    
    if (searchTerm && !mov.ingredientName.toLowerCase().includes(searchTerm.toLowerCase()) && !mov.reason.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    if (filterOperator !== 'ALL' && mov.operator !== filterOperator) {
      return false;
    }

    if (filterReason !== 'ALL' && mov.reason !== filterReason) {
      return false;
    }

    if (dateFilterMode === 'EXACT' && exactDate) {
      const movDateStr = mov.date.split('T')[0];
      if (movDateStr !== exactDate) return false;
    }
    if (dateFilterMode === 'RANGE' && startDate && endDate) {
      const movDateStr = mov.date.split('T')[0];
      if (movDateStr < startDate || movDateStr > endDate) return false;
    }

    return true;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const formatDateTime = (isoString: string) => {
    const d = new Date(isoString);
    const date = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const time = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    return `${date} às ${time}`;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800 p-6 rounded-3xl border border-slate-200 shadow-xl">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <History className="w-6 h-6 text-blue-400" />
            <span>Histórico de Movimentação</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Acompanhe todas as entradas, saídas e ajustes de estoque em tempo real.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-600" />
          <input
            type="text"
            placeholder="Buscar por produto ou observação..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Filter className="w-4 h-4 text-slate-500" />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer appearance-none"
            >
              <option value="ALL">Todas as Operações</option>
              <option value="ENTRADA">Apenas Entradas</option>
              <option value="SAIDA">Apenas Saídas</option>
            </select>
          </div>

          <div className="relative w-full sm:w-auto">
            <button
              type="button"
              onClick={() => {
                if (!showDateFilter && dateFilterMode === 'ALL') {
                  setDateFilterMode('RANGE');
                }
                setShowDateFilter(!showDateFilter);
              }}
              className={`w-full sm:w-auto flex items-center justify-between gap-2 px-3.5 py-2 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                dateFilterMode !== 'ALL'
                  ? 'bg-blue-50 border-blue-500 text-blue-900 font-bold shadow-xs'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Calendar className={`w-4 h-4 ${dateFilterMode !== 'ALL' ? 'text-blue-600' : 'text-slate-600'}`} />
                <span>
                  {dateFilterMode === 'ALL' && 'Todo o Período'}
                  {dateFilterMode === 'EXACT' && `Dia: ${formatDateDisplay(exactDate)}`}
                  {dateFilterMode === 'RANGE' && `${formatDateDisplay(startDate)} a ${formatDateDisplay(endDate)}`}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {dateFilterMode !== 'ALL' && (
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      setDateFilterMode('ALL');
                    }}
                    className="p-0.5 rounded-md hover:bg-blue-100 text-blue-800 font-bold"
                    title="Limpar filtro de data"
                  >
                    <X className="w-3.5 h-3.5" />
                  </span>
                )}
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </div>
            </button>

            {showDateFilter && (
              <div className="absolute left-0 sm:right-0 sm:left-auto top-full mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 z-50 space-y-4 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    Filtrar por Data
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowDateFilter(false)}
                    className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-700">
                  <button
                    type="button"
                    onClick={() => setDateFilterMode('EXACT')}
                    className={`py-1.5 rounded-lg transition cursor-pointer ${dateFilterMode === 'EXACT' ? 'bg-blue-500 text-white shadow-xs font-extrabold' : 'hover:text-slate-900'}`}
                  >
                    Dia Exato
                  </button>
                  <button
                    type="button"
                    onClick={() => setDateFilterMode('RANGE')}
                    className={`py-1.5 rounded-lg transition cursor-pointer ${dateFilterMode === 'RANGE' ? 'bg-blue-500 text-white shadow-xs font-extrabold' : 'hover:text-slate-900'}`}
                  >
                    Período
                  </button>
                </div>

                {dateFilterMode === 'EXACT' && (
                  <div className="space-y-3 pt-1 animate-in fade-in duration-150">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Selecione o dia exato:</label>
                      <input
                        type="date"
                        max={new Date().toISOString().split('T')[0]}
                        value={exactDate}
                        onChange={(e) => setExactDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}

                {dateFilterMode === 'RANGE' && (
                  <div className="space-y-3 pt-1 animate-in fade-in duration-150">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Data Inicial:</label>
                        <input
                          type="date"
                          max={endDate || new Date().toISOString().split('T')[0]}
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Data Final:</label>
                        <input
                          type="date"
                          min={startDate}
                          max={new Date().toISOString().split('T')[0]}
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">Atalhos de período:</label>
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setStartDate(new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]);
                            setEndDate(new Date().toISOString().split('T')[0]);
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-blue-100 hover:text-blue-900 text-slate-700 rounded-lg text-[11px] font-bold transition cursor-pointer"
                        >
                          Últimos 7 dias
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setStartDate(new Date(Date.now() - 15 * 86400000).toISOString().split('T')[0]);
                            setEndDate(new Date().toISOString().split('T')[0]);
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-blue-100 hover:text-blue-900 text-slate-700 rounded-lg text-[11px] font-bold transition cursor-pointer"
                        >
                          15 dias
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setStartDate(new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]);
                            setEndDate(new Date().toISOString().split('T')[0]);
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-blue-100 hover:text-blue-900 text-slate-700 rounded-lg text-[11px] font-bold transition cursor-pointer"
                        >
                          30 dias
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const now = new Date();
                            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
                            setStartDate(firstDay.toISOString().split('T')[0]);
                            setEndDate(now.toISOString().split('T')[0]);
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-blue-100 hover:text-blue-900 text-slate-700 rounded-lg text-[11px] font-bold transition cursor-pointer"
                        >
                          Mês Atual
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setDateFilterMode('ALL');
                      setShowDateFilter(false);
                    }}
                    className="text-slate-500 hover:text-slate-900 font-semibold cursor-pointer"
                  >
                    Limpar
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDateFilter(false)}
                    className="px-4 py-1.5 bg-blue-500 text-white font-extrabold rounded-xl shadow-md hover:bg-blue-600 transition cursor-pointer"
                  >
                    Concluir
                  </button>
                </div>
              </div>
            )}
          </div>

          {uniqueOperators.length > 0 && (
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <User className="w-4 h-4 text-slate-500" />
              </div>
              <select
                value={filterOperator}
                onChange={(e) => setFilterOperator(e.target.value)}
                className="pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer appearance-none"
              >
                <option value="ALL">Todos os Operadores</option>
                {uniqueOperators.map(op => (
                  <option key={op} value={op}>{op}</option>
                ))}
              </select>
            </div>
          )}

          {uniqueReasons.length > 0 && (
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <FileText className="w-4 h-4 text-slate-500" />
              </div>
              <select
                value={filterReason}
                onChange={(e) => setFilterReason(e.target.value)}
                className="pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer appearance-none max-w-[200px] truncate"
              >
                <option value="ALL">Todas as Observações</option>
                {uniqueReasons.map(r => (
                  <option key={r} value={r} title={r}>{r}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/60 text-slate-700 text-xs font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-5">Data e Hora</th>
                <th className="py-3.5 px-5">Operação</th>
                <th className="py-3.5 px-5">Produto / Insumo</th>
                <th className="py-3.5 px-5">Quantidade</th>
                <th className="py-3.5 px-5">Motivo / Observação</th>
                <th className="py-3.5 px-5">Operador</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 text-sm">
                    Nenhuma movimentação encontrada para os filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredMovements.map(mov => (
                  <tr key={mov.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3.5 px-5 text-xs text-slate-600 font-medium whitespace-nowrap">
                      {formatDateTime(mov.date)}
                    </td>
                    <td className="py-3.5 px-5">
                      {mov.type === 'ENTRADA' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <ArrowDownRight className="w-3.5 h-3.5" /> Entrada
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-orange-50 text-orange-700 border border-orange-200">
                          <ArrowUpRight className="w-3.5 h-3.5" /> Saída
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 font-bold text-slate-900">
                      {mov.ingredientName}
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="font-extrabold text-slate-900">
                        {mov.type === 'ENTRADA' ? '+' : '-'}{mov.quantity}
                      </span>
                      <span className="text-slate-500 text-[11px] ml-1 uppercase">{mov.unit}</span>
                    </td>
                    <td className="py-3.5 px-5 text-xs text-slate-700 max-w-xs truncate" title={mov.reason}>
                      {mov.reason}
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 font-semibold text-xs whitespace-nowrap shadow-2xs">
                        <div className="w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center font-black text-[9px]">
                          {mov.operator.charAt(0).toUpperCase()}
                        </div>
                        <span>{mov.operator}</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
