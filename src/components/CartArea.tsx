import React from 'react';
import { ShoppingBag, X, Minus, Plus } from 'lucide-react';
import { usePOS } from '../context/POSContext';

const CURRENCY = 'R';

export const CartArea = () => {
  const { 
    cart, removeFromCart, updateQuantity, resetOrder, 
    cartTotal, setShowPaymentModal, parkOrder, setIsCartOpen, isCartOpen 
  } = usePOS();

  const printBill = () => {
    if (cart.length === 0) return;
    window.print();
  };

  return (
    <div className={`fixed inset-0 z-[90] sm:relative sm:z-auto transition-all duration-300 ${isCartOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none sm:opacity-100 sm:pointer-events-auto'}`}>
      {/* Mobile Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm sm:hidden"
        onClick={() => setIsCartOpen(false)}
      />
      
      <div className={`absolute right-0 top-0 bottom-0 w-[85%] max-w-[400px] bg-white border-l border-gray-200 flex flex-col shrink-0 sm:relative sm:w-80 sm:max-w-none sm:translate-x-0 transition-transform duration-300 ${isCartOpen ? 'translate-x-0' : 'translate-x-full sm:translate-x-0'}`}>
        <div className="p-4 border-b border-gray-100 bg-slate-50 flex items-center justify-between shrink-0">
          <h2 className="font-black text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2">
            <ShoppingBag size={16} />
            Current Order
            {cart.length > 0 && <span className="bg-orange-500 text-white text-[10px] px-2 py-0.5 rounded-full">{cart.reduce((s, i) => s + i.quantity, 0)}</span>}
          </h2>
          <div className="flex items-center gap-4">
            <button onClick={resetOrder} className="text-red-500 text-[10px] font-black uppercase hover:underline">Clear All</button>
            <button onClick={() => setIsCartOpen(false)} className="sm:hidden text-slate-400 p-1">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-50">
              <ShoppingBag size={48} strokeWidth={1.5} />
              <p className="mt-4 text-[11px] font-black uppercase tracking-widest">Order is empty</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex justify-between items-start group">
                <div className="flex-1">
                  <div className="text-xs font-black text-slate-800 uppercase tracking-tight flex justify-between items-center sm:pr-4">
                    <span>{item.name}</span>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-slate-300 hover:text-red-500 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center bg-slate-100 rounded-lg p-1">
                      <button onClick={() => updateQuantity(item.id, -1)} className="p-2 hover:bg-slate-200 rounded-md transition-colors"><Minus size={14} /></button>
                      <span className="px-3 text-xs font-mono font-black">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="p-2 hover:bg-slate-200 rounded-md transition-colors"><Plus size={14} /></button>
                    </div>
                    <span className="text-[11px] text-slate-400 font-bold">× {CURRENCY}{item.price.toFixed(2)}</span>
                  </div>
                </div>
                <div className="font-black text-slate-900 text-xs text-right">
                  {CURRENCY}{(item.price * item.quantity).toFixed(2)}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-6 bg-slate-50 border-t border-gray-200 space-y-4 shrink-0">
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-bold text-slate-500">
              <span>Subtotal</span>
              <span>{CURRENCY}{cartTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-black text-slate-900 pt-2 border-t border-slate-200">
              <span>TOTAL</span>
              <span className="text-orange-600 font-mono">{CURRENCY}{cartTotal.toFixed(2)}</span>
            </div>
          </div>

          <button
            disabled={cart.length === 0}
            onClick={() => setShowPaymentModal(true)}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black py-4 rounded-xl shadow-lg shadow-orange-500/20 active:scale-[0.98] transition-all uppercase tracking-widest text-xs disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Complete Order
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={parkOrder}
              className="bg-slate-200 text-slate-700 text-[9px] font-black py-2.5 rounded-lg uppercase tracking-wider hover:bg-slate-300 transition-colors"
            >
              Park Order
            </button>
            <button
              onClick={printBill}
              className="bg-slate-200 text-slate-700 text-[9px] font-black py-2.5 rounded-lg uppercase tracking-wider hover:bg-slate-300 transition-colors"
            >
              Print Bill
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
