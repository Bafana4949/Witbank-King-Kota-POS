import React from 'react';
import { motion } from 'motion/react';
import { Settings, Trash2 } from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { MenuItem } from '../types';
import logo from '../../pictures/fastfood_logo.png';

const CURRENCY = 'R';

export const MenuTab = () => {
  const { menuItems, toggleAvailability, deleteMenuItem, setMenuForm, resetMenuForm, setShowMenuModal, currentUser } = usePOS();

  return (
    <div className="flex-1 p-6 overflow-y-auto relative">
      <div 
        className="fixed inset-0 opacity-10 pointer-events-none z-0" 
        style={{ backgroundImage: `url(${logo})`, backgroundSize: 'contain', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }} 
      />
      <div className="max-w-7xl mx-auto space-y-6 relative z-10">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black tracking-tight text-slate-900 uppercase">Menu Management</h2>
          <button
            onClick={() => {
              resetMenuForm();
              setShowMenuModal(true);
            }}
            className="bg-orange-500 text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-orange-500/20"
          >
            Add New Item
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-4">
            <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden overflow-x-auto scrollbar-hide">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] uppercase font-black tracking-tighter text-slate-400 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">Item</th>
                    <th className="px-6 py-4">Price</th>
                    <th className="px-6 py-4">In Stock</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {menuItems.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm font-black text-slate-900 uppercase">{item.name}</div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase">{item.category}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-black text-slate-900 font-mono">{CURRENCY}{item.price.toFixed(2)}</div>
                        {currentUser?.role === 'admin' && (
                          <div className="text-[10px] text-slate-400 font-bold uppercase">Cost: {CURRENCY}{item.costPrice.toFixed(2)}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleAvailability(item.id)}
                          className={`w-12 h-6 rounded-full p-1 transition-all ${item.isAvailable ? 'bg-green-500' : 'bg-slate-200'}`}
                        >
                          <div className={`w-4 h-4 bg-white rounded-full transition-all ${item.isAvailable ? 'translate-x-6' : 'translate-x-0'}`}></div>
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setMenuForm(item);
                              setShowMenuModal(true);
                            }}
                            className="p-2 text-slate-400 hover:text-blue-500 transition-colors"
                          >
                            <Settings size={16} />
                          </button>
                          {currentUser?.role === 'admin' && (
                            <button
                              onClick={() => deleteMenuItem(item.id)}
                              className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
