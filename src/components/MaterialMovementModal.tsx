import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ArrowDownRight, ArrowUpRight, X, Tag, Package, Calendar, Clock, CheckCircle2, Plus, ArrowLeft, Camera } from 'lucide-react';
import confetti from 'canvas-confetti';
import { quantityMask, parseQuantity } from '../utils/masks';
import { isStockActive } from '../types';

interface MaterialMovementModalProps {
  type: 'ENTRADA' | 'SAIDA';
  onClose: () => void;
  isInline?: boolean;
}

export const MaterialMovementModal: React.FC<MaterialMovementModalProps> = ({ type, onClose, isInline }) => {
  const { currentUser, ingredients, adjustStock, customCategories } = useApp();
  
  const [items, setItems] = useState<{id: string, selectedCat: string, selectedMatId: string, matQty: string, paymentMethod: string}[]>([
    { id: crypto.randomUUID(), selectedCat: '', selectedMatId: '', matQty: '', paymentMethod: '' }
  ]);
  const [matDate, setMatDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [matTime, setMatTime] = useState<string>(new Date().toTimeString().slice(0, 5));
  const [matNotes, setMatNotes] = useState<string>('');
  const [outflowReason, setOutflowReason] = useState<string>('');
  const [photos, setPhotos] = useState<string[]>([]);

  useEffect(() => {
    // Atualiza a cada segundo para garantir a virada do minuto
    const interval = setInterval(() => {
      setMatDate(new Date().toISOString().split('T')[0]);
      setMatTime(new Date().toTimeString().slice(0, 5));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const materialCategories = Array.from(new Set([
    ...(customCategories || [])
  ])).filter(c => c && c !== 'OUTROS' && c !== 'GERAL').sort();

  const addItem = () => {
    setItems([...items, { id: crypto.randomUUID(), selectedCat: '', selectedMatId: '', matQty: '', paymentMethod: '' }]);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (photos.length >= items.length) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6); // 60% quality jpeg
          setPhotos(prev => [...prev, compressedBase64]);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const removeItem = (id: string) => {
    if (items.length === 1) return;
    setItems(items.filter(i => i.id !== id));
  };

  const updateItem = (id: string, field: string, value: string) => {
    setItems(items.map(i => {
      if (i.id === id) {
        if (field === 'selectedCat') {
          return { ...i, selectedCat: value, selectedMatId: '' };
        }
        return { ...i, [field]: value };
      }
      return i;
    }));
  };

  const handleConfirmMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!type) return;

    if (type === 'SAIDA' && outflowReason === 'Prejuízo' && photos.length === 0) {
      alert('Por favor, adicione pelo menos uma foto como evidência do prejuízo.');
      return;
    }

    if (type === 'SAIDA') {
      for (const item of items) {
        if (!item.selectedMatId || !item.matQty) continue;
        const qtyNum = parseQuantity(item.matQty);
        if (qtyNum <= 0) continue;
        const targetIng = ingredients.find(i => i.id === item.selectedMatId);
        if (targetIng && qtyNum > targetIng.currentStock) {
          alert(`Estoque divergente!\nNão é possível retirar ${qtyNum} ${targetIng.unit} de "${targetIng.name}".\nO estoque atual é de apenas ${targetIng.currentStock} ${targetIng.unit}.`);
          return;
        }
      }
    }

    let successCount = 0;
    
    items.forEach((item, index) => {
      if (!item.selectedMatId || !item.matQty) return;
      
      const qtyNum = parseQuantity(item.matQty);
      if (qtyNum <= 0) return;

      const targetIng = ingredients.find(i => i.id === item.selectedMatId);
      if (!targetIng) return;

      const changeNum = type === 'ENTRADA' ? qtyNum : -qtyNum;
      
      const reasonText = type === 'ENTRADA' ? 'Entrada' : outflowReason;
      let observationText = matNotes || 'Sem observação';
      const photoToSave = (type === 'SAIDA' && outflowReason === 'Prejuízo' && photos.length > 0) 
        ? photos[Math.min(index, photos.length - 1)] 
        : undefined;

      adjustStock(item.selectedMatId, changeNum, reasonText, currentUser?.name || 'Operador da Loja', observationText, photoToSave, type === 'SAIDA' ? item.paymentMethod : undefined);
      successCount++;
    });

    if (successCount === 0) return;
    
    // Trigger celebration confetti on Entrada
    if (type === 'ENTRADA') {
      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 }
        });
      } catch (err) {
        // ignore
      }
    }

    onClose();
  };
  const modalContent = (
    <div className={`${isInline ? 'w-full' : 'bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200'} space-y-4`}>
        <div className={`${isInline ? 'bg-white/95 border-b border-slate-200 shadow-md -mx-4 sm:-mx-6 lg:-mx-8 -mt-4 sm:-mt-6 lg:-mt-8 px-4 sm:px-6 lg:px-8 pt-3 pb-4 mb-3' : 'flex flex-col pb-4 mb-4 border-b border-slate-100/50'}`}>
          <div className={`text-center ${!isInline ? 'mb-4' : ''}`}>
            <h3 className="font-extrabold text-slate-900 text-3xl sm:text-4xl tracking-tight mb-0">
              {type === 'ENTRADA' ? 'Entrada de Material' : 'Saída de Material'}
            </h3>
            <p className="text-sm sm:text-base text-slate-500">
              {type === 'ENTRADA' ? 'Recebimento de mercadoria' : 'Baixa de estoque'}
            </p>
          </div>
          {!isInline && (
            <div className="flex justify-start relative z-10">
              <button
                type="button"
                onClick={onClose}
                className="text-slate-500 hover:text-slate-800 transition cursor-pointer flex items-center gap-1.5 w-fit p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          )}
        </div>

        {isInline && (
          <div className="flex justify-start mb-3">
            <button
              type="button"
              onClick={onClose}
              className="text-slate-500 hover:text-slate-800 transition cursor-pointer flex items-center gap-1.5 w-fit py-1 -mt-3"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-bold">Voltar</span>
            </button>
          </div>
        )}

        <form onSubmit={handleConfirmMaterial} className="space-y-4">
          <div className={`space-y-4 ${isInline ? '' : 'max-h-[50vh] overflow-y-auto overflow-x-hidden pr-1 pb-1 custom-scrollbar'}`}>
            {items.map((item, index) => {
              const availableMaterials = ingredients.filter(ing => {
                if (!item.selectedCat) return false;
                if (type === 'SAIDA' && !isStockActive(ing)) return false;
                return (ing.category || 'INSUMOS GERAIS') === item.selectedCat;
              });

              const isFilled = item.selectedCat && item.selectedMatId && item.matQty;

              return (
                <div key={item.id} className="p-4 border border-slate-200 rounded-2xl bg-white space-y-4 relative shadow-sm">
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="absolute -top-2 -right-2 bg-red-100 text-red-600 hover:bg-red-200 p-1.5 rounded-full transition shadow-sm border border-white"
                      title="Remover Item"
                    >
                      <X className="w-3.5 h-3.5 stroke-[3]" />
                    </button>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-slate-500" />
                      <span>Categoria do Produto</span>
                    </label>
                    <select
                      value={item.selectedCat}
                      onChange={(e) => updateItem(item.id, 'selectedCat', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-bold text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none transition"
                      required
                    >
                      <option value="">Selecione a categoria...</option>
                      {materialCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-slate-500" />
                      <span>Nome do Produto</span>
                    </label>
                    <select
                      value={item.selectedMatId}
                      onChange={(e) => updateItem(item.id, 'selectedMatId', e.target.value)}
                      disabled={!item.selectedCat}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-bold text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none transition disabled:bg-slate-100 disabled:text-slate-400"
                      required
                    >
                      {!item.selectedCat ? (
                        <option value="">← Selecione a categoria</option>
                      ) : (
                        <>
                          <option value="">Selecione o produto...</option>
                          {availableMaterials.map(mat => (
                            <option key={mat.id} value={mat.id}>
                              {mat.name}
                            </option>
                          ))}
                        </>
                      )}
                    </select>
                    {item.selectedMatId && (
                      <p className="text-[11px] font-semibold text-slate-500 mt-1 pl-1">
                        ✓ Unidade: <span className="text-slate-800 font-bold uppercase">{ingredients.find(i => i.id === item.selectedMatId)?.unit || 'un'}</span>
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2 sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Quantidade
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="0"
                        value={item.matQty}
                        onChange={(e) => updateItem(item.id, 'matQty', quantityMask(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-extrabold text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none transition text-center"
                      />
                    </div>
                  </div>

                  {type === 'SAIDA' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-slate-500" />
                        <span>Forma de Pagamento</span>
                      </label>
                      <select
                        value={item.paymentMethod}
                        onChange={(e) => updateItem(item.id, 'paymentMethod', e.target.value)}
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-bold text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none transition"
                      >
                        <option value="" disabled hidden>Selecione o pagamento...</option>
                        <option value="Dinheiro">Dinheiro</option>
                        <option value="Cartão">Cartão</option>
                        <option value="Pegou Fiado">Pegou Fiado</option>
                        <option value="Prejuízo">Prejuízo</option>
                      </select>
                    </div>
                  )}

                  {index === items.length - 1 && isFilled && (
                    <div className="flex justify-end mt-2 pt-3 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={addItem}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-100 text-amber-700 hover:bg-amber-200 transition text-xs font-bold shadow-sm"
                      >
                        <Plus className="w-4 h-4 stroke-[3]" />
                        Adicionar Mais Produto
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>Data</span>
              </label>
              <input
                type="date"
                required
                disabled
                readOnly
                max={new Date().toISOString().split('T')[0]}
                value={matDate}
                onChange={(e) => setMatDate(e.target.value)}
                className="w-full bg-slate-100/80 border border-slate-200 rounded-xl p-3 text-slate-700 font-bold text-xs cursor-not-allowed select-none focus:outline-none transition opacity-80"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>Hora</span>
              </label>
              <input
                type="time"
                required
                disabled
                readOnly
                value={matTime}
                onChange={(e) => setMatTime(e.target.value)}
                className="w-full bg-slate-100/80 border border-slate-200 rounded-xl p-3 text-slate-700 font-bold text-xs cursor-not-allowed select-none focus:outline-none transition opacity-80"
              />
            </div>
          </div>

          {type === 'SAIDA' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-slate-500" />
                <span>Motivo da Saída</span>
              </label>
              <select
                value={outflowReason}
                onChange={(e) => {
                  setOutflowReason(e.target.value);
                  if (e.target.value !== 'Prejuízo') {
                    setPhotos([]);
                  }
                }}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-bold text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none transition"
              >
                <option value="" disabled hidden>Selecione o motivo...</option>
                <option value="Venda">Venda</option>
                <option value="Prejuízo">Prejuízo</option>
                <option value="Outros">Outros</option>
              </select>
            </div>
          )}

          {(type === 'ENTRADA' || (type === 'SAIDA' && (outflowReason === 'Outros' || outflowReason === 'Prejuízo'))) && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Observação / Motivo {type === 'SAIDA' && (outflowReason === 'Outros' || outflowReason === 'Prejuízo') ? <span className="text-red-500">(Obrigatório)</span> : '(Opcional)'}
              </label>
              <input
                type="text"
                required={type === 'SAIDA' && (outflowReason === 'Outros' || outflowReason === 'Prejuízo')}
                placeholder={type === 'ENTRADA' ? 'Ex: NF #12345 - Compra semanal' : (outflowReason === 'Prejuízo' ? 'Ex: Produto vencido, queimou na chapa...' : 'Ex: Consumo na cozinha / Descarte')}
                value={matNotes}
                onChange={(e) => setMatNotes(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-medium text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none transition placeholder-slate-400"
              />
            </div>
          )}

          {type === 'SAIDA' && outflowReason === 'Prejuízo' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-slate-500" />
                  <span>Foto do Prejuízo <span className="text-red-500">(Obrigatório)</span></span>
                </div>
                <span className="text-[10px] text-slate-400 font-normal">
                  {photos.length} de {items.length} permitida(s)
                </span>
              </label>
              
              <div className="flex flex-wrap gap-3">
                {photos.map((photo, idx) => (
                  <div key={idx} className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden border border-slate-200 shadow-sm group">
                    <img src={photo} alt={`Prejuízo ${idx + 1}`} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center backdrop-blur-[2px]">
                      <button
                        type="button"
                        onClick={() => setPhotos(photos.filter((_, i) => i !== idx))}
                        className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition shadow-lg transform hover:scale-105"
                        title="Remover foto"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {photos.length < items.length && (
                  <div className="relative w-24 h-24 sm:w-28 sm:h-28">
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => {
                        handlePhotoUpload(e);
                        e.target.value = '';
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="w-full h-full bg-slate-50 border border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center gap-1 hover:bg-slate-100 transition text-slate-500 group">
                      <Camera className="w-6 h-6 text-slate-400 group-hover:text-blue-500 transition-colors" />
                      <span className="text-[10px] font-semibold text-center leading-tight group-hover:text-blue-600 transition-colors px-1">
                        {photos.length === 0 ? "Adicionar Foto" : "Mais uma Foto"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`px-5 py-2.5 text-white font-extrabold rounded-xl text-xs shadow-md transition cursor-pointer flex items-center gap-1.5 ${
                type === 'ENTRADA'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-500/20'
                  : 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 shadow-orange-500/20'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
              <span>{type === 'ENTRADA' ? 'Confirmar Entrada' : 'Confirmar Saída'}</span>
            </button>
          </div>
        </form>
      </div>
  );

  if (isInline) {
    return <div className="animate-in slide-in-from-right-4 duration-300">{modalContent}</div>;
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      {modalContent}
    </div>
  );
};
