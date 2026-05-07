import React from 'react';
import { ShoppingBag, LogOut } from 'lucide-react';
import { usePOS } from '../context/POSContext';
import logo from '../../pictures/fastfood_logo.png';

export const Header = () => {
  const { currentUser, logout, activeTab, isCartOpen, setIsCartOpen, cart } = usePOS();

  return (
    <header className="h-16 px-6 border-b border-gray-200 bg-white flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-white rounded-lg overflow-hidden border border-slate-100 shrink-0">
          <img src={logo} alt="Logo" className="w-full h-full object-cover" />
        </div>
        <div className="flex flex-col">
          <h1 className="font-black text-slate-900 tracking-tight leading-none text-lg">WITBANK EXPRESS GRILL</h1>
          <div className="flex space-x-2 text-[10px] text-slate-400 font-mono font-bold mt-1 uppercase">
            <span>{currentUser?.name || 'GUEST'}</span>
            {currentUser?.role !== 'customer' && (
              <>
                <span>|</span>
                <span>{currentUser?.role}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2 sm:space-x-6">
        <div className="hidden md:flex bg-green-100 text-green-700 px-3 py-1 rounded-md text-[10px] font-black border border-green-200 tracking-wider">SYSTEM ONLINE</div>
        
        {activeTab === 'order' && (
          <button 
            onClick={() => setIsCartOpen(!isCartOpen)}
            className="sm:hidden relative p-2 bg-orange-50 text-orange-600 rounded-lg"
          >
            <ShoppingBag size={20} />
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] w-4 h-4 flex items-center justify-center rounded-full font-black">
                {cart.reduce((s, i) => s + i.quantity, 0)}
              </span>
            )}
          </button>
        )}

        <div className="flex items-center gap-4 border-l border-slate-100 pl-4 sm:pl-6">
          <div className="text-right hidden md:block">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date().toLocaleDateString()}</p>
            <p className="text-sm font-black text-slate-900 font-mono">
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
            </p>
          </div>
          {currentUser && (
            <button onClick={logout} className="p-3 bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all" title="Logout">
              <LogOut size={20} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
