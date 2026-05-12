import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle2, ChevronRight, ShoppingBag, Utensils, ChefHat, Wallet, CreditCard, Landmark, Info } from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { MenuItem, Order } from '../types';
import logo from '../../pictures/fastfood_logo.png';
import { BANK_DETAILS } from '../constants';

const CURRENCY = 'R';

export const Modals = () => {
  return (
    <>
      <AuthModal />
      <PaymentModal />
      <ItemDetailModal />
      <MenuModal />
      <OrderDetailsModal />
      <SuccessToast />
      <Notifications />
    </>
  );
};

const AuthModal = () => {
  const { showAuthModal, authMode, setAuthMode, login, signup, authError, setAuthError } = usePOS();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  if (!showAuthModal) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    
    // Basic Validation
    if (!email.includes('@')) return setAuthError('Please enter a valid email address');
    if (password.length < 6) return setAuthError('Password must be at least 6 characters');
    if (authMode === 'signup' && !name.trim()) return setAuthError('Please enter your full name');

    setLoading(true);
    try {
      if (authMode === 'login') await login(email, password);
      else await signup(email, password, name);
    } catch (err) {
      // Error handled in context
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl border border-white/20"
      >
        <div className="p-8 sm:p-10">
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 bg-slate-900 rounded-[24px] p-4 shadow-xl">
              <img src={logo} alt="Logo" className="w-full h-full object-contain" />
            </div>
          </div>
          
          <div className="text-center mb-8">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">
              {authMode === 'login' ? 'Welcome Back' : 'Join the Grill'}
            </h2>
            <p className="text-slate-400 font-bold text-xs mt-2 uppercase tracking-widest">
              {authMode === 'login' ? 'Witbank Express POS System' : 'Create your staff or customer account'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {authMode === 'signup' && (
              <div>
                <input
                  type="text"
                  placeholder="FULL NAME"
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 px-6 text-sm font-black focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all placeholder:text-slate-300"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}
            <div>
              <input
                type="email"
                placeholder="EMAIL ADDRESS"
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 px-6 text-sm font-black focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all placeholder:text-slate-300"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <input
                type="password"
                placeholder="PASSWORD"
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 px-6 text-sm font-black focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all placeholder:text-slate-300"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {authError && (
              <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-[10px] font-black uppercase leading-relaxed border border-red-100">
                ⚠️ {authError}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl shadow-xl hover:bg-orange-500 transition-all active:scale-[0.98] uppercase tracking-widest text-xs mt-4"
            >
              {loading ? 'Processing...' : (authMode === 'login' ? 'Authorize System' : 'Create Account')}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button
              onClick={() => { setAuthMode(authMode === 'login' ? 'signup' : 'login'); setAuthError(''); }}
              className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-orange-500 transition-colors"
            >
              {authMode === 'login' ? "Don't have an account? Sign Up" : "Already have an account? Log In"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const PaymentModal = () => {
  const { 
    showPaymentModal, 
    setShowPaymentModal, 
    cartTotal, 
    cashPaid, 
    setCashPaid, 
    changeDue, 
    submitOrder, 
    orderError,
    paymentMethod,
    setPaymentMethod
  } = usePOS();
  
  if (!showPaymentModal) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white w-full max-w-xl rounded-[40px] overflow-hidden shadow-2xl relative"
      >
        <div className="p-6 sm:p-8 space-y-6 sm:space-y-8">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">PAYMENT SETTLEMENT</h3>
              <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Transaction ID: TXN-{Date.now().toString().slice(-6)}</p>
            </div>
            <button onClick={() => setShowPaymentModal(false)} className="bg-slate-100 p-2 sm:p-3 rounded-xl text-slate-400 hover:text-slate-900 transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'cash', label: 'Cash at Till', icon: <Wallet size={20} /> },
                { id: 'card', label: 'Physical Card', icon: <CreditCard size={20} /> },
                { id: 'bank_transfer', label: 'Bank Transfer', icon: <Landmark size={20} /> },
              ].map(method => (
                <button
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id as any)}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all gap-2 ${
                    paymentMethod === method.id 
                      ? 'border-orange-500 bg-orange-50 text-orange-600 ring-4 ring-orange-500/10' 
                      : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'
                  }`}
                >
                  {method.icon}
                  <span className="text-[9px] font-black uppercase tracking-tight">{method.label}</span>
                </button>
              ))}
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Balance Due</span>
                <span className="bg-orange-100 text-orange-600 px-2 py-0.5 rounded text-[9px] font-black">CASH ONLY</span>
              </div>
              <div className="text-4xl font-black text-slate-900 font-mono tracking-tighter">
                {CURRENCY}{cartTotal.toFixed(2)}
              </div>
            </div>

            {paymentMethod === 'cash' && (
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Cash Tendered</label>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-2xl text-slate-400">{CURRENCY}</span>
                  <input
                    autoFocus
                    type="number"
                    placeholder="0.00"
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl py-6 pl-14 pr-6 text-3xl font-black focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all placeholder:text-slate-200"
                    value={cashPaid}
                    onChange={(e) => setCashPaid(e.target.value)}
                  />
                </div>
                
                <div className="flex gap-2">
                  {[50, 100, 200, 500].map(amount => (
                    <button
                      key={amount}
                      onClick={() => setCashPaid(amount.toString())}
                      className="flex-1 bg-white border-2 border-slate-100 hover:border-orange-500 hover:text-orange-600 py-3 rounded-xl font-black transition-all text-xs shadow-sm"
                    >
                      {CURRENCY}{amount}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {paymentMethod !== 'bank_transfer' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-orange-50 border border-orange-100 p-6 rounded-2xl space-y-3"
              >
                <div className="flex items-center gap-3 text-orange-600">
                  <Info size={20} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Action Required</span>
                </div>
                <p className="text-xs font-bold text-orange-800 leading-relaxed">
                  Please proceed to the main counter (Till) to settle your payment. 
                  Your order will be <span className="underline">sent to the kitchen only after</span> the cashier confirms your payment.
                </p>
              </motion.div>
            )}

            {paymentMethod === 'bank_transfer' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-blue-50 border border-blue-100 p-6 rounded-2xl space-y-4"
              >
                <div className="flex items-center gap-3 text-blue-600">
                  <Info size={20} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Bank Transfer Instructions</span>
                </div>
                <div className="space-y-2 text-xs font-bold text-blue-800">
                  <div className="flex justify-between"><span>Bank:</span> <span>{BANK_DETAILS.bankName}</span></div>
                  <div className="flex justify-between"><span>Account Name:</span> <span>{BANK_DETAILS.accountName}</span></div>
                  <div className="flex justify-between"><span>Account Number:</span> <span className="font-mono">{BANK_DETAILS.accountNumber}</span></div>
                  <div className="flex justify-between"><span>Branch Code:</span> <span className="font-mono">{BANK_DETAILS.branchCode}</span></div>
                  <div className="flex justify-between border-t border-blue-200 pt-2 mt-2">
                    <span>Reference:</span> 
                    <span className="font-black text-blue-900">{BANK_DETAILS.referencePrefix}ORD...</span>
                  </div>
                </div>
                <p className="text-[9px] text-blue-600 italic font-medium leading-tight">
                  * Please use your Order ID as the reference. Your order will be processed once payment reflects in our account.
                </p>
              </motion.div>
            )}



            <AnimatePresence>
              {paymentMethod === 'cash' && parseFloat(cashPaid) > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className={`p-6 rounded-2xl border-2 flex justify-between items-center ${parseFloat(cashPaid) >= cartTotal
                      ? 'bg-green-50 border-green-200 text-green-700 shadow-lg shadow-green-500/5'
                      : 'bg-red-50 border-red-100 text-red-600'
                    }`}
                >
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest opacity-60">
                      {parseFloat(cashPaid) >= cartTotal ? 'Change to return' : 'Amount remaining'}
                    </p>
                    <p className="text-2xl font-black font-mono">
                      {CURRENCY}{Math.abs(changeDue).toFixed(2)}
                    </p>
                  </div>
                  {parseFloat(cashPaid) >= cartTotal && (
                    <div className="w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center animate-bounce shadow-lg shadow-green-500/20">
                      <CheckCircle2 size={24} />
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {orderError && (
            <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-[10px] font-black uppercase leading-relaxed border border-red-100 mb-4">
              ⚠️ {orderError}
            </div>
          )}

          <button
            disabled={paymentMethod === 'cash' && parseFloat(cashPaid) < cartTotal}
            onClick={submitOrder}
            className="w-full bg-slate-900 text-white font-black py-6 rounded-[24px] shadow-2xl hover:bg-orange-500 transition-all active:scale-[0.98] uppercase tracking-[0.2em] text-sm disabled:opacity-20 disabled:cursor-not-allowed group flex items-center justify-center gap-3"
          >
            <span>{paymentMethod === 'bank_transfer' ? 'Submit for Verification' : 'Confirm & Send to Kitchen'}</span>
            <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const ItemDetailModal = () => {
  const { showItemDetail, setShowItemDetail, addToCart } = usePOS();
  
  if (!showItemDetail) return null;

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="bg-white w-full max-w-lg rounded-[32px] sm:rounded-[40px] overflow-hidden shadow-2xl relative z-10 p-6 sm:p-10"
      >
        <div className="flex justify-between items-start mb-8">
          <div>
            <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">{showItemDetail.category}</span>
            <h3 className="text-3xl font-black text-slate-900 tracking-tight leading-tight uppercase mt-1">{showItemDetail.name}</h3>
          </div>
          <button onClick={() => setShowItemDetail(null)} className="bg-slate-100 p-3 rounded-2xl text-slate-400 hover:text-slate-900 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-8">
          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
            <p className="text-slate-600 font-medium leading-relaxed italic text-lg">
              "{showItemDetail.description || 'A local Witbank classic, prepared with love and the freshest local ingredients.'}"
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Serving Price</p>
              <p className="text-4xl font-black text-slate-900 font-mono tracking-tighter">{CURRENCY}{showItemDetail.price.toFixed(2)}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Stock Status</p>
              <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase ${showItemDetail.isAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                <div className={`w-2 h-2 rounded-full ${showItemDetail.isAvailable ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                {showItemDetail.isAvailable ? 'In Stock' : 'Sold Out'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
              <Utensils size={20} className="text-slate-400" />
              <span className="text-[10px] font-black text-slate-500 uppercase">Freshly Made</span>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
              <ShoppingBag size={20} className="text-slate-400" />
              <span className="text-[10px] font-black text-slate-500 uppercase">Takeaway Ready</span>
            </div>
          </div>

          <button
            disabled={!showItemDetail.isAvailable}
            onClick={() => { addToCart(showItemDetail); setShowItemDetail(null); }}
            className="w-full bg-orange-500 text-white font-black py-6 rounded-[24px] shadow-2xl shadow-orange-500/20 hover:bg-orange-600 transition-all active:scale-[0.98] uppercase tracking-[0.2em] text-sm disabled:opacity-20 disabled:cursor-not-allowed"
          >
            Add to Current Order
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const MenuModal = () => {
  const { showMenuModal, setShowMenuModal, menuForm, addMenuItem, updateMenuItem } = usePOS();
  const [formData, setFormData] = useState<Partial<MenuItem>>({});
  
  useEffect(() => {
    if (menuForm) setFormData(menuForm);
    else setFormData({ name: '', price: 0, costPrice: 0, category: 'Kotas', description: '', isAvailable: true });
  }, [menuForm, showMenuModal]);

  if (!showMenuModal) return null;

  const handleMenuSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const item = {
      id: menuForm?.id || `m-${Date.now()}`,
      name: formData.name || '',
      price: Number(formData.price) || 0,
      costPrice: Number(formData.costPrice) || 0,
      category: formData.category || 'Kotas',
      description: formData.description || '',
      isAvailable: formData.isAvailable ?? true
    } as MenuItem;

    if (menuForm) await updateMenuItem(item);
    else await addMenuItem(item);
    setShowMenuModal(false);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white w-full max-w-lg rounded-[32px] overflow-hidden shadow-2xl"
      >
        <div className="p-6 sm:p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight">{menuForm ? 'Edit Menu Item' : 'Add New Item'}</h3>
          <button onClick={() => setShowMenuModal(false)} className="text-slate-400 hover:text-slate-900 transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleMenuSubmit} className="p-6 sm:p-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-1 block">Item Name</label>
              <input
                type="text"
                required
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-3 px-4 text-sm font-black focus:border-orange-500 transition-all uppercase"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-1 block">Selling Price</label>
                <input
                  type="number"
                  required
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-3 px-4 text-sm font-black focus:border-orange-500 transition-all"
                  value={formData.price}
                  onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-1 block">Cost Price</label>
                <input
                  type="number"
                  required
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-3 px-4 text-sm font-black focus:border-orange-500 transition-all"
                  value={formData.costPrice}
                  onChange={e => setFormData({ ...formData, costPrice: Number(e.target.value) })}
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-1 block">Category</label>
              <select
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-3 px-4 text-sm font-black focus:border-orange-500 transition-all uppercase"
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
              >
                {['Kotas', 'Grills', 'Burgers', 'Chips', 'Sides', 'Drinks'].map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-1 block">Description</label>
              <textarea
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-3 px-4 text-sm font-medium focus:border-orange-500 transition-all italic"
                rows={3}
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-slate-900 text-white font-black py-4 rounded-xl shadow-lg hover:bg-orange-500 transition-all active:scale-[0.98] uppercase tracking-widest text-xs"
          >
            {menuForm ? 'Save Changes' : 'Create Menu Item'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

const OrderDetailsModal = () => {
  const { selectedOrder, setSelectedOrder, updateOrderStatus, currentUser } = usePOS();
  
  if (!selectedOrder) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white w-full max-w-2xl rounded-[40px] overflow-hidden shadow-2xl relative"
      >
        <div className="p-8 space-y-8">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">{selectedOrder.id}</h3>
                 <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full border ${selectedOrder.status === 'completed' ? 'bg-green-50 text-green-600 border-green-100' :
                    selectedOrder.status === 'ready' ? 'bg-green-100 text-green-700 border-green-200' :
                    selectedOrder.status === 'awaiting_payment' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                      'bg-orange-50 text-orange-600 border-orange-100'
                  }`}>{selectedOrder.status.replace('_', ' ')}</span>
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Ordered by {selectedOrder.customerEmail} • {new Date(selectedOrder.timestamp).toLocaleString()}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1">
                  Payment Method: 
                  <span className="text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                    {selectedOrder.paymentMethod?.replace('_', ' ') || 'CASH'}
                  </span>
                </span>
              </div>
            </div>
            <button onClick={() => setSelectedOrder(null)} className="bg-slate-100 p-2 rounded-xl text-slate-400 hover:text-slate-900 transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Order Items</h4>
            <div className="space-y-3">
              {selectedOrder.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center font-black text-sm">{item.quantity}</div>
                    <span className="font-black text-slate-800 uppercase text-sm">{item.name}</span>
                  </div>
                  <span className="font-mono text-slate-900 font-black">{CURRENCY}{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="pt-4 border-t border-slate-100 mt-4">
              <div className="flex justify-between items-center text-xl font-black text-slate-900">
                <span>Total Amount</span>
                <span className="text-orange-600">{CURRENCY}{selectedOrder.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

            <div className="grid grid-cols-2 gap-4 pt-4">
              {selectedOrder.status === 'awaiting_payment' && (currentUser?.role === 'admin' || currentUser?.role === 'staff') && (
                <button
                  onClick={() => { updateOrderStatus(selectedOrder.id, 'pending'); setSelectedOrder(null); }}
                  className="col-span-2 bg-blue-500 text-white font-black py-4 rounded-2xl shadow-lg hover:bg-blue-600 transition-all uppercase tracking-widest text-xs"
                >
                  Confirm {selectedOrder.paymentMethod?.replace('_', ' ').toUpperCase()} Payment
                </button>
              )}
              {selectedOrder.status !== 'completed' && selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'awaiting_payment' && (
                <>
                  <button
                    onClick={() => { updateOrderStatus(selectedOrder.id, 'completed'); setSelectedOrder(null); }}
                  className="bg-green-500 text-white font-black py-4 rounded-2xl shadow-lg hover:bg-green-600 transition-all uppercase tracking-widest text-xs"
                >
                  Mark as Completed
                </button>
                <button
                  onClick={() => { updateOrderStatus(selectedOrder.id, 'cancelled'); setSelectedOrder(null); }}
                  className="bg-red-50 text-red-600 font-black py-4 rounded-2xl border border-red-100 hover:bg-red-100 transition-all uppercase tracking-widest text-xs"
                >
                  Cancel Order
                </button>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const SuccessToast = () => {
  const { showSuccessToast } = usePOS();
  
  return (
    <AnimatePresence>
      {showSuccessToast && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[150] bg-green-500 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border-2 border-white/20"
        >
          <CheckCircle2 size={24} />
          <span className="font-black uppercase tracking-widest text-xs">Order placed successfully!</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const Notifications = () => {
  const { notifications, removeNotification } = usePOS();

  return (
    <div className="fixed top-4 right-4 sm:top-20 sm:right-6 z-[120] space-y-4 pointer-events-none w-[calc(100%-2rem)] sm:w-auto">
      <AnimatePresence>
        {notifications.map(n => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-slate-900 text-white p-4 sm:p-5 rounded-2xl shadow-2xl border-l-4 border-orange-500 flex items-center gap-4 pointer-events-auto min-w-[280px] max-w-md ml-auto"
          >
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shrink-0">
              <ChefHat size={20} />
            </div>
            <div className="flex-1">
              <p className="text-[11px] font-black uppercase tracking-widest leading-tight">{n.message}</p>
            </div>
            <button onClick={() => removeNotification(n.id)} className="text-slate-500 hover:text-white transition-colors">
              <X size={16} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
