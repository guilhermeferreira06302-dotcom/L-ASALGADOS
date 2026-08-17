import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { FinancialTransaction, TransactionCategory, TransactionType } from '../../types';
import { 
  DollarSign, ArrowDownRight, ArrowUpRight, Plus, Filter, 
  Calendar, FileText, CheckCircle, Search, X, ChevronDown, AlertTriangle
} from 'lucide-react';
import { currencyMask, parseCurrency } from '../../utils/masks';

export const FinancialAnalysis: React.FC = () => {
  const { transactions, addTransaction, stockMovements, ingredients, orders, products, settlePendingDebt, convertLoss, convertDebtToLoss } = useApp();
  const [filterType, setFilterType] = useState<string>('TODOS');
  const [filterCategory, setFilterCategory] = useState<string>('TODAS');
  const [searchTerm, setSearchTerm] = useState('');
  
  const categories = [
    { id: 'TODAS', label: 'Todas as Categorias' },
    { id: 'VENDAS', label: 'Vendas' },
    { id: 'FORNECEDOR', label: 'Fornecedor / Insumos' },
    { id: 'SALARIO', label: 'Salários & Folha' },
    { id: 'MANUTENCAO', label: 'Manutenção & Contas' },
    { id: 'IMPOSTOS', label: 'Impostos' },
    { id: 'PREJUIZO', label: 'Prejuízos de Estoque' },
  ];

  // Date filter states
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [dateFilterMode, setDateFilterMode] = useState<'ALL' | 'EXACT' | 'RANGE'>('ALL');
  const [exactDate, setExactDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [startDate, setStartDate] = useState<string>(new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  const [showModal, setShowModal] = useState(false);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [showLossModal, setShowLossModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
  };

  // Form states
  const [type, setType] = useState<TransactionType>('SAIDA');
  const [category, setCategory] = useState<TransactionCategory>('MANUTENCAO');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  const filtered = transactions.filter(t => {
    if (filterType !== 'TODOS' && t.type !== filterType) return false;
    if (filterCategory !== 'TODAS' && t.category !== filterCategory) return false;
    if (searchTerm && !t.description.toLowerCase().includes(searchTerm.toLowerCase())) return false;

    if (dateFilterMode === 'EXACT' && exactDate) {
      if (t.date !== exactDate) return false;
    }
    if (dateFilterMode === 'RANGE' && startDate && endDate) {
      if (t.date < startDate || t.date > endDate) return false;
    }

    return true;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const manualIn = filtered
    .filter(t => t.type === 'ENTRADA')
    .reduce((sum, t) => sum + t.amount, 0);

  // Filter stock movements by the same date range if needed
  const filteredMovements = stockMovements.filter(m => {
    if (dateFilterMode === 'EXACT' && exactDate) {
      if (m.date.split('T')[0] !== exactDate) return false;
    }
    if (dateFilterMode === 'RANGE' && startDate && endDate) {
      if (m.date.split('T')[0] < startDate || m.date.split('T')[0] > endDate) return false;
    }
    return true;
  });

  const stockSales = filteredMovements
    .filter(m => m.type === 'SAIDA' && m.reason !== 'Prejuízo' && m.paymentMethod !== 'Pegou Fiado' && m.paymentMethod !== 'Prejuízo')
    .reduce((sum, m) => {
       const prodId = m.ingredientId.replace('ing-prod-', '');
       const prod = products.find(p => p.id === prodId);
       return sum + ((prod?.price || 0) * m.quantity);
    }, 0);

  const totalIn = manualIn + stockSales;

  const manualLoss = filtered
    .filter(t => t.type === 'SAIDA' && t.category === 'PREJUIZO')
    .reduce((sum, t) => sum + t.amount, 0);

  const stockLoss = filteredMovements
    .filter(m => m.type === 'SAIDA' && (m.reason === 'Prejuízo' || m.paymentMethod === 'Prejuízo'))
    .reduce((sum, m) => {
       const prodId = m.ingredientId.replace('ing-prod-', '');
       const prod = products.find(p => p.id === prodId);
       return sum + ((prod?.costPrice || 0) * m.quantity);
    }, 0);

  const totalLoss = manualLoss + stockLoss;

  const manualOut = filtered
    .filter(t => t.type === 'SAIDA' && t.category !== 'PREJUIZO')
    .reduce((sum, t) => sum + t.amount, 0);

  const stockCogs = filteredMovements
    .filter(m => m.type === 'SAIDA' && m.reason !== 'Prejuízo' && m.paymentMethod !== 'Prejuízo')
    .reduce((sum, m) => {
       const prodId = m.ingredientId.replace('ing-prod-', '');
       const prod = products.find(p => p.id === prodId);
       return sum + ((prod?.costPrice || 0) * m.quantity);
    }, 0);

  const pendingDebtsList = filteredMovements.filter(m => m.type === 'SAIDA' && m.reason !== 'Prejuízo' && m.paymentMethod === 'Pegou Fiado');
  const lossList = filteredMovements.filter(m => m.type === 'SAIDA' && (m.reason === 'Prejuízo' || m.paymentMethod === 'Prejuízo'));

  const saldoPendente = pendingDebtsList.reduce((sum, m) => {
       const prodId = m.ingredientId.replace('ing-prod-', '');
       const prod = products.find(p => p.id === prodId);
       return sum + ((prod?.price || 0) * m.quantity);
    }, 0);

  const balance = totalIn - (manualOut + stockCogs) - totalLoss;

  const stockSalesTransactions: FinancialTransaction[] = filteredMovements
    .filter(m => m.type === 'SAIDA' && m.reason !== 'Prejuízo' && m.paymentMethod !== 'Pegou Fiado' && m.paymentMethod !== 'Prejuízo')
    .map(m => {
       const prodId = m.ingredientId.replace('ing-prod-', '');
       const prod = products.find(p => p.id === prodId);
       return {
         id: `virt-sale-${m.id}`,
         date: m.date,
         type: 'ENTRADA',
         category: 'VENDAS',
         amount: ((prod?.price || 0) * m.quantity),
         description: `Faturamento de Estoque: ${m.ingredientName} (${m.quantity} un) - ${m.paymentMethod || 'Dinheiro'}`
       } as FinancialTransaction;
    });

  const stockFiadoTransactions: FinancialTransaction[] = filteredMovements
    .filter(m => m.type === 'SAIDA' && m.reason !== 'Prejuízo' && m.paymentMethod === 'Pegou Fiado')
    .map(m => {
       const prodId = m.ingredientId.replace('ing-prod-', '');
       const prod = products.find(p => p.id === prodId);
       return {
         id: `virt-fiado-${m.id}`,
         date: m.date,
         type: 'ENTRADA',
         category: 'VENDAS',
         amount: ((prod?.price || 0) * m.quantity),
         description: `Saldo Pendente (Fiado): ${m.ingredientName} (${m.quantity} un)`
       } as FinancialTransaction;
    });

  const allDisplayTransactions = [...filtered, ...stockSalesTransactions, ...stockFiadoTransactions]
    .filter(t => {
      if (t.id.startsWith('virt-')) {
        if (filterType !== 'TODOS' && t.type !== filterType) return false;
        if (filterCategory !== 'TODAS' && t.category !== filterCategory) return false;
        if (searchTerm && !t.description.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      }
      return true;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Date-based Pagination Logic
  const uniqueDates = Array.from(new Set(allDisplayTransactions.map(t => t.date.split('T')[0]))).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  
  // Se o total de dias mudar após um filtro, garantir que a página não fique fora do limite
  if (currentPage > uniqueDates.length && uniqueDates.length > 0) {
    setCurrentPage(1);
  }

  const currentDate = uniqueDates[currentPage - 1];
  const paginatedTransactions = allDisplayTransactions.filter(t => t.date.split('T')[0] === currentDate);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description) return;
    addTransaction({
      date: new Date().toISOString().split('T')[0],
      type,
      category,
      amount: parseCurrency(amount),
      description
    });
    setAmount('');
    setDescription('');
    setShowModal(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-white via-white to-emerald-50 p-6 rounded-3xl border border-slate-200 shadow-xl">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-emerald-500" />
            <span>Análise Financeira & Caixa</span>
          </h2>
          <p className="text-xs text-slate-700 mt-1">
            Controle completo de faturamento de vendas, custos operacionais e margem líquida.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-bold text-sm shadow-md transition cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Receita / Despesa</span>
        </button>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-slate-200">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Faturamento</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-extrabold text-slate-900 mt-2">R$ {totalIn.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
          <p className="text-[11px] text-slate-700 mt-1">Valor total faturado no período</p>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-orange-400">Saldo Pendente</span>
              <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center text-orange-400">
                <ArrowDownRight className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-2">R$ {saldoPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
            <p className="text-[11px] text-slate-700 mt-1 mb-3">Valor total de vendas no fiado</p>
          </div>
          {saldoPendente > 0 && (
            <button
              onClick={() => setShowPendingModal(true)}
              className="w-full py-2 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Ver e Quitar Dívidas
            </button>
          )}
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-500">Prejuízo</span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center text-rose-500">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-extrabold text-slate-900 mt-2">R$ {totalLoss.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
          <p className="text-[11px] text-slate-700 mt-1 mb-3">Perdas e descartes do período</p>
          {lossList.length > 0 && (
            <button
              onClick={() => setShowLossModal(true)}
              className="w-full py-2 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Ver e Resolver Prejuízos
            </button>
          )}
        </div>


      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
        
        {/* Top row: Search and Dropdowns */}
        <div className="flex flex-wrap items-center gap-3 w-full">
          <div className="relative flex-1 min-w-[250px]">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-600" />
            <input
              type="text"
              placeholder="Buscar por descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>


          <div className="relative min-w-[190px]">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Filter className="w-4 h-4 text-slate-500" />
            </div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer appearance-none"
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.label}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
              <ChevronDown className="w-4 h-4 text-slate-500" />
            </div>
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
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold shadow-xs'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Calendar className={`w-4 h-4 ${dateFilterMode !== 'ALL' ? 'text-emerald-600' : 'text-slate-600'}`} />
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
                    className="p-0.5 rounded-md hover:bg-emerald-100 text-emerald-800 font-bold"
                    title="Limpar filtro de data"
                  >
                    <X className="w-3.5 h-3.5" />
                  </span>
                )}
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </div>
            </button>

            {showDateFilter && (
              <div className="absolute right-0 sm:left-auto top-full mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 z-50 space-y-4 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-emerald-500" />
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
                    className={`py-1.5 rounded-lg transition cursor-pointer ${dateFilterMode === 'EXACT' ? 'bg-emerald-500 text-white shadow-xs font-extrabold' : 'hover:text-slate-900'}`}
                  >
                    Dia Exato
                  </button>
                  <button
                    type="button"
                    onClick={() => setDateFilterMode('RANGE')}
                    className={`py-1.5 rounded-lg transition cursor-pointer ${dateFilterMode === 'RANGE' ? 'bg-emerald-500 text-white shadow-xs font-extrabold' : 'hover:text-slate-900'}`}
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
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                          className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-100 hover:text-emerald-900 text-slate-700 rounded-lg text-[11px] font-bold transition cursor-pointer"
                        >
                          Últimos 7 dias
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setStartDate(new Date(Date.now() - 15 * 86400000).toISOString().split('T')[0]);
                            setEndDate(new Date().toISOString().split('T')[0]);
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-100 hover:text-emerald-900 text-slate-700 rounded-lg text-[11px] font-bold transition cursor-pointer"
                        >
                          15 dias
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setStartDate(new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]);
                            setEndDate(new Date().toISOString().split('T')[0]);
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-100 hover:text-emerald-900 text-slate-700 rounded-lg text-[11px] font-bold transition cursor-pointer"
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
                          className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-100 hover:text-emerald-900 text-slate-700 rounded-lg text-[11px] font-bold transition cursor-pointer"
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
                    className="px-4 py-1.5 bg-emerald-500 text-white font-extrabold rounded-xl shadow-md hover:bg-emerald-600 transition cursor-pointer"
                  >
                    Concluir
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden">
        <div className="p-5 border-b border-slate-200">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-500" />
            <span>Extrato Financeiro de Lançamentos</span>
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/60 text-slate-700 text-xs font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-5">Data</th>
                <th className="py-3 px-5">Descrição</th>
                <th className="py-3 px-5">Categoria</th>
                <th className="py-3 px-5">Tipo</th>
                <th className="py-3 px-5 text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-800">
              {paginatedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-700 text-xs">
                    Nenhum lançamento encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-slate-100/40 transition">
                    <td className="py-3.5 px-5 text-xs text-slate-700 flex items-center gap-1.5 whitespace-nowrap">
                      <Calendar className="w-3.5 h-3.5" />
                      {tx.date.split('T')[0].split('-').reverse().join('/')}
                    </td>
                    <td className="py-3.5 px-5 font-medium text-slate-900">
                      {tx.description}
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 border border-slate-300 text-slate-700">
                        {tx.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-5">
                      {(() => {
                        let text = tx.type;
                        let colorClass = tx.type === 'ENTRADA' 
                          ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30' 
                          : 'bg-red-500/20 text-red-500 border border-red-500/30';
                        let Icon = tx.type === 'ENTRADA' ? ArrowUpRight : ArrowDownRight;

                        if (tx.category === 'PREJUIZO') {
                          text = 'PREJUÍZO';
                          colorClass = 'bg-rose-500/20 text-rose-500 border border-rose-500/30';
                        } else if (tx.id.startsWith('virt-fiado-')) {
                          text = 'PENDENTE';
                          colorClass = 'bg-orange-500/20 text-orange-500 border border-orange-500/30';
                        }

                        return (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${colorClass}`}>
                            <Icon className="w-3 h-3" />
                            {text}
                          </span>
                        );
                      })()}
                    </td>
                    <td className={`py-3.5 px-5 text-right font-extrabold ${tx.type === 'ENTRADA' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {tx.type === 'ENTRADA' ? '+ ' : '- '}R$ {tx.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      {uniqueDates.length > 0 && (
        <div className="flex flex-col items-center justify-center mt-6 gap-3">
          <span className="text-sm text-slate-500">
            Exibindo dados do dia: <strong className="text-slate-700">{currentDate.split('-').reverse().join('/')}</strong>
          </span>
          <div className="flex flex-wrap justify-center gap-2">
            {uniqueDates.map((dateStr, idx) => (
              <button
                key={dateStr}
                onClick={() => setCurrentPage(idx + 1)}
                className={`w-10 h-10 flex items-center justify-center rounded-xl text-sm font-bold transition cursor-pointer ${
                  currentPage === idx + 1
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                }`}
                title={dateStr.split('-').reverse().join('/')}
              >
                {idx + 1}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Modal Nova Despesa */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-50/80 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              <span>Novo Registro Financeiro</span>
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Tipo de Movimentação</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setType('ENTRADA')}
                    className={`py-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      type === 'ENTRADA' ? 'bg-emerald-600 text-slate-900 shadow-md' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4" /> Entrada (Receita)
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('SAIDA')}
                    className={`py-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      type === 'SAIDA' ? 'bg-red-600 text-slate-900 shadow-md' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    <ArrowDownRight className="w-4 h-4" /> Saída (Despesa)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Categoria</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as TransactionCategory)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                >
                  <option value="VENDAS">Vendas / Caixa</option>
                  <option value="FORNECEDOR">Fornecedor / Compra de Insumos</option>
                  <option value="SALARIO">Salários / Adiantamentos</option>
                  <option value="MANUTENCAO">Manutenção / Contas (Luz, Água, Gás)</option>
                  <option value="IMPOSTOS">Impostos & Taxas</option>
                  <option value="PREJUIZO">Prejuízo (Perdas / Descarte)</option>
                  <option value="OUTROS">Outros</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Valor</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="R$ 0,00"
                  value={amount}
                  onChange={(e) => setAmount(currencyMask(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 text-base font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Descrição</label>
                <input
                  type="text"
                  placeholder="Ex: Compra de 50 pacotes de pão brioche"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-bold transition cursor-pointer"
                >
                  Confirmar Registro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Quitar Dívidas Pendentes */}
      {showPendingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-50/80 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-lg w-full shadow-2xl flex flex-col max-h-[80vh]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                <span>Dívidas Pendentes (Fiado)</span>
              </h3>
              <button onClick={() => setShowPendingModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="overflow-y-auto pr-2 space-y-3 flex-1 mb-4">
              {pendingDebtsList.length === 0 ? (
                <p className="text-center text-sm text-slate-500 py-6">Nenhuma dívida pendente.</p>
              ) : (
                pendingDebtsList.map(m => {
                  const prodId = m.ingredientId.replace('ing-prod-', '');
                  const prod = products.find(p => p.id === prodId);
                  const amount = ((prod?.price || 0) * m.quantity);
                  return (
                    <div key={m.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50 p-3 rounded-xl border border-slate-200 gap-3">
                      <div>
                        <p className="text-sm font-bold text-slate-900">{m.ingredientName} <span className="text-xs font-normal text-slate-500">({m.quantity} un)</span></p>
                        <p className="text-xs text-slate-500">{m.date.split('T')[0].split('-').reverse().join('/')} • Operador: {m.operator || 'Sistema'}</p>
                        {m.observation && (
                          <p className="text-xs text-slate-600 mt-1 bg-slate-100 p-1.5 rounded inline-block">Obs: {m.observation}</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2 w-full sm:w-auto">
                        <span className="font-extrabold text-orange-500">R$ {amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        <div className="flex gap-2 w-full sm:w-auto">
                          <button
                            onClick={async () => {
                              await convertDebtToLoss(m.id);
                              if (pendingDebtsList.length === 1) setShowPendingModal(false);
                            }}
                            className="flex-1 sm:flex-none px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap"
                          >
                            Mover p/ Prejuízo
                          </button>
                          <button
                            onClick={async () => {
                              await settlePendingDebt(m.id);
                              if (pendingDebtsList.length === 1) setShowPendingModal(false);
                            }}
                            className="flex-1 sm:flex-none px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap"
                          >
                            Mover p/ Faturamento
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowPendingModal(false)}
                className="px-5 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold cursor-pointer hover:bg-slate-200 transition"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Resolver Prejuízos */}
      {showLossModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-50/80 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-2xl w-full shadow-2xl flex flex-col max-h-[80vh]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-500" />
                <span>Prejuízos (Perdas e Descartes)</span>
              </h3>
              <button onClick={() => setShowLossModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="overflow-y-auto pr-2 space-y-3 flex-1 mb-4">
              {lossList.length === 0 ? (
                <p className="text-center text-sm text-slate-500 py-6">Nenhum prejuízo registrado neste período.</p>
              ) : (
                lossList.map(m => {
                  const prodId = m.ingredientId.replace('ing-prod-', '');
                  const prod = products.find(p => p.id === prodId);
                  const cost = ((prod?.costPrice || 0) * m.quantity);
                  return (
                    <div key={m.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50 p-3 rounded-xl border border-slate-200 gap-3">
                      <div>
                        <p className="text-sm font-bold text-slate-900">{m.ingredientName} <span className="text-xs font-normal text-slate-500">({m.quantity} un)</span></p>
                        <p className="text-xs text-slate-500">{m.date.split('T')[0].split('-').reverse().join('/')} • Operador: {m.operator || 'Sistema'}</p>
                        {m.observation && (
                          <p className="text-xs text-slate-600 mt-1 bg-slate-100 p-1.5 rounded inline-block">Obs: {m.observation}</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2 w-full sm:w-auto">
                        <span className="font-extrabold text-rose-500">Custo: R$ {cost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        <div className="flex gap-2 w-full sm:w-auto">
                          <button
                            onClick={async () => {
                              await convertLoss(m.id, 'PENDENTE');
                              if (lossList.length === 1) setShowLossModal(false);
                            }}
                            className="flex-1 sm:flex-none px-3 py-1.5 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap"
                          >
                            Mover para Fiado
                          </button>
                          <button
                            onClick={async () => {
                              await convertLoss(m.id, 'FATURAMENTO');
                              if (lossList.length === 1) setShowLossModal(false);
                            }}
                            className="flex-1 sm:flex-none px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap"
                          >
                            Mover p/ Faturamento
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowLossModal(false)}
                className="px-5 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold cursor-pointer hover:bg-slate-200 transition"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
