import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Lock, Unlock, Play, Square, DollarSign, User as UserIcon, CheckCircle, Clock } from 'lucide-react';
import { currencyMask, parseCurrency } from '../../utils/masks';

export const ShiftManagement: React.FC<{ isAdminView?: boolean }> = ({ isAdminView }) => {
  const { currentShift, openShift, closeShift, addTransaction, currentUser, shifts } = useApp();
  
  // Abertura states
  const [initialCashStr, setInitialCashStr] = useState('');
  const [operator, setOperator] = useState(currentUser?.name || '');
  
  // Fechamento states
  const [actualCashStr, setActualCashStr] = useState('');
  const [cardCashStr, setCardCashStr] = useState('');
  const [notes, setNotes] = useState('');
  const [showCloseModal, setShowCloseModal] = useState(false);

  const handleOpen = (e: React.FormEvent) => {
    e.preventDefault();
    if (!initialCashStr || !operator) return;
    openShift(parseCurrency(initialCashStr), operator);
  };

  const handleClose = (e: React.FormEvent) => {
    e.preventDefault();
    const cashValue = parseCurrency(actualCashStr || '0');
    const cardValue = parseCurrency(cardCashStr || '0');
    
    closeShift(cashValue, cardValue, currentUser?.name || 'Sistema', notes);
    
    setActualCashStr('');
    setCardCashStr('');
    setNotes('');
    setShowCloseModal(false);
  };

  const calculateWorkedHours = (openedAt: string, closedAt?: string) => {
    if (!closedAt) return '---';
    const start = new Date(openedAt).getTime();
    const end = new Date(closedAt).getTime();
    const diffMs = end - start;
    if (diffMs < 0) return '---';
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const renderHistory = () => {
    if (currentUser?.role !== 'ADMIN') return null;
    return (
        <div className={`w-full max-w-full bg-white p-6 rounded-3xl border border-slate-200 shadow-xl ${!isAdminView ? 'mt-12' : ''}`}>
          <div className="flex items-center gap-2 mb-6">
            <Clock className="w-5 h-5 text-emerald-500" />
            <h3 className="font-extrabold text-lg text-slate-900">Histórico de Turnos (Jornadas)</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-700 text-[11px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 rounded-tl-xl">Colaborador</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Início</th>
                  <th className="py-3 px-4">Término</th>
                  <th className="py-3 px-4">Tempo Trab.</th>
                  <th className="py-3 px-4">Fundo Inicial</th>
                  <th className="py-3 px-4 text-right">Vendas (Dinheiro)</th>
                  <th className="py-3 px-4 text-right">Vendas (Cartão)</th>
                  <th className="py-3 px-4 text-right rounded-tr-xl">Total Vendas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {shifts.length === 0 && !currentShift ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-500 text-xs">
                      Nenhum turno registrado.
                    </td>
                  </tr>
                ) : null}
                
                {/* Mostra o turno atual primeiro, se existir */}
                {currentShift && (
                  <tr className="bg-emerald-50/50">
                    <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                      <UserIcon className="w-4 h-4 text-slate-400" />
                      {currentShift.openedBy}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700">
                        EM ANDAMENTO
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs">
                      {new Date(currentShift.openedAt).toLocaleString('pt-BR')}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-400">
                      ---
                    </td>
                    <td className="py-3 px-4 text-xs font-medium text-slate-400">
                      ---
                    </td>
                    <td className="py-3 px-4 text-xs font-medium">
                      R$ {currentShift.initialCash.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-xs font-medium text-right text-slate-400">
                      ---
                    </td>
                    <td className="py-3 px-4 text-xs font-medium text-right text-slate-400">
                      ---
                    </td>
                    <td className="py-3 px-4 text-xs font-medium text-right text-slate-400">
                      ---
                    </td>
                  </tr>
                )}

                {shifts.map(shift => (
                  <tr key={shift.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                      <UserIcon className="w-4 h-4 text-slate-400" />
                      {shift.openedBy}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                        FECHADO
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs">
                      {new Date(shift.openedAt).toLocaleString('pt-BR')}
                    </td>
                    <td className="py-3 px-4 text-xs">
                      {shift.closedAt ? new Date(shift.closedAt).toLocaleString('pt-BR') : '---'}
                    </td>
                    <td className="py-3 px-4 text-xs font-medium">
                      {calculateWorkedHours(shift.openedAt, shift.closedAt)}
                    </td>
                    <td className="py-3 px-4 text-xs font-medium">
                      R$ {shift.initialCash.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-xs font-bold text-right text-emerald-600">
                      R$ {(shift.finalCashActual || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-xs font-bold text-right text-blue-600">
                      R$ {(shift.finalCardActual || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-xs font-extrabold text-right text-slate-900 bg-slate-50/50">
                      R$ {((shift.finalCashActual || 0) + (shift.finalCardActual || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
    );
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 animate-in fade-in duration-300">
      
      {!isAdminView && !currentShift && (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl max-w-md w-full space-y-6">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-slate-400" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900">Caixa Fechado</h2>
            <p className="text-sm text-slate-500 mt-2">
              Nenhum turno está aberto no momento. O sistema operacional e o PDV estão bloqueados.
            </p>
          </div>

          <form onSubmit={handleOpen} className="space-y-4 pt-4 border-t border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Fundo de Caixa Inicial (Troco)
              </label>
              <div className="relative">
                <DollarSign className="w-5 h-5 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="R$ 0,00"
                  value={initialCashStr}
                  onChange={(e) => setInitialCashStr(currencyMask(e.target.value))}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Operador Responsável
              </label>
              <div className="relative">
                <UserIcon className="w-5 h-5 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="Nome do operador"
                  value={operator}
                  onChange={(e) => setOperator(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-extrabold text-sm shadow-md shadow-emerald-500/20 transition cursor-pointer mt-4"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>Abrir Turno e Liberar Sistema</span>
            </button>
          </form>
        </div>
      )}

      {!isAdminView && currentShift && (
        <div className="bg-white p-8 rounded-3xl border border-emerald-100 shadow-xl shadow-emerald-500/10 max-w-md w-full space-y-6 relative overflow-hidden">
          
          {/* Enfeite visual */}
          <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500" />

          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4 border-4 border-emerald-100">
              <Unlock className="w-8 h-8 text-emerald-500" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900">Turno em Andamento</h2>
            <p className="text-sm text-slate-500 mt-2">
              Operador: <span className="font-bold text-slate-700">{currentShift.openedBy}</span>
            </p>
            <div className="flex items-center gap-1 mt-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
              <CheckCircle className="w-3.5 h-3.5" />
              Sistema Operacional Liberado
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100">
            <button
              onClick={() => setShowCloseModal(true)}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-extrabold text-sm shadow-md shadow-rose-500/20 transition cursor-pointer"
            >
              <Square className="w-5 h-5 fill-current" />
              <span>Encerrar Turno</span>
            </button>
          </div>
        </div>
      )}

      {/* Histórico de Turnos */}
      {renderHistory()}

      {/* Modal de Fechamento de Turno */}
      {showCloseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-rose-50">
              <h2 className="font-extrabold text-rose-900 flex items-center gap-2">
                <Square className="w-5 h-5" />
                Informações de Venda do Turno
              </h2>
            </div>
            
            <form onSubmit={handleClose} className="p-6 space-y-5 overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Quanto vendeu em Dinheiro?
                </label>
                <div className="relative">
                  <DollarSign className="w-5 h-5 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="R$ 0,00"
                    value={actualCashStr}
                    onChange={(e) => setActualCashStr(currencyMask(e.target.value))}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Quanto vendeu em Cartão?
                </label>
                <div className="relative">
                  <DollarSign className="w-5 h-5 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="R$ 0,00"
                    value={cardCashStr}
                    onChange={(e) => setCardCashStr(currencyMask(e.target.value))}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Observações (Quebras/Sobras)
                </label>
                <textarea
                  placeholder="Ex: Faltou 5 reais de troco..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 transition resize-none h-20"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCloseModal(false)}
                  className="flex-1 py-3 text-slate-600 font-bold bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-extrabold text-sm shadow-md shadow-rose-500/20 transition cursor-pointer"
                >
                  <span>Finalizar Definitivamente</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
