import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Product, ProductCategory, RecipeItem } from '../../types';
import { 
  Utensils, Plus, Edit3, Trash2, Search, DollarSign, 
  CheckCircle2, XCircle, Sparkles, ChefHat, Layers
} from 'lucide-react';
import { currencyMask, parseCurrency, quantityMask, parseQuantity } from '../../utils/masks';

export const ProductManagement: React.FC = () => {
  const { products, addProduct, updateProduct, deleteProduct, ingredients, customCategories, addCustomCategory, updateCustomCategory, deleteCustomCategory } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCat, setFilterCat] = useState<string>('ALL');

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingProd, setEditingProd] = useState<Product | null>(null);
  
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editCategoryValue, setEditCategoryValue] = useState('');
  
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryValue, setNewCategoryValue] = useState('');

  // Form fields
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ProductCategory>('BURGER');
  const [customCategoryName, setCustomCategoryName] = useState('');
  const [price, setPrice] = useState('');
  const [image, setImage] = useState('');
  const [description, setDescription] = useState('');
  const [prepTimeMin, setPrepTimeMin] = useState('10');
  const [minStock, setMinStock] = useState('0,000');
  const [maxStock, setMaxStock] = useState('0,000');
  const [manualCosts, setManualCosts] = useState<{ id: string, name: string, value: string }[]>([]);

  const openAddModal = () => {
    setEditingProd(null);
    setName('');
    setCategory('BURGER');
    setCustomCategoryName('');
    setPrice('');
    setImage('https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=80');
    setDescription('');
    setPrepTimeMin('10');
    setMinStock('0,000');
    setMaxStock('0,000');
    setManualCosts([]);
    setShowModal(true);
  };

  const openEditModal = (prod: Product) => {
    setEditingProd(prod);
    setName(prod.name);
    setCategory(prod.category);
    setCustomCategoryName('');
    setPrice(currencyMask(prod.price.toFixed(2)));
    setImage(prod.image);
    setDescription(prod.description);
    setPrepTimeMin(prod.prepTimeMin.toString());
    setMinStock(prod.minStock !== undefined ? quantityMask(prod.minStock) : '0,000');
    setMaxStock(prod.maxStock !== undefined ? quantityMask(prod.maxStock) : '0,000');
    setManualCosts(prod.costPrice > 0 ? [{ id: Date.now().toString(), name: 'Custo Principal', value: currencyMask(prod.costPrice.toFixed(2)) }] : []);
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) return;
    
    const totalCost = manualCosts.reduce((acc, curr) => acc + parseCurrency(curr.value), 0);
    const finalCategory = category;

    if (finalCategory) {
      addCustomCategory(finalCategory);
    }

    const prodData = {
      name,
      category: finalCategory,
      price: parseCurrency(price),
      costPrice: totalCost,
      image: image || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=80',
      available: true,
      description: description || 'Sem descrição cadastrada.',
      prepTimeMin: parseInt(prepTimeMin) || 10,
      recipe: [],
      minStock: parseQuantity(minStock) || 0,
      maxStock: parseQuantity(maxStock) || 0,
      salesCountMonthly: editingProd ? editingProd.salesCountMonthly : 45
    };

    if (editingProd) {
      updateProduct({ ...editingProd, ...prodData });
    } else {
      addProduct(prodData);
    }
    setShowModal(false);
  };

  const allCategories = Array.from(new Set([
    ...(customCategories || []),
    ...products.map(p => p.category)
  ])).filter(c => c && c !== 'OUTROS' && c !== 'GERAL').sort();

  const filterCategories = ['ALL', ...allCategories];

  const filtered = products.filter(p => {
    if (searchTerm && !p.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (filterCat !== 'ALL' && p.category !== filterCat) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      


      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-slate-600" />
          <input
            type="text"
            placeholder="Buscar lanche, bebida ou combo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div className="w-full sm:w-auto min-w-[200px]">
          <select
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
          >
            {filterCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'ALL' ? 'Todas as Categorias' : cat}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => setShowCategoriesModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 w-full sm:w-auto rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs shadow-sm border border-slate-200 transition cursor-pointer"
        >
          <Edit3 className="w-4 h-4" />
          <span>Editar Categorias</span>
        </button>

        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 px-4 py-2 w-full sm:w-auto rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs shadow-sm border border-blue-200 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Produto</span>
        </button>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map(prod => {
          const profit = prod.price - prod.costPrice;
          const margin = ((profit / prod.price) * 100).toFixed(0);

          return (
            <div key={prod.id} className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xl flex flex-col justify-between hover:border-purple-500/40 transition group">
              <div>
                <div className="relative h-44 w-full overflow-hidden bg-slate-50">
                  <img src={prod.image} alt={prod.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                  <div className="absolute top-3 left-3 flex gap-1.5">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/90 backdrop-blur-md text-slate-900 uppercase tracking-wider border border-slate-300">
                      {prod.category}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3">
                    <button
                      onClick={() => updateProduct({ ...prod, available: !prod.available })}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold backdrop-blur-md border transition cursor-pointer ${
                        prod.available 
                          ? 'bg-emerald-500/80 text-slate-900 border-emerald-400' 
                          : 'bg-red-500/80 text-slate-900 border-red-400'
                      }`}
                    >
                      {prod.available ? 'Ativo' : 'Esgotado'}
                    </button>
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-extrabold text-base text-slate-900">{prod.name}</h3>
                    <span className="text-base font-extrabold text-slate-800 whitespace-nowrap">
                      R$ {prod.price.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 mt-1.5 line-clamp-2">{prod.description}</p>
                </div>
              </div>

              <div className="px-5 pb-5 pt-3 border-t border-slate-200/80 bg-slate-50/40 flex items-center justify-between">
                <div className="text-xs">
                  <span className="text-slate-600">Custo: R$ {prod.costPrice.toFixed(2)}</span>
                  <span className="text-emerald-400 font-bold ml-2">({margin}% margem)</span>
                  <p className="text-[10px] text-slate-600 mt-0.5">⏱️ {prod.prepTimeMin} min de preparo</p>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEditModal(prod)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-purple-300 hover:text-slate-900 transition cursor-pointer border border-slate-300"
                    title="Editar Ficha e Preço"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      if (confirm(`Deseja excluir o produto "${prod.name}"?`)) {
                        deleteProduct(prod.id);
                      }
                    }}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-red-950/60 text-slate-700 hover:text-red-400 transition cursor-pointer border border-slate-300"
                    title="Excluir Produto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Add / Edit Product */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-50/80 backdrop-blur-md">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-4 max-h-[92vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ChefHat className="w-5 h-5 text-purple-400" />
                <span>{editingProd ? 'Editar Produto & Ficha Técnica' : 'Cadastrar Novo Produto'}</span>
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="overflow-y-auto space-y-4 text-xs pr-1 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-semibold mb-1">Nome do Produto</label>
                  <input
                    type="text"
                    placeholder="Ex: Double Cheddar Monster"
                    value={name}
                    onChange={(e) => {
                      const val = e.target.value;
                      const formatted = val ? val.charAt(0).toUpperCase() + val.slice(1).toLowerCase() : '';
                      setName(formatted);
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-bold text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Categoria</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ProductCategory)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-semibold"
                  >
                    {allCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>



              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Preço de Venda (R$)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="R$ 0,00"
                    value={price}
                    onChange={(e) => setPrice(currencyMask(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-extrabold text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">URL da Imagem</label>
                  <input
                    type="text"
                    placeholder="https://images.unsplash..."
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Estoque mínimo</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="0,000"
                    value={minStock}
                    onChange={(e) => setMinStock(quantityMask(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-bold text-sm"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Estoque máximo</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="0,000"
                    value={maxStock}
                    onChange={(e) => setMaxStock(quantityMask(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-bold text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Descrição Comercial</label>
                <textarea
                  rows={2}
                  placeholder="Descreva os ingredientes visíveis para o cliente..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                />
              </div>

              {/* Custos e Lucro do Produto */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-emerald-500" />
                    <span>Custos e Lucro do Produto</span>
                  </h4>
                </div>

                <div className="space-y-2">
                  {manualCosts.map((cost, idx) => (
                    <div key={cost.id} className="flex gap-2 items-center">
                      <input
                        type="text"
                        placeholder="Ex: Pão / Embalagem"
                        value={cost.name}
                        onChange={(e) => {
                          const newCosts = [...manualCosts];
                          newCosts[idx].name = e.target.value;
                          setManualCosts(newCosts);
                        }}
                        className="flex-1 bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 text-sm"
                      />
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="R$ 0,00"
                        value={cost.value}
                        onChange={(e) => {
                          const newCosts = [...manualCosts];
                          newCosts[idx].value = currencyMask(e.target.value);
                          setManualCosts(newCosts);
                        }}
                        className="w-28 bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 font-bold text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setManualCosts(manualCosts.filter(c => c.id !== cost.id))}
                        className="p-2.5 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  
                  <button
                    type="button"
                    onClick={() => setManualCosts([...manualCosts, { id: Date.now().toString(), name: '', value: '' }])}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-bold rounded-xl transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar Custo
                  </button>
                </div>

                <div className="pt-3 border-t border-slate-200 flex flex-col gap-1">
                  {(() => {
                    const totalCost = manualCosts.reduce((acc, curr) => acc + parseCurrency(curr.value), 0);
                    const sellPrice = parseCurrency(price);
                    const profit = sellPrice - totalCost;
                    const margin = sellPrice > 0 ? ((profit / sellPrice) * 100).toFixed(1) : '0.0';
                    return (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Custo Total:</span>
                          <span className="font-bold text-slate-900">R$ {totalCost.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Preço de Venda:</span>
                          <span className="font-bold text-slate-900">R$ {sellPrice.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm pt-1 border-t border-slate-100">
                          <span className="text-slate-800 font-bold">Lucro Obtido:</span>
                          <span className={`font-extrabold ${profit > 0 ? 'text-emerald-500' : 'text-slate-500'}`}>
                            R$ {profit.toFixed(2)} ({margin}%)
                          </span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-slate-900 font-bold rounded-xl shadow-md transition cursor-pointer"
                >
                  Salvar Produto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Categorias */}
      {showCategoriesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-50/80 backdrop-blur-md">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[92vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-4">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-slate-600" />
                  <span>Editar Categorias</span>
                </h3>
                <button
                  onClick={() => setIsAddingCategory(true)}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-lg transition cursor-pointer border border-blue-200"
                >
                  Criar novo
                </button>
              </div>
              <button onClick={() => setShowCategoriesModal(false)} className="text-slate-400 hover:text-slate-600 transition font-bold text-lg cursor-pointer">✕</button>
            </div>

            <div className="overflow-y-auto space-y-2 flex-1">
              {allCategories.length === 0 && !isAddingCategory ? (
                <div className="flex flex-col items-center justify-center py-8 space-y-3">
                  <p className="text-slate-500 text-sm text-center">Nenhuma categoria personalizada criada.</p>
                  <button
                    onClick={() => setIsAddingCategory(true)}
                    className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-md"
                  >
                    Criar a primeira categoria
                  </button>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600 font-semibold text-xs uppercase">
                      <tr>
                        <th className="px-4 py-3">Nome da Categoria</th>
                        <th className="px-4 py-3 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {isAddingCategory && (
                        <tr className="bg-purple-50/30">
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={newCategoryValue}
                              onChange={(e) => setNewCategoryValue(e.target.value.toUpperCase())}
                              placeholder="Nome da nova categoria..."
                              className="w-full border border-purple-300 rounded p-1 text-xs focus:outline-none focus:border-purple-500 font-semibold text-slate-800 bg-white uppercase"
                              autoFocus
                            />
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-2">
                              <button 
                                onClick={() => {
                                  if(newCategoryValue.trim()) {
                                    addCustomCategory(newCategoryValue);
                                    setNewCategoryValue('');
                                    setIsAddingCategory(false);
                                  }
                                }}
                                className="text-green-600 hover:text-green-700 font-semibold text-xs cursor-pointer px-2 py-1 bg-green-50 rounded border border-green-200"
                              >Salvar</button>
                              <button 
                                onClick={() => {
                                  setIsAddingCategory(false);
                                  setNewCategoryValue('');
                                }}
                                className="text-slate-500 hover:text-slate-600 font-semibold text-xs cursor-pointer px-2 py-1 bg-slate-100 rounded border border-slate-200"
                              >Cancelar</button>
                            </div>
                          </td>
                        </tr>
                      )}
                      {allCategories.map(cat => (
                        <tr key={cat} className="hover:bg-slate-50/50 transition">
                          <td className="px-4 py-3">
                            {editingCategory === cat ? (
                              <input
                                type="text"
                                value={editCategoryValue}
                                onChange={(e) => setEditCategoryValue(e.target.value.toUpperCase())}
                                className="w-full border border-slate-300 rounded p-1 text-xs focus:outline-none focus:border-purple-500 font-semibold text-slate-800 bg-white uppercase"
                                autoFocus
                              />
                            ) : (
                              <span className="font-semibold text-slate-800">{cat}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {editingCategory === cat ? (
                              <div className="flex justify-end gap-2">
                                <button 
                                  onClick={() => {
                                    if(editCategoryValue.trim()) {
                                      updateCustomCategory(cat, editCategoryValue);
                                    }
                                    setEditingCategory(null);
                                  }}
                                  className="text-green-600 hover:text-green-700 font-semibold text-xs cursor-pointer px-2 py-1 bg-green-50 rounded"
                                >Salvar</button>
                                <button 
                                  onClick={() => setEditingCategory(null)}
                                  className="text-slate-500 hover:text-slate-600 font-semibold text-xs cursor-pointer px-2 py-1 bg-slate-100 rounded"
                                >Cancelar</button>
                              </div>
                            ) : (
                              <div className="flex justify-end gap-3">
                                <button
                                  onClick={() => {
                                    setEditingCategory(cat);
                                    setEditCategoryValue(cat);
                                  }}
                                  className="text-blue-500 hover:text-blue-600 transition cursor-pointer"
                                  title="Editar"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    if(confirm(`Tem certeza que deseja excluir a categoria "${cat}"? Produtos nela serão movidos para "OUTROS".`)) {
                                      deleteCustomCategory(cat);
                                    }
                                  }}
                                  className="text-red-400 hover:text-red-500 transition cursor-pointer"
                                  title="Excluir"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
