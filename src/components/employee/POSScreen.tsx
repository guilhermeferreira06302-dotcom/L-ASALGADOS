import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Product, ProductCategory, OrderItem, PaymentMethod, OrderType } from '../../types';
import { 
  ShoppingBag, Plus, Minus, Trash2, Check, Search, CreditCard, 
  Banknote, QrCode, UtensilsCrossed, User, MapPin, Sparkles, ChefHat
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { currencyMask, parseCurrency } from '../../utils/masks';

export const POSScreen: React.FC<{ onOrderPlaced: () => void }> = ({ onOrderPlaced }) => {
  const { products, createOrder, currentUser, customCategories } = useApp();
  const [selectedCat, setSelectedCat] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  // Cart state
  const [cartItems, setCartItems] = useState<OrderItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [orderType, setOrderType] = useState<OrderType>('MESA');
  const [tableNumber, setTableNumber] = useState('Mesa 01');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PIX');
  const [cashGiven, setCashGiven] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const filtered = products.filter(p => {
    if (!p.available) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (selectedCat !== 'ALL' && p.category !== selectedCat) return false;
    return true;
  });

  const totalCart = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const changeAmount = parseCurrency(cashGiven) - totalCart;

  const handleAddToCart = (prod: Product) => {
    const idx = cartItems.findIndex(i => i.productId === prod.id);
    if (idx >= 0) {
      const updated = [...cartItems];
      updated[idx].quantity += 1;
      setCartItems(updated);
    } else {
      setCartItems([...cartItems, {
        productId: prod.id,
        productName: prod.name,
        quantity: 1,
        price: prod.price
      }]);
    }
  };

  const handleUpdateQty = (prodId: string, delta: number) => {
    setCartItems(cartItems.map(item => {
      if (item.productId === prodId) {
        const newQ = item.quantity + delta;
        return newQ > 0 ? { ...item, quantity: newQ } : null;
      }
      return item;
    }).filter(Boolean) as OrderItem[]);
  };

  const handleClearCart = () => {
    if (confirm('Limpar todos os itens do carrinho atual?')) {
      setCartItems([]);
    }
  };

  const handleFinishOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) return;
    if (!customerName) {
      alert('Por favor, informe o nome do cliente!');
      return;
    }

    createOrder({
      items: cartItems,
      total: totalCart,
      paymentMethod,
      customerName,
      orderType,
      tableNumber: orderType === 'MESA' ? tableNumber : undefined,
      cashierName: currentUser?.name || 'Caixa Atendimento'
    });

    setIsSuccess(true);
    try {
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } });
    } catch (e) {
      // ignore
    }

    setTimeout(() => {
      setIsSuccess(false);
      setCartItems([]);
      setCustomerName('');
      setCashGiven('');
      onOrderPlaced();
    }, 1500);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-300">
      
      {/* Products Grid Column (8 cols) */}
      <div className="lg:col-span-7 xl:col-span-8 space-y-4">
        
        {/* Search & Category Tabs */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xl space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-600" />
              <input
                type="text"
                placeholder="Pesquisar por nome do produto ou combo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <span className="text-xs text-slate-700 hidden sm:inline-block font-semibold">
              🛒 PDV Rápido
            </span>
          </div>

          <div className="flex overflow-x-auto pb-1 gap-1.5 text-xs font-bold scrollbar-none">
            {[
              { id: 'ALL', label: 'Todos' },
              ...Array.from(new Set([...(customCategories || []), ...products.map(p => p.category)]))
                .filter(c => c && c !== 'OUTROS' && c !== 'GERAL')
                .sort()
                .map(c => {
                  if (c === 'BURGER') return { id: c, label: 'Burgers' };
                  if (c === 'PORCAO') return { id: c, label: 'Porções' };
                  if (c === 'BEBIDA') return { id: c, label: 'Bebidas' };
                  if (c === 'COMBO') return { id: c, label: 'Combos' };
                  if (c === 'SOBREMESA') return { id: c, label: 'Sobremesas' };
                  return { id: c, label: c.charAt(0).toUpperCase() + c.slice(1).toLowerCase() };
                })
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCat(cat.id)}
                className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition cursor-pointer ${
                  selectedCat === cat.id
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-slate-950 shadow-md scale-105'
                    : 'bg-slate-50/80 text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Touch grid items */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 max-h-[72vh] overflow-y-auto pr-1">
          {filtered.map(prod => (
            <button
              key={prod.id}
              onClick={() => handleAddToCart(prod)}
              className="bg-white border border-slate-200 hover:border-emerald-500/80 rounded-2xl p-3 text-left flex flex-col justify-between shadow-lg hover:shadow-emerald-500/10 transition group cursor-pointer active:scale-95 duration-150"
            >
              <div>
                <div className="h-28 w-full rounded-xl overflow-hidden bg-slate-50 mb-2.5 relative">
                  <img src={prod.image} alt={prod.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                  <span className="absolute bottom-1.5 right-1.5 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-slate-50/90 text-amber-400 border border-slate-200 shadow">
                    R$ {prod.price.toFixed(2)}
                  </span>
                </div>
                <h4 className="font-bold text-xs text-slate-900 line-clamp-2 group-hover:text-emerald-300 transition">
                  {prod.name}
                </h4>
              </div>

              <div className="mt-2 pt-2 border-t border-slate-200/80 flex items-center justify-between text-[10px] text-slate-700">
                <span>⏱️ {prod.prepTimeMin}m</span>
                <span className="inline-flex items-center gap-1 text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
                  + Adicionar
                </span>
              </div>
            </button>
          ))}
        </div>

      </div>

      {/* Cart & Checkout Column (5 cols) */}
      <div className="lg:col-span-5 xl:col-span-4 bg-white border border-slate-200 rounded-3xl p-5 shadow-2xl flex flex-col justify-between h-full max-h-[85vh]">
        
        {/* Cart Header */}
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-emerald-400" />
              <span>Pedido Atual ({cartItems.reduce((acc, i) => acc + i.quantity, 0)})</span>
            </h3>
            {cartItems.length > 0 && (
              <button
                onClick={handleClearCart}
                className="text-xs text-red-400 hover:text-red-300 transition cursor-pointer flex items-center gap-1 font-semibold"
              >
                <Trash2 className="w-3.5 h-3.5" /> Limpar
              </button>
            )}
          </div>

          {/* Customer & Order type setup */}
          <div className="py-3 space-y-2 border-b border-slate-200 text-xs">
            <div className="grid grid-cols-3 gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setOrderType('MESA')}
                className={`py-1.5 rounded-lg font-bold transition cursor-pointer ${orderType === 'MESA' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-700'}`}
              >
                🪑 Mesa
              </button>
              <button
                type="button"
                onClick={() => setOrderType('BALCAO')}
                className={`py-1.5 rounded-lg font-bold transition cursor-pointer ${orderType === 'BALCAO' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-700'}`}
              >
                🛍️ Balcão
              </button>
              <button
                type="button"
                onClick={() => setOrderType('DELIVERY')}
                className={`py-1.5 rounded-lg font-bold transition cursor-pointer ${orderType === 'DELIVERY' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-700'}`}
              >
                🛵 Delivery
              </button>
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <User className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-600" />
                <input
                  type="text"
                  placeholder="Nome do Cliente (Ex: Fernando)"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  required
                />
              </div>

              {orderType === 'MESA' && (
                <select
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  className="w-28 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-slate-900 font-bold"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15].map(n => (
                    <option key={n} value={`Mesa ${n < 10 ? '0'+n : n}`}>Mesa {n < 10 ? '0'+n : n}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Cart Items List */}
          <div className="py-3 space-y-2 max-h-56 overflow-y-auto pr-1">
            {cartItems.length === 0 ? (
              <div className="py-12 text-center text-slate-600 flex flex-col items-center gap-2">
                <UtensilsCrossed className="w-8 h-8 opacity-40" />
                <p className="text-xs">Clique nos produtos à esquerda para adicionar ao pedido.</p>
              </div>
            ) : (
              cartItems.map(item => (
                <div key={item.productId} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="font-bold text-slate-900 truncate">{item.productName}</p>
                    <span className="text-[11px] text-amber-400 font-semibold">
                      R$ {(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleUpdateQty(item.productId, -1)}
                      className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-5 text-center font-bold text-slate-900">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => handleUpdateQty(item.productId, 1)}
                      className="w-6 h-6 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center font-bold cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Total and Payment Methods */}
        <div className="pt-3 border-t border-slate-200 space-y-3">
          <div className="flex justify-between items-end">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Total a Pagar</span>
            <span className="text-2xl font-extrabold text-emerald-400">
              R$ {totalCart.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1.5">Forma de Pagamento</label>
            <div className="grid grid-cols-4 gap-1.5 text-xs font-bold">
              {[
                { id: 'PIX', label: 'Pix', icon: QrCode },
                { id: 'CARTAO_CREDITO', label: 'Crédito', icon: CreditCard },
                { id: 'CARTAO_DEBITO', label: 'Débito', icon: CreditCard },
                { id: 'DINHEIRO', label: 'Dinheiro', icon: Banknote },
              ].map(pm => {
                const Icon = pm.icon;
                return (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => setPaymentMethod(pm.id as PaymentMethod)}
                    className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                      paymentMethod === pm.id 
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow' 
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-[10px]">{pm.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* If Dinheiro selected, show Change calculator */}
          {paymentMethod === 'DINHEIRO' && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <span className="text-slate-700">Valor Recebido (R$):</span>
              <input
                type="text"
                inputMode="numeric"
                placeholder="R$ 0,00"
                value={cashGiven}
                onChange={(e) => setCashGiven(currencyMask(e.target.value))}
                className="w-28 bg-white border border-slate-300 rounded-lg px-2 py-1 text-slate-900 font-bold text-right"
              />
              {parseCurrency(cashGiven) > 0 && (
                <span className="ml-auto font-bold text-amber-400">
                  Troco: R$ {Math.max(0, changeAmount).toFixed(2)}
                </span>
              )}
            </div>
          )}

          {/* Confirm Button */}
          <button
            onClick={handleFinishOrder}
            disabled={cartItems.length === 0 || isSuccess}
            className={`w-full py-3.5 px-4 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 shadow-xl transition cursor-pointer ${
              isSuccess 
                ? 'bg-emerald-400 text-slate-950' 
                : cartItems.length === 0 
                  ? 'bg-slate-100 text-slate-600 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 active:scale-95'
            }`}
          >
            {isSuccess ? (
              <>
                <Check className="w-5 h-5 animate-bounce" />
                <span>Pedido Enviado para a Cozinha!</span>
              </>
            ) : (
              <>
                <ChefHat className="w-5 h-5" />
                <span>Finalizar & Enviar p/ Cozinha (R$ {totalCart.toFixed(2)})</span>
              </>
            )}
          </button>
        </div>

      </div>

    </div>
  );
};
