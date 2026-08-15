import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Ingredient, isStockActive, Product } from '../../types';
import { 
  Package, AlertTriangle, RefreshCw, 
  Search, ClipboardCheck, Sparkles, CheckCircle2,
  Calendar, X, ChevronDown
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { quantityMask, parseQuantity } from '../../utils/masks';

export const StockInventory: React.FC = () => {
  const { ingredients, products, adjustStock, performInventoryAudit, audits, currentUser, customCategories } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCat, setFilterCat] = useState<string>('ALL');

  // Date filter states
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [dateFilterMode, setDateFilterMode] = useState<'ALL' | 'EXACT' | 'RANGE'>('ALL');
  const [exactDate, setExactDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [startDate, setStartDate] = useState<string>(new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Modal states
  const [showAuditWizard, setShowAuditWizard] = useState(false);

  // Audit wizard state
  const [auditCounts, setAuditCounts] = useState<{ [id: string]: number }>({});
  const [auditNotes, setAuditNotes] = useState('');

  const getIngredientDateStr = (lastUpdated: string): string => {
    const today = new Date();
    const toISO = (d: Date) => d.toISOString().split('T')[0];

    if (!lastUpdated) return toISO(today);
    const lower = lastUpdated.toLowerCase();
    if (lower.includes('hoje') || lower.includes('agora') || lower.includes('auditado')) {
      return toISO(today);
    }
    if (lower.includes('ontem')) {
      const yesterday = new Date(today.getTime() - 86400000);
      return toISO(yesterday);
    }
    const daysMatch = lower.match(/h[aá] (\d+) dia/);
    if (daysMatch && daysMatch[1]) {
      const daysAgo = new Date(today.getTime() - parseInt(daysMatch[1]) * 86400000);
      return toISO(daysAgo);
    }
    const dateMatch = lastUpdated.match(/(\d{2})\/(\d{2})\/(\d{4})/);
    if (dateMatch) {
      return `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`;
    }
    const isoMatch = lastUpdated.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      return isoMatch[0];
    }
    return toISO(today);
  };

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
  };

  const formatLastUpdatedDisplay = (lastUpdated?: string): string => {
    if (!lastUpdated) return '';
    
    const formatDDMM = (d: Date) => {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      return `${day}/${month}`;
    };

    // Tentar processar como Data ISO
    const dateObj = new Date(lastUpdated);
    if (!isNaN(dateObj.getTime())) {
      const hours = String(dateObj.getHours()).padStart(2, '0');
      const mins = String(dateObj.getMinutes()).padStart(2, '0');
      return `${formatDDMM(dateObj)} - ${hours}:${mins}`;
    }

    const lower = lastUpdated.toLowerCase();
    
    if (lower.includes('hoje')) {
      const timeMatch = lastUpdated.match(/(\d{2}:\d{2})/);
      const time = timeMatch ? timeMatch[1] : '00:00';
      return `${formatDDMM(new Date())} - ${time}`;
    }
    
    if (lower.includes('ontem')) {
      const yesterday = new Date(Date.now() - 86400000);
      const timeMatch = lastUpdated.match(/(\d{2}:\d{2})/);
      const time = timeMatch ? timeMatch[1] : '00:00';
      return `${formatDDMM(yesterday)} - ${time}`;
    }
    
    if (lower.includes('agora') || lower.includes('auditado') || lower.includes('sem entrada')) {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      return `${formatDDMM(now)} - ${hours}:${mins}`;
    }

    return lastUpdated;
  };

  const filtered = ingredients.filter(ing => {
    if (!isStockActive(ing)) return false;
    if (searchTerm && !ing.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (filterCat !== 'ALL' && ing.category !== filterCat) return false;
    if (dateFilterMode === 'EXACT' && exactDate) {
      const ingDate = getIngredientDateStr(ing.lastUpdated);
      if (ingDate !== exactDate) return false;
    }
    if (dateFilterMode === 'RANGE' && startDate && endDate) {
      const ingDate = getIngredientDateStr(ing.lastUpdated);
      if (ingDate < startDate || ingDate > endDate) return false;
    }
    return true;
  });

  const totalFilteredStockValue = filtered.reduce((acc, ing) => {
    let matchedProd: any;
    if (ing.id.startsWith('ing-prod-')) {
      const targetId = ing.id.replace('ing-prod-', '');
      matchedProd = products.find(p => p.id === targetId);
    }
    if (!matchedProd) {
      matchedProd = products.find(p => p.name.toLowerCase().trim() === ing.name.toLowerCase().trim());
    }
    if (!matchedProd) {
      matchedProd = products.find(p => 
        p.name.toLowerCase().includes(ing.name.toLowerCase()) || 
        ing.name.toLowerCase().includes(p.name.toLowerCase())
      );
    }
    const unitVal = matchedProd ? Math.max(0, matchedProd.price - matchedProd.costPrice) : (ing.costPerUnit || 0);
    return acc + (ing.currentStock * unitVal);
  }, 0);

  const handleStartAudit = () => {
    const initialCounts: { [id: string]: number } = {};
    ingredients.filter(isStockActive).forEach(i => {
      initialCounts[i.id] = i.currentStock;
    });
    setAuditCounts(initialCounts);
    setShowAuditWizard(true);
  };

  const handleFinishAudit = () => {
    const adjustments = Object.entries(auditCounts).map(([id, actualStock]) => ({
      ingredientId: id,
      actualStock: Number(actualStock)
    }));

    performInventoryAudit(currentUser?.name || 'Auditor', adjustments, auditNotes);
    setShowAuditWizard(false);

    // Trigger celebration confetti
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {
      // ignore
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      


      {/* Search, Actions and Filters Bar */}
      <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full xl:w-auto">
          <div className="relative w-full sm:w-80 md:w-96">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-600" />
            <input
              type="text"
              placeholder="Buscar insumo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="w-full sm:w-auto min-w-[180px]">
            <select
              value={filterCat}
              onChange={(e) => setFilterCat(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
            >
              <option value="ALL">Todas as Categorias</option>
              {customCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
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
                  ? 'bg-amber-500/15 border-amber-500 text-amber-950 font-bold shadow-xs'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Calendar className={`w-4 h-4 ${dateFilterMode !== 'ALL' ? 'text-amber-600' : 'text-slate-600'}`} />
                <span>
                  {dateFilterMode === 'ALL' && 'Filtro de Data'}
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
                    className="p-0.5 rounded-md hover:bg-amber-300/50 text-amber-800 font-bold"
                    title="Limpar filtro de data"
                  >
                    <X className="w-3.5 h-3.5" />
                  </span>
                )}
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </div>
            </button>

            {showDateFilter && (
              <div className="absolute left-0 top-full mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 z-50 space-y-4 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-amber-500" />
                    Filtrar por Data de Atualização
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
                    className={`py-1.5 rounded-lg transition cursor-pointer ${dateFilterMode === 'EXACT' ? 'bg-amber-500 text-slate-950 shadow-xs font-extrabold' : 'hover:text-slate-900'}`}
                  >
                    Dia Exato
                  </button>
                  <button
                    type="button"
                    onClick={() => setDateFilterMode('RANGE')}
                    className={`py-1.5 rounded-lg transition cursor-pointer ${dateFilterMode === 'RANGE' ? 'bg-amber-500 text-slate-950 shadow-xs font-extrabold' : 'hover:text-slate-900'}`}
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
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
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
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
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
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
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
                          className="px-2.5 py-1 bg-slate-100 hover:bg-amber-100 hover:text-amber-900 text-slate-700 rounded-lg text-[11px] font-bold transition cursor-pointer"
                        >
                          Últimos 7 dias
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setStartDate(new Date(Date.now() - 15 * 86400000).toISOString().split('T')[0]);
                            setEndDate(new Date().toISOString().split('T')[0]);
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-amber-100 hover:text-amber-900 text-slate-700 rounded-lg text-[11px] font-bold transition cursor-pointer"
                        >
                          15 dias
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setStartDate(new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]);
                            setEndDate(new Date().toISOString().split('T')[0]);
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-amber-100 hover:text-amber-900 text-slate-700 rounded-lg text-[11px] font-bold transition cursor-pointer"
                        >
                          30 dias
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setStartDate(new Date(Date.now() - 60 * 86400000).toISOString().split('T')[0]);
                            setEndDate(new Date().toISOString().split('T')[0]);
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-amber-100 hover:text-amber-900 text-slate-700 rounded-lg text-[11px] font-bold transition cursor-pointer"
                        >
                          60 dias
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setStartDate(new Date(Date.now() - 90 * 86400000).toISOString().split('T')[0]);
                            setEndDate(new Date().toISOString().split('T')[0]);
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-amber-100 hover:text-amber-900 text-slate-700 rounded-lg text-[11px] font-bold transition cursor-pointer"
                        >
                          90 dias
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
                    className="px-4 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-extrabold rounded-xl shadow-md hover:from-amber-400 hover:to-amber-500 transition cursor-pointer"
                  >
                    Concluir
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-200 whitespace-nowrap hidden sm:flex">
             <div className="flex flex-col">
               <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Valor do Estoque Exibido</span>
               <span className="text-sm font-extrabold text-emerald-950">
                 R$ {totalFilteredStockValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
               </span>
             </div>
          </div>
        </div>

        {/* Mobile version of total stock value (shows on small screens below the filters) */}
        <div className="flex sm:hidden items-center justify-between gap-2 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-200">
           <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Valor do Estoque</span>
           <span className="text-sm font-extrabold text-emerald-950">
             R$ {totalFilteredStockValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
           </span>
        </div>
      </div>

      {dateFilterMode !== 'ALL' && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-amber-500/10 border border-amber-500/30 px-4 py-2.5 rounded-2xl text-xs text-amber-950 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 font-semibold">
            <Calendar className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>
              Filtrando por data de atualização: {' '}
              <strong className="font-extrabold text-amber-950">
                {dateFilterMode === 'EXACT' && `Dia exato (${formatDateDisplay(exactDate)})`}
                {dateFilterMode === 'RANGE' && `Período (${formatDateDisplay(startDate)} a ${formatDateDisplay(endDate)})`}
              </strong>
            </span>
            <span className="bg-amber-500/20 text-amber-950 px-2 py-0.5 rounded-full text-[11px] font-bold ml-1">
              {filtered.length} {filtered.length === 1 ? 'insumo' : 'insumos'}
            </span>
          </div>
          <button
            onClick={() => {
              setDateFilterMode('ALL');
              setShowDateFilter(false);
            }}
            className="text-amber-800 hover:text-amber-950 font-bold underline cursor-pointer self-end sm:self-center"
          >
            Remover filtro de data
          </button>
        </div>
      )}

      {/* Ingredients Grid Table */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/60 text-slate-700 text-xs font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-5">Produtos</th>
                <th className="py-3.5 px-5">Unidade</th>
                <th className="py-3.5 px-5">Qtd Estoque</th>
                <th className="py-3.5 px-5">Valor Estoque</th>
                <th className="py-3.5 px-5">Categorias</th>
                <th className="py-3.5 px-5">Atualização</th>
                <th className="py-3.5 px-5">Operador</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-700 text-xs">
                    Nenhum insumo encontrado.
                  </td>
                </tr>
              ) : (
                filtered.map(ing => {
                  const isCritical = ing.currentStock <= ing.minStock;
                  
                  let matchedProd: Product | undefined;
                  if (ing.id.startsWith('ing-prod-')) {
                    const targetId = ing.id.replace('ing-prod-', '');
                    matchedProd = products.find(p => p.id === targetId);
                  }
                  if (!matchedProd) {
                    matchedProd = products.find(p => p.name.toLowerCase().trim() === ing.name.toLowerCase().trim());
                  }
                  if (!matchedProd) {
                    matchedProd = products.find(p => 
                      p.name.toLowerCase().includes(ing.name.toLowerCase()) || 
                      ing.name.toLowerCase().includes(p.name.toLowerCase())
                    );
                  }
                  // O valor em estoque deve trabalhar sempre em cima do lucro gerado na aba de Produtos (preço de venda - custo)
                  const unitVal = matchedProd ? Math.max(0, matchedProd.price - matchedProd.costPrice) : (ing.costPerUnit || 0);
                  const totalStockVal = ing.currentStock * unitVal;
                  
                  return (
                    <tr key={ing.id} className="hover:bg-slate-100/40 transition">
                      <td className="py-3.5 px-5">
                        <div className="font-bold text-slate-900 flex items-center gap-3">
                          {matchedProd && matchedProd.image && matchedProd.image !== 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=80' ? (
                            <img src={matchedProd.image} alt={ing.name} className="w-10 h-10 rounded-xl object-cover shadow-sm border border-slate-200" />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                               <Package className="w-5 h-5" />
                            </div>
                          )}
                          <span className="text-[15px]">{ing.name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-5 text-xs text-slate-700 font-bold uppercase">
                        {ing.unit}
                      </td>

                      <td className="py-3.5 px-5 text-[15px] font-extrabold text-slate-900 whitespace-nowrap">
                        {ing.currentStock}
                      </td>

                      <td className="py-3.5 px-5 whitespace-nowrap">
                        <div className="font-extrabold text-slate-900 text-sm">
                          R$ {totalStockVal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="text-[11px] font-bold text-emerald-600">
                          R$ {unitVal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / un
                        </div>
                      </td>

                      <td className="py-3.5 px-5">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap">
                          {ing.category || 'GERAL'}
                        </span>
                      </td>

                      <td className="py-3.5 px-5 text-xs font-medium text-slate-700">
                        {formatLastUpdatedDisplay(ing.lastUpdated)}
                      </td>

                      <td className="py-3.5 px-5">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 font-semibold text-xs whitespace-nowrap shadow-2xs">
                          <div className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-black text-[9px]">
                            {(ing.operator || 'Carlos Mendes').charAt(0).toUpperCase()}
                          </div>
                          <span>{ing.operator || 'Carlos Mendes'}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>



      {/* Audit Wizard Modal */}
      {showAuditWizard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-50/80 backdrop-blur-md">
          <div className="bg-white border border-purple-500/40 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl">
            <div className="p-6 border-b border-slate-200 bg-purple-950/40 rounded-t-3xl">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-purple-400" />
                <span>Conferência Física de Inventário</span>
              </h3>
              <p className="text-xs text-purple-300 mt-1">
                Insira a contagem real encontrada no estoque da lanchonete. O sistema conciliará as diferenças automaticamente.
              </p>
            </div>

            <div className="p-6 overflow-y-auto max-h-[50vh] space-y-3">
              <div className="grid grid-cols-12 gap-2 text-xs font-bold text-slate-700 pb-2 border-b border-slate-200">
                <div className="col-span-6">Insumo</div>
                <div className="col-span-3">Estoque do Sistema</div>
                <div className="col-span-3">Contagem Física Real</div>
              </div>

              {ingredients.filter(isStockActive).map(ing => (
                <div key={ing.id} className="grid grid-cols-12 gap-2 items-center text-xs py-1.5 border-b border-slate-200/50">
                  <div className="col-span-6 font-bold text-slate-900 truncate">{ing.name}</div>
                  <div className="col-span-3 text-slate-700 font-semibold">{ing.currentStock} {ing.unit}</div>
                  <div className="col-span-3">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={auditCounts[ing.id] !== undefined ? quantityMask(auditCounts[ing.id]) : quantityMask(ing.currentStock)}
                      onChange={(e) => setAuditCounts({ ...auditCounts, [ing.id]: parseQuantity(e.target.value) })}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-bold text-right focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 border-t border-slate-200 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Observações do Fechamento de Turno</label>
                <input
                  type="text"
                  placeholder="Ex: Contagem realizada com chefe de cozinha às 23h"
                  value={auditNotes}
                  onChange={(e) => setAuditNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAuditWizard(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleFinishAudit}
                  className="px-5 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-slate-900 font-bold rounded-xl text-xs shadow-md transition cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Concluir Auditoria & Conciliar</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
