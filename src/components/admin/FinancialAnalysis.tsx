import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { FinancialTransaction, TransactionCategory, TransactionType } from '../../types';
import { 
  DollarSign, ArrowDownRight, ArrowUpRight, Plus, Filter, 
  Calendar, FileText, CheckCircle
} from 'lucide-react';
import { currencyMask, parseCurrency } from '../../utils/masks';

export const FinancialAnalysis: React.FC = () => {
  const { transactions, addTransaction } = useApp();
  const [filterType, setFilterType] = useState<string>('TODOS');
  const [filterCategory, setFilterCategory] = useState<string>('TODAS');
  const [showModal, setShowModal] = useState(false);

  // Form states
  const [type, setType] = useState<TransactionType>('SAIDA');
  const [category, setCategory] = useState<TransactionCategory>('MANUTENCAO');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  const filtered = transactions.filter(t => {
    if (filterType !== 'TODOS' && t.type !== filterType) return false;
    if (filterCategory !== 'TODAS' && t.category !== filterCategory) return false;
    return true;
  });

  const totalIn = transactions.filter(t => t.type === 'ENTRADA').reduce((s, t) => s + t.amount, 0);
  const totalOut = transactions.filter(t => t.type === 'SAIDA').reduce((s, t) => s + t.amount, 0);
  const balance = totalIn - totalOut;

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 p-6 rounded-3xl border border-slate-200 shadow-xl">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-emerald-400" />
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-slate-200">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Total de Entradas</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-extrabold text-slate-900 mt-2">R$ {totalIn.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
          <p className="text-[11px] text-slate-700 mt-1">Vendas PDV, Delivery & Encomendas</p>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-red-400">Total de Saídas</span>
            <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center text-red-400">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-extrabold text-slate-900 mt-2">R$ {totalOut.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
          <p className="text-[11px] text-slate-700 mt-1">Fornecedores, Salários, Impostos & Manutenção</p>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Saldo Operacional</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <h3 className={`text-2xl font-extrabold mt-2 ${balance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </h3>
          <p className="text-[11px] text-slate-700 mt-1">Resultado Líquido do Período</p>
        </div>
      </div>

      {/* Filters & Table */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-400" />
            <span>Extrato Financeiro de Lançamentos</span>
          </h3>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-700 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Filtrar:
            </span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="TODOS">Todas as Operações</option>
              <option value="ENTRADA">🟢 Entradas (Vendas)</option>
              <option value="SAIDA">🔴 Saídas (Despesas)</option>
            </select>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="TODAS">Todas as Categorias</option>
              <option value="VENDAS">Vendas</option>
              <option value="FORNECEDOR">Fornecedor / Insumos</option>
              <option value="SALARIO">Salários & Folha</option>
              <option value="MANUTENCAO">Manutenção & Contas</option>
              <option value="IMPOSTOS">Impostos</option>
            </select>
          </div>
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
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-700 text-xs">
                    Nenhum lançamento encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filtered.map(tx => (
                  <tr key={tx.id} className="hover:bg-slate-100/40 transition">
                    <td className="py-3.5 px-5 text-xs text-slate-700 flex items-center gap-1.5 whitespace-nowrap">
                      <Calendar className="w-3.5 h-3.5" />
                      {tx.date.split('-').reverse().join('/')}
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
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                        tx.type === 'ENTRADA' 
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                          : 'bg-red-500/20 text-red-300 border border-red-500/30'
                      }`}>
                        {tx.type === 'ENTRADA' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {tx.type}
                      </span>
                    </td>
                    <td className={`py-3.5 px-5 text-right font-extrabold ${tx.type === 'ENTRADA' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {tx.type === 'ENTRADA' ? '+ ' : '- '}R$ {tx.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

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

    </div>
  );
};
