import React from 'react';
import { ShoppingBag, Printer } from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { printOrderTicket } from '../utils/print';

const CURRENCY = 'R';

export const HistoryTab = () => {
  const { orders, currentUser } = usePOS();
  
  const userOrders = orders.filter(o => currentUser?.role === 'admin' ? true : o.userId === currentUser?.id);

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black tracking-tight text-slate-900 uppercase">My Order History</h2>
        </div>

        <div className="space-y-4">
          {userOrders.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-[32px] border border-slate-100">
              <ShoppingBag size={48} className="mx-auto text-slate-200 mb-4" />
              <p className="text-slate-400 font-black uppercase text-sm">No orders found yet</p>
            </div>
          ) : (
            userOrders.map(order => (
              <div key={order.id} className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black ${order.status === 'completed' ? 'bg-green-50 text-green-600' :
                      order.status === 'pending' ? 'bg-orange-50 text-orange-600' : 'bg-slate-50 text-slate-400'
                    }`}>
                    {order.items.length}
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{order.id}</p>
                    <p className="text-sm font-black text-slate-900 uppercase tracking-tight line-clamp-1">
                      {order.items.map(i => i.name).join(', ')}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">
                      {new Date(order.timestamp).toLocaleString()} • {order.paymentMethod?.replace('_', ' ') || 'CASH'}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full border ${order.status === 'completed' ? 'bg-green-50 text-green-600 border-green-100' :
                      order.status === 'ready' ? 'bg-green-100 text-green-700 border-green-200 animate-bounce' :
                        order.status === 'cancelled' ? 'bg-red-50 text-red-600 border-red-100' :
                          'bg-orange-50 text-orange-600 border-orange-100 animate-pulse'
                    }`}>
                    {order.status}
                  </span>
                  <div className="flex items-center gap-4 mt-2 justify-end">
                    <button 
                      onClick={() => printOrderTicket(order)}
                      className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-900 transition-all"
                      title="Print Ticket"
                    >
                      <Printer size={18} />
                    </button>
                    <p className="text-lg font-black text-slate-900">{CURRENCY}{order.total.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
