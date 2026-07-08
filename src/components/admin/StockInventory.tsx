import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Ingredient } from '../../types';
import { 
  Package, AlertTriangle, CheckCircle2, Plus, RefreshCw, 
  Search, SlidersHorizontal, ArrowUpRight, ClipboardCheck, Sparkles 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { currencyMask, parseCurrency, quantityMask, parseQuantity } from '../../utils/masks';

export const StockInventory: React.FC = () => {
  const { ingredients, addIngredient, adjustStock, performInventoryAudit, audits, currentUser } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState<'ALL' | 'CRITICAL' | 'SAFE'>('ALL');

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showAuditWizard, setShowAuditWizard] = useState(false);
  const [selectedIng, setSelectedIng] = useState<Ingredient | null>(null);

  // New Ingredient form
  const [name, setName] = useState('');
  const [unit, setUnit] = useState<'kg' | 'g' | 'l' | 'ml' | 'un'>('un');
  const [currentStock, setCurrentStock] = useState('');
  const [minStock, setMinStock] = useState('');
  const [costPerUnit, setCostPerUnit] = useState('');
  const [supplier, setSupplier] = useState('');

  // Adjust stock form
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustReason, setAdjustReason] = useState('Reposição de Compra de Fornecedor');

  // Audit wizard state
  const [auditCounts, setAuditCounts] = useState<{ [id: string]: number }>({});
  const [auditNotes, setAuditNotes] = useState('');

  const filtered = ingredients.filter(ing => {
    if (searchTerm && !ing.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (filterLevel === 'CRITICAL' && ing.currentStock > ing.minStock) return false;
    if (filterLevel === 'SAFE' && ing.currentStock <= ing.minStock) return false;
    return true;
  });

  const handleCreateIngredient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !currentStock || !minStock) return;
    addIngredient({
      name,
      unit,
      currentStock: parseQuantity(currentStock),
      minStock: parseQuantity(minStock),
      costPerUnit: parseCurrency(costPerUnit),
      supplier: supplier || 'Fornecedor Padrão'
    });
    setName('');
    setCurrentStock('');
    setMinStock('');
    setCostPerUnit('');
    setSupplier('');
    setShowAddModal(false);
  };

  const handleConfirmAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIng || !adjustQty) return;
    adjustStock(selectedIng.id, parseQuantity(adjustQty), adjustReason);
    setAdjustQty('');
    setShowAdjustModal(false);
    setSelectedIng(null);
  };

  const handleStartAudit = () => {
    const initialCounts: { [id: string]: number } = {};
    ingredients.forEach(i => {
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
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 p-6 rounded-3xl border border-slate-200 shadow-xl">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Package className="w-6 h-6 text-amber-400" />
            <span>Controle de Estoque & Inventário</span>
          </h2>
          <p className="text-xs text-slate-700 mt-1">
            Monitoramento em tempo real de matérias-primas com dedução automática por receita a cada venda no PDV.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleStartAudit}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-slate-900 font-bold text-xs shadow-md transition cursor-pointer"
          >
            <ClipboardCheck className="w-4 h-4" />
            <span>Auditoria de Inventário</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-md transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Insumo</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-600" />
          <input
            type="text"
            placeholder="Buscar insumo ou fornecedor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <SlidersHorizontal className="w-4 h-4 text-slate-700 hidden sm:block" />
          <div className="grid grid-cols-3 gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200 w-full sm:w-auto text-xs font-semibold">
            <button
              onClick={() => setFilterLevel('ALL')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer ${filterLevel === 'ALL' ? 'bg-amber-500 text-slate-950' : 'text-slate-700 hover:text-slate-900'}`}
            >
              Todos ({ingredients.length})
            </button>
            <button
              onClick={() => setFilterLevel('CRITICAL')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer ${filterLevel === 'CRITICAL' ? 'bg-red-500 text-slate-900' : 'text-slate-700 hover:text-slate-900'}`}
            >
              Críticos ({ingredients.filter(i => i.currentStock <= i.minStock).length})
            </button>
            <button
              onClick={() => setFilterLevel('SAFE')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer ${filterLevel === 'SAFE' ? 'bg-emerald-500 text-slate-900' : 'text-slate-700 hover:text-slate-900'}`}
            >
              Seguros ({ingredients.filter(i => i.currentStock > i.minStock).length})
            </button>
          </div>
        </div>
      </div>

      {/* Ingredients Grid Table */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/60 text-slate-700 text-xs font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-5">Insumo / Matéria-Prima</th>
                <th className="py-3.5 px-5">Nível de Estoque</th>
                <th className="py-3.5 px-5">Fornecedor</th>
                <th className="py-3.5 px-5">Custo Unitário</th>
                <th className="py-3.5 px-5">Atualização</th>
                <th className="py-3.5 px-5 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-700 text-xs">
                    Nenhum insumo encontrado.
                  </td>
                </tr>
              ) : (
                filtered.map(ing => {
                  const isCritical = ing.currentStock <= ing.minStock;
                  const ratio = Math.min(100, (ing.currentStock / (ing.minStock * 2)) * 100);
                  
                  return (
                    <tr key={ing.id} className="hover:bg-slate-100/40 transition">
                      <td className="py-3.5 px-5">
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          <span>{ing.name}</span>
                          {isCritical && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/30">
                              <AlertTriangle className="w-3 h-3" /> Repor
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-700">Unidade: {ing.unit.toUpperCase()}</span>
                      </td>

                      <td className="py-3.5 px-5 min-w-[180px]">
                        <div className="flex justify-between text-xs mb-1 font-bold">
                          <span className={isCritical ? 'text-red-400' : 'text-emerald-400'}>
                            {ing.currentStock} {ing.unit}
                          </span>
                          <span className="text-slate-600 text-[10px]">Mín: {ing.minStock} {ing.unit}</span>
                        </div>
                        <div className="w-full h-2 bg-slate-50 rounded-full overflow-hidden border border-slate-200">
                          <div 
                            className={`h-full transition-all duration-300 ${isCritical ? 'bg-red-500' : ratio < 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                            style={{ width: `${Math.max(10, ratio)}%` }}
                          ></div>
                        </div>
                      </td>

                      <td className="py-3.5 px-5 text-xs text-slate-700">
                        {ing.supplier}
                      </td>

                      <td className="py-3.5 px-5 text-xs font-semibold text-slate-700">
                        R$ {ing.costPerUnit.toFixed(3)} / {ing.unit}
                      </td>

                      <td className="py-3.5 px-5 text-[11px] text-slate-700">
                        {ing.lastUpdated}
                      </td>

                      <td className="py-3.5 px-5 text-right">
                        <button
                          onClick={() => {
                            setSelectedIng(ing);
                            setShowAdjustModal(true);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-amber-400 text-xs font-bold border border-slate-300 transition cursor-pointer inline-flex items-center gap-1"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Repor / Ajustar</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit History Card */}
      {audits.length > 0 && (
        <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-xl">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
            <ClipboardCheck className="w-4 h-4 text-purple-400" />
            <span>Últimas Auditorias de Contagem Física</span>
          </h3>
          <div className="space-y-2">
            {audits.map(aud => (
              <div key={aud.id} className="p-3 rounded-2xl bg-slate-50/60 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div>
                  <span className="font-bold text-slate-900">{aud.date}</span>
                  <span className="text-slate-700 ml-2">por {aud.auditorName}</span>
                  <p className="text-[11px] text-slate-700 mt-0.5">{aud.notes}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-medium">
                    {aud.itemsAudited} insumos conferidos
                  </span>
                  {aud.discrepanciesCount > 0 ? (
                    <span className="px-2.5 py-1 rounded-lg bg-red-500/20 text-red-300 font-bold border border-red-500/30">
                      {aud.discrepanciesCount} divergências
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                      100% Exato
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Adjust Stock */}
      {showAdjustModal && selectedIng && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-50/80 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-amber-400" />
              <span>Reposição ou Baixa de Estoque</span>
            </h3>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <p className="font-bold text-slate-900">{selectedIng.name}</p>
              <p className="text-slate-700">Estoque Atual: <span className="text-amber-400 font-bold">{selectedIng.currentStock} {selectedIng.unit}</span></p>
            </div>

            <form onSubmit={handleConfirmAdjust} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Quantidade a Adicionar (+) ou Subtrair (-)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder={`ex: 50 para entrada, -5 para perda`}
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(quantityMask(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 text-base font-bold focus:ring-2 focus:ring-amber-500"
                  required
                />
                <p className="text-[11px] text-slate-600 mt-1">Dica: Use números negativos (ex: -10) caso tenha havido quebra/descarte.</p>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Motivo do Ajuste</label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                >
                  <option value="Reposição de Compra de Fornecedor">Reposição de Compra de Fornecedor</option>
                  <option value="Ajuste Operacional / Contagem">Ajuste Operacional / Contagem</option>
                  <option value="Descarte por Validade / Quebra">Descarte por Validade / Quebra</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold transition cursor-pointer"
                >
                  Salvar Ajuste
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

              {ingredients.map(ing => (
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

      {/* Modal Add Ingredient */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-50/80 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Plus className="w-5 h-5 text-amber-400" />
              <span>Cadastrar Novo Insumo</span>
            </h3>

            <form onSubmit={handleCreateIngredient} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Nome do Insumo</label>
                <input
                  type="text"
                  placeholder="Ex: Pão Australiano Gergelim"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Unidade de Medida</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                  >
                    <option value="un">Unidades (un)</option>
                    <option value="g">Gramas (g)</option>
                    <option value="kg">Quilos (kg)</option>
                    <option value="ml">Mililitros (ml)</option>
                    <option value="l">Litros (l)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Custo Unitário (R$)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="R$ 1,50"
                    value={costPerUnit}
                    onChange={(e) => setCostPerUnit(currencyMask(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Estoque Atual</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Ex: 100"
                    value={currentStock}
                    onChange={(e) => setCurrentStock(quantityMask(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Estoque Mínimo (Alerta)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Ex: 30"
                    value={minStock}
                    onChange={(e) => setMinStock(quantityMask(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Fornecedor Principal</label>
                <input
                  type="text"
                  placeholder="Ex: Padaria do Bairro"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold transition cursor-pointer"
                >
                  Salvar Insumo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
