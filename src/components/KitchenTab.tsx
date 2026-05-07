import React from 'react';
import { motion } from 'motion/react';
import { ChefHat, CheckCircle2, Clock } from 'lucide-react';
import { usePOS } from '../context/POSContext';
import logo from '../../pictures/fastfood_logo.png';

export const KitchenTab = () => {
  const { orders, updateOrderStatus } = usePOS();
  
  const activeOrders = orders.filter(o => ['pending', 'accepted', 'preparing'].includes(o.status));

  return (
    <div className="flex-1 p-6 overflow-y-auto relative">
      <div 
        className="fixed inset-0 opacity-5 pointer-events-none z-0" 
        style={{ backgroundImage: `url(${logo})`, backgroundSize: 'contain', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }} 
      />
      <div className="max-w-6xl mx-auto space-y-6 relative z-10">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black tracking-tight text-slate-900">KITCHEN MONITOR</h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] font-black uppercase text-slate-500">Live Updates</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeOrders.length === 0 ? (
            <div className="col-span-full py-20 text-center text-slate-300">
              <CheckCircle2 size={48} className="mx-auto opacity-20 mb-4" strokeWidth={1} />
              <p className="font-black uppercase tracking-widest text-sm">All orders cleared! Waiting for customers... 🍖</p>
            </div>
          ) : (
            activeOrders.slice().reverse().map(order => (
              <div key={order.id} className={`bg-white rounded-2xl border-t-4 border border-slate-200 shadow-sm overflow-hidden flex flex-col transition-all ${order.status === 'pending' ? 'border-t-orange-500 shadow-orange-500/5' :
                  order.status === 'accepted' ? 'border-t-blue-500 shadow-blue-500/5' :
                    'border-t-yellow-500 shadow-yellow-500/5 animate-pulse'
                }`}>
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{order.id}</div>
                      <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${order.status === 'pending' ? 'bg-orange-100 text-orange-600' :
                          order.status === 'accepted' ? 'bg-blue-100 text-blue-600' : 'bg-yellow-100 text-yellow-600'
                        }`}>{order.status}</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-800 font-black text-sm">
                      <Clock size={12} />
                      {new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {order.status === 'pending' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'accepted')}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all shadow-md shadow-blue-500/20"
                      >
                        ACCEPT
                      </button>
                    )}
                    {order.status === 'accepted' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'preparing')}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all shadow-md shadow-yellow-500/20"
                      >
                        PREPARE
                      </button>
                    )}
                    {order.status === 'preparing' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'ready')}
                        className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all shadow-md shadow-green-500/20"
                      >
                        READY
                      </button>
                    )}
                  </div>
                </div>
                <div className="p-4 flex-1 space-y-3 font-medium text-slate-700">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex gap-4">
                      <div className="bg-slate-100 text-slate-800 w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm shrink-0 border border-slate-200">
                        {item.quantity}
                      </div>
                      <div className="font-black text-sm uppercase leading-tight pt-1.5">{item.name}</div>
                    </div>
                  ))}
                </div>
                <div className="p-4 bg-slate-50 border-t border-slate-100 mt-auto">
                  <button className="w-full border border-slate-200 text-slate-400 py-1.5 rounded text-[10px] font-black uppercase hover:bg-slate-100 transition-colors">
                    PRINT TICKET
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
