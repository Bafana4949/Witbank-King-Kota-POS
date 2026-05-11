import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Search } from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { MenuItem } from '../types';
import { CATEGORIES } from '../constants';

const CURRENCY = 'R';

export const ProductCard = ({ item }: { item: MenuItem }) => {
  const { addToCart, setShowItemDetail } = usePOS();

  return (
    <motion.div
      key={item.id}
      whileHover={{ y: -4, shadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)" }}
      className="bg-white p-4 rounded-2xl border border-slate-100 hover:border-orange-200 transition-all text-left flex flex-col justify-between h-48 group relative cursor-pointer"
      onClick={() => setShowItemDetail(item)}
    >
      <div className="absolute top-2 right-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-10">
        <button 
          className="bg-slate-900 text-white p-2 sm:p-1 rounded-xl sm:rounded-md shadow-lg"
          onClick={(e) => { e.stopPropagation(); addToCart(item); }}
        >
          <Plus size={18} className="sm:hidden" />
          <Plus size={14} className="hidden sm:block" />
        </button>
      </div>
      <div>
        <div className="text-[10px] font-black text-slate-300 mb-1 uppercase tracking-[0.2em]">{item.category}</div>
        <div className="font-black text-slate-800 text-base leading-tight line-clamp-2 uppercase tracking-tight">{item.name}</div>
        {item.description && (
          <div className="text-[11px] text-slate-500 mt-2 line-clamp-2 leading-relaxed font-medium italic opacity-70 group-hover:opacity-100 transition-opacity">
            {item.description}
          </div>
        )}
        {!item.isAvailable && (
          <div className="mt-2 bg-red-100 text-red-600 inline-block px-2 py-0.5 rounded text-[8px] font-black uppercase">Sold Out</div>
        )}
      </div>
      <div className="flex justify-between items-center mt-auto pt-4 border-t border-slate-50">
        <span className={`font-black text-lg tracking-tighter ${item.isAvailable ? 'text-orange-600' : 'text-slate-300 line-through'}`}>
          {CURRENCY}{item.price.toFixed(2)}
        </span>
        {item.isAvailable ? (
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-orange-500 transition-colors">Details →</div>
        ) : (
          <div className="text-[10px] font-black text-red-400 uppercase tracking-widest">Unavailable</div>
        )}
      </div>
    </motion.div>
  );
};

export const MenuArea = () => {
  const { 
    searchTerm, setSearchTerm, activeCategory, setActiveCategory, 
    filteredMenuItems, currentUser, dailyStats, parkedOrders, retrieveParkedOrder 
  } = usePOS();

  return (
    <div className="flex-1 flex flex-col bg-[#fcfcfc]">
      {/* Sub-Header / Search & Categories */}
      <div className="p-6 bg-white/80 backdrop-blur-md border-b border-slate-100 flex flex-col md:flex-row md:items-center gap-6 sticky top-0 z-20">
        <div className="relative flex-1 max-w-md group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" size={18} />
          <input
            type="text"
            placeholder="Search our delicious menu..."
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all font-bold placeholder:text-slate-300 shadow-inner"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide py-1 touch-pan-x snap-x">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border shrink-0 snap-start active:scale-95 ${activeCategory === cat
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xl shadow-slate-900/10 scale-105'
                  : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300 hover:text-slate-600'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <div className="flex-1 overflow-y-auto p-6 sm:p-10">
        <AnimatePresence mode="popLayout">
          <motion.div 
            layout
            className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8"
          >
            {filteredMenuItems.map(item => (
              <ProductCard item={item} />
            ))}
          </motion.div>
        </AnimatePresence>
        
        {filteredMenuItems.length === 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="h-64 flex flex-col items-center justify-center text-slate-300"
          >
            <Search size={64} strokeWidth={1} className="opacity-20 mb-4" />
            <p className="font-black uppercase tracking-widest text-xs">No items match your search</p>
          </motion.div>
        )}
      </div>

      {/* Footer Info */}
      <footer className="h-16 bg-white border-t border-slate-100 px-8 flex items-center justify-between shrink-0 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.05)]">
        <div className="flex space-x-8">
          {(currentUser?.role === 'admin' || currentUser?.role === 'staff') && (
            <>
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Revenue (Today)</span>
                <span className="font-black text-green-600 text-sm">{CURRENCY}{dailyStats.revenue.toFixed(2)}</span>
              </div>
              {currentUser?.role === 'admin' && (
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Est. Profit</span>
                  <span className="font-black text-blue-600 text-sm">{CURRENCY}{dailyStats.profit.toFixed(2)}</span>
                </div>
              )}
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Orders Today</span>
                <span className="font-black text-slate-800 text-sm">{dailyStats.count}</span>
              </div>
            </>
          )}
          {currentUser?.role === 'customer' && (
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Your Account</span>
              <span className="font-black text-slate-800 text-sm">{currentUser.name}</span>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {parkedOrders.length > 0 && (
            <div className="flex gap-2 mr-4 overflow-x-auto max-w-[200px] scrollbar-hide">
              {parkedOrders.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => retrieveParkedOrder(idx)}
                  className="bg-orange-100 text-orange-600 px-2 py-1 rounded text-[9px] font-black uppercase hover:bg-orange-200 transition-colors whitespace-nowrap"
                >
                  Retrieve #{idx + 1}
                </button>
              ))}
            </div>
          )}
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-sm shadow-green-400/50"></div>
          <span className="text-slate-500 font-bold text-[10px] uppercase tracking-wider hidden xs:block">System Ready</span>
        </div>
      </footer>
    </div>
  );
};
