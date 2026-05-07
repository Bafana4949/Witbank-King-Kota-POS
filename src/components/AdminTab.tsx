import React from 'react';
import { TrendingUp, CreditCard, Search, ChevronRight, Settings } from 'lucide-react';
import { usePOS } from '../context/POSContext';
import logo from '../../pictures/fastfood_logo.png';

const CURRENCY = 'R';

export const AdminTab = () => {
  const { dailyStats, orders, setSelectedOrder, auditLogs } = usePOS();

  return (
    <div className="flex-1 p-6 overflow-y-auto relative">
      <div 
        className="fixed inset-0 opacity-5 pointer-events-none z-0" 
        style={{ backgroundImage: `url(${logo})`, backgroundSize: 'contain', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }} 
      />
      <div className="max-w-7xl mx-auto space-y-6 relative z-10">
        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 sm:p-8 rounded-[32px] border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><TrendingUp size={80} /></div>
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center shadow-inner italic font-black text-xl sm:text-2xl shrink-0">R</div>
            <div className="relative z-10">
              <p className="text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Gross Revenue (Today)</p>
              <p className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tighter">{CURRENCY}{dailyStats.revenue.toFixed(2)}</p>
            </div>
          </div>
          <div className="bg-white p-6 sm:p-8 rounded-[32px] border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><TrendingUp size={80} /></div>
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner shrink-0">
              <CreditCard size={28} className="sm:hidden" />
              <CreditCard size={32} className="hidden sm:block" />
            </div>
            <div className="relative z-10">
              <p className="text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Estimated Net Profit</p>
              <p className="text-2xl sm:text-4xl font-black text-green-600 tracking-tighter">{CURRENCY}{dailyStats.profit.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Audit Logs */}
        <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
            <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight">System Activity Logs</h3>
          </div>
          <div className="p-4 max-h-64 overflow-y-auto scrollbar-hide">
            <div className="space-y-3">
              {auditLogs.length === 0 ? (
                <p className="text-center py-10 text-slate-400 text-xs font-bold uppercase tracking-widest">No recent activity</p>
              ) : (
                auditLogs.map(log => (
                  <div key={log.id} className="flex items-start gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                      <Settings size={14} className="text-slate-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black text-slate-900 uppercase">{log.userName}</span>
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">• {new Date(log.timestamp).toLocaleString()}</span>
                      </div>
                      <p className="text-[11px] font-bold text-slate-600 uppercase leading-tight">
                        {log.action}d <span className="text-slate-900">"{log.itemName}"</span> — {log.changes}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden shadow-lg shadow-slate-200/50">
          <div className="p-4 sm:p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-black text-slate-900 text-lg tracking-tight uppercase">Order Management System</h3>
          </div>
          <div className="overflow-x-auto scrollbar-hide">
            <table className="w-full text-left min-w-[800px]">
              <thead className="bg-slate-50 text-[10px] uppercase font-black tracking-tighter text-slate-400 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Order ID</th>
                  <th className="px-6 py-4">Time</th>
                  <th className="px-6 py-4">Items Summary</th>
                  <th className="px-6 py-4 text-right">Order Total</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center text-slate-300">
                      <Search size={32} className="mx-auto opacity-20 mb-2" />
                      <p className="font-black uppercase tracking-widest text-xs">No orders found</p>
                    </td>
                  </tr>
                ) : (
                  orders.map(order => (
                    <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-md tracking-widest ${order.status === 'completed' ? 'bg-green-100 text-green-700' :
                            order.status === 'ready' ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' :
                              ['pending', 'accepted', 'preparing'].includes(order.status) ? 'bg-orange-100 text-orange-700' :
                                'bg-slate-100 text-slate-500'
                          }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs font-black">{order.id}</td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-500">
                        {new Date(order.timestamp).toLocaleString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs font-bold text-slate-800 line-clamp-1">
                          {order.items.map(i => `${i.quantity}× ${i.name}`).join(', ')}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-black text-slate-900">
                        {CURRENCY}{order.total.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-400 hover:text-slate-900"
                        >
                          <ChevronRight size={20} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
