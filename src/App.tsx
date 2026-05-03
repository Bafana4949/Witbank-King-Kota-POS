/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShoppingBag, 
  History, 
  ChefHat, 
  TrendingUp, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard, 
  ChevronRight,
  Search,
  X,
  CheckCircle2,
  Settings,
  LayoutDashboard,
  Clock,
  Printer,
  LogIn,
  LogOut,
  UserPlus,
  UserCircle,
  Mail,
  Lock,
  User as UserIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MenuItem, CartItem, Order, User, AuditLog } from './types';
import { MENU_ITEMS, CATEGORIES } from './constants';
import { auth, db } from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  limit, 
  where,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';

const CURRENCY = 'R';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

type Tab = 'order' | 'admin' | 'kitchen' | 'history' | 'menu';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('order');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(true);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authForm, setAuthForm] = useState({ email: '', password: '', name: '' });
  const [authError, setAuthError] = useState('');
  
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cashPaid, setCashPaid] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(MENU_ITEMS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showItemDetail, setShowItemDetail] = useState<MenuItem | null>(null);
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [menuForm, setMenuForm] = useState<Partial<MenuItem>>({
    name: '',
    price: 0,
    costPrice: 0,
    category: 'Kotas',
    description: '',
    isAvailable: true
  });
  const [notifications, setNotifications] = useState<{id: string, message: string}[]>([]);

  const [parkedOrders, setParkedOrders] = useState<CartItem[][]>([]);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch user document for role
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          setCurrentUser(userSnap.data() as User);
        } else {
          // If no doc exists (fallback), assume customer
          const userData: User = {
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            name: firebaseUser.displayName || 'User',
            role: 'customer'
          };
          setCurrentUser(userData);
        }
        setShowAuthModal(false);
      } else {
        setCurrentUser(null);
        setShowAuthModal(true);
      }
    });

    return () => unsubscribe();
  }, []);

  // Firestore Listeners
  useEffect(() => {
    if (!currentUser) return;

    // Menu
    const unsubscribeMenu = onSnapshot(collection(db, 'menu'), (snapshot) => {
      const items = snapshot.docs.map(doc => doc.data() as MenuItem);
      if (items.length > 0) {
        setMenuItems(items);
      } else if (currentUser.role === 'admin' || currentUser.role === 'staff') {
        // Seed menu if empty and manager is logged in
        MENU_ITEMS.forEach(async (item) => {
          try {
            await setDoc(doc(db, 'menu', item.id), { ...item, isAvailable: true });
          } catch (e) {
            console.error("Error seeding menu:", e);
          }
        });
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'menu'));

    // Orders
    const ordersQuery = currentUser.role === 'customer' 
      ? query(collection(db, 'orders'), where('userId', '==', currentUser.id), orderBy('timestamp', 'desc'))
      : query(collection(db, 'orders'), orderBy('timestamp', 'desc'), limit(100));

    const unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
      setOrders(snapshot.docs.map(doc => doc.data() as Order));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'orders'));

    // Audit Logs
    let unsubscribeAudit = () => {};
    if (currentUser.role === 'admin' || currentUser.role === 'staff') {
      const auditQuery = query(collection(db, 'auditLogs'), orderBy('timestamp', 'desc'), limit(50));
      unsubscribeAudit = onSnapshot(auditQuery, (snapshot) => {
        setAuditLogs(snapshot.docs.map(doc => doc.data() as AuditLog));
      }, (error) => handleFirestoreError(error, OperationType.GET, 'auditLogs'));
    }

    return () => {
      unsubscribeMenu();
      unsubscribeOrders();
      unsubscribeAudit();
    };
  }, [currentUser]);

  // Parked orders remain in localStorage as they are transient/local
  useEffect(() => {
    const savedParkOrder = localStorage.getItem('witbank_parked_orders');
    if (savedParkOrder) setParkedOrders(JSON.parse(savedParkOrder));
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      await signInWithEmailAndPassword(auth, authForm.email, authForm.password);
    } catch (error: any) {
      setAuthError(error.message || 'Login failed');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, authForm.email, authForm.password);
      const firebaseUser = userCredential.user;

      // Update auth profile
      await updateProfile(firebaseUser, { displayName: authForm.name });

      // Create user document in Firestore
      const role = authForm.email.includes('admin') ? 'admin' : authForm.email.includes('staff') ? 'staff' : 'customer';
      const userData: User = {
        id: firebaseUser.uid,
        email: authForm.email,
        name: authForm.name,
        role: role as any
      };

      await setDoc(doc(db, 'users', firebaseUser.uid), userData);
      setCurrentUser(userData);
      setShowAuthModal(false);
    } catch (error: any) {
      setAuthError(error.message || 'Signup failed');
    }
  };

  const logout = () => {
    signOut(auth);
    setActiveTab('order');
  };

  const filteredMenuItems = useMemo(() => {
    return menuItems.filter(item => {
      const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const isAvailable = currentUser?.role !== 'customer' ? true : item.isAvailable;
      return matchesCategory && matchesSearch && isAvailable;
    });
  }, [activeCategory, searchTerm, menuItems, currentUser]);

  const auditLogAction = async (action: AuditLog['action'], item: MenuItem, changes: string) => {
    if (!currentUser) return;
    const logId = `LOG-${Date.now()}`;
    const log: AuditLog = {
      id: logId,
      timestamp: Date.now(),
      userId: currentUser.id,
      userName: currentUser.name,
      action,
      itemName: item.name,
      changes
    };
    try {
      await setDoc(doc(db, 'auditLogs', logId), log);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `auditLogs/${logId}`);
    }
  };

  const updateMenuItem = async (updatedItem: MenuItem) => {
    const original = menuItems.find(i => i.id === updatedItem.id);
    if (!original) return;

    let changes = [];
    if (original.price !== updatedItem.price) changes.push(`Price: ${original.price} -> ${updatedItem.price}`);
    if (original.isAvailable !== updatedItem.isAvailable) changes.push(`Availability: ${original.isAvailable} -> ${updatedItem.isAvailable}`);
    if (original.name !== updatedItem.name) changes.push(`Name: ${original.name} -> ${updatedItem.name}`);

    try {
      await setDoc(doc(db, 'menu', updatedItem.id), {
        ...updatedItem,
        updatedAt: Date.now(),
        updatedBy: currentUser?.id
      });
      auditLogAction('update', updatedItem, changes.join(', ') || 'No visual changes');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `menu/${updatedItem.id}`);
    }
  };

  const toggleAvailability = async (id: string) => {
    const item = menuItems.find(i => i.id === id);
    if (!item) return;

    const updated = { ...item, isAvailable: !item.isAvailable };
    try {
      await updateDoc(doc(db, 'menu', id), {
        isAvailable: updated.isAvailable,
        updatedAt: Date.now(),
        updatedBy: currentUser?.id
      });
      auditLogAction('update', updated, `Availability toggled to ${updated.isAvailable}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `menu/${id}`);
    }
  };

  const deleteMenuItem = async (id: string) => {
    const item = menuItems.find(i => i.id === id);
    if (!item) return;
    try {
      await deleteDoc(doc(db, 'menu', id));
      auditLogAction('delete', item, 'Item removed from menu');
      addNotification(`${item.name} removed from menu.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `menu/${id}`);
    }
  };

  const addMenuItem = async (item: MenuItem) => {
    try {
      await setDoc(doc(db, 'menu', item.id), {
        ...item,
        isAvailable: true,
        updatedAt: Date.now(),
        updatedBy: currentUser?.id
      });
      auditLogAction('create', item, 'New item added to menu');
      setShowMenuModal(false);
      resetMenuForm();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `menu/${item.id}`);
    }
  };

  const handleMenuSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!menuForm.name || menuForm.price === undefined) return;

    if (editingItem) {
      const updated: MenuItem = {
        ...editingItem,
        name: menuForm.name,
        price: menuForm.price,
        costPrice: menuForm.costPrice || 0,
        category: menuForm.category || 'Kotas',
        description: menuForm.description,
        isAvailable: menuForm.isAvailable ?? true
      };
      updateMenuItem(updated);
      setEditingItem(null);
    } else {
      const newItem: MenuItem = {
        id: `item-${Date.now()}`,
        name: menuForm.name,
        price: menuForm.price,
        costPrice: menuForm.costPrice || 0,
        category: menuForm.category || 'Kotas',
        description: menuForm.description,
        isAvailable: true
      };
      addMenuItem(newItem);
    }
    setShowMenuModal(false);
    resetMenuForm();
  };

  const resetMenuForm = () => {
    setMenuForm({
      name: '',
      price: 0,
      costPrice: 0,
      category: 'Kotas',
      description: '',
      isAvailable: true
    });
  };

  const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  }, [cart]);

  const changeDue = useMemo(() => {
    const paid = parseFloat(cashPaid) || 0;
    return Math.max(0, paid - cartTotal);
  }, [cashPaid, cartTotal]);

  const addToCart = (item: MenuItem) => {
    if (!item.isAvailable) {
      addNotification(`Sorry, ${item.name} is currently sold out! 🍖`);
      return;
    }
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const resetOrder = () => {
    setCart([]);
    setCashPaid('');
    setShowPaymentModal(false);
  };

  const submitOrder = async () => {
    if (!currentUser) return;
    
    const orderTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const orderCost = cart.reduce((sum, item) => sum + (item.costPrice * item.quantity), 0);
    const paid = parseFloat(cashPaid) || orderTotal;
    
    const orderId = `ORD-${Date.now().toString().slice(-6)}`;
    const newOrder: Order = {
      id: orderId,
      items: cart.map(item => ({ ...item })), // Snapshotted items
      total: orderTotal,
      totalCost: orderCost,
      cashPaid: paid,
      change: Math.max(0, paid - orderTotal),
      timestamp: Date.now(),
      status: 'pending',
      userId: currentUser.id,
      customerEmail: currentUser.email
    };

    try {
      await setDoc(doc(db, 'orders', orderId), newOrder);
      resetOrder();
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `orders/${orderId}`);
    }
  };

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status });
      
      const order = orders.find(o => o.id === orderId);
      if (order) {
        if (status === 'ready') {
          addNotification(`Order ${orderId} is READY for collection! 🍟`);
        }
      }
      
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, status } : null);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const parkOrder = () => {
    if (cart.length === 0) return;
    const newParked = [...parkedOrders, [...cart]];
    setParkedOrders(newParked);
    localStorage.setItem('witbank_parked_orders', JSON.stringify(newParked));
    setCart([]);
    addNotification("Order parked successfully.");
  };

  const retrieveParkedOrder = (index: number) => {
    setCart(parkedOrders[index]);
    const remaining = parkedOrders.filter((_, i) => i !== index);
    setParkedOrders(remaining);
    localStorage.setItem('witbank_parked_orders', JSON.stringify(remaining));
    addNotification("Parked order retrieved.");
  };

  const printBill = () => {
    if (cart.length === 0) return;
    addNotification("Preparing bill for printing...");
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const addNotification = (message: string) => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, message }]);
    
    // Web Notification API
    if ("Notification" in window) {
      if (Notification.permission === "granted") {
        new Notification("Witbank Express Grill", { body: message });
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
          if (permission === "granted") {
            new Notification("Witbank Express Grill", { body: message });
          }
        });
      }
    }

    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const dailyStats = useMemo(() => {
    const today = new Date().toLocaleDateString();
    const todayOrders = orders.filter(o => 
      new Date(o.timestamp).toLocaleDateString() === today && 
      o.status !== 'cancelled'
    );
    return {
      revenue: todayOrders.reduce((sum, o) => sum + o.total, 0),
      cost: todayOrders.reduce((sum, o) => sum + o.totalCost, 0),
      profit: todayOrders.reduce((sum, o) => sum + (o.total - o.totalCost), 0),
      count: todayOrders.length
    };
  }, [orders]);

  return (
    <div className="flex h-screen overflow-hidden bg-[#F3F4F6] font-sans text-slate-800">
      
      {/* Category Sidebar (High Density Style) */}
      <aside className="w-20 bg-slate-900 flex flex-col items-center py-4 space-y-6 text-white shrink-0">
        <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center font-black text-2xl mb-4 shadow-lg shadow-orange-500/20">W</div>
        
        <nav className="flex flex-col space-y-6 w-full items-center">
          <button 
            onClick={() => setActiveTab('order')}
            className={`flex flex-col items-center gap-1 transition-all group ${activeTab === 'order' ? 'text-orange-500' : 'opacity-40 hover:opacity-100'}`}
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${activeTab === 'order' ? 'bg-slate-800 border-2 border-orange-500' : 'bg-slate-800'}`}>
              <ShoppingBag size={20} />
            </div>
            <span className="text-[10px] uppercase font-bold tracking-tighter">Order</span>
          </button>

          {currentUser?.role === 'customer' && (
            <button 
              onClick={() => setActiveTab('history')}
              className={`flex flex-col items-center gap-1 transition-all group ${activeTab === 'history' ? 'text-orange-500' : 'opacity-40 hover:opacity-100'}`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${activeTab === 'history' ? 'bg-slate-800 border-2 border-orange-500' : 'bg-slate-800'}`}>
                <History size={20} />
              </div>
              <span className="text-[10px] uppercase font-bold tracking-tighter">History</span>
            </button>
          )}

          {(currentUser?.role === 'admin' || currentUser?.role === 'staff') && (
            <>
              <button 
                onClick={() => setActiveTab('kitchen')}
                className={`flex flex-col items-center gap-1 transition-all group ${activeTab === 'kitchen' ? 'text-orange-500' : 'opacity-40 hover:opacity-100'}`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${activeTab === 'kitchen' ? 'bg-slate-800 border-2 border-orange-500' : 'bg-slate-800'}`}>
                  <ChefHat size={20} />
                </div>
                <span className="text-[10px] uppercase font-bold tracking-tighter">Kitchen</span>
              </button>

              <button 
                onClick={() => setActiveTab('menu')}
                className={`flex flex-col items-center gap-1 transition-all group ${activeTab === 'menu' ? 'text-orange-500' : 'opacity-40 hover:opacity-100'}`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${activeTab === 'menu' ? 'bg-slate-800 border-2 border-orange-500' : 'bg-slate-800'}`}>
                  <Settings size={20} />
                </div>
                <span className="text-[10px] uppercase font-bold tracking-tighter">Menu</span>
              </button>
            </>
          )}

          {currentUser?.role === 'admin' && (
            <button 
              onClick={() => setActiveTab('admin')}
              className={`flex flex-col items-center gap-1 transition-all group ${activeTab === 'admin' ? 'text-orange-500' : 'opacity-40 hover:opacity-100'}`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${activeTab === 'admin' ? 'bg-slate-800 border-2 border-orange-500' : 'bg-slate-800'}`}>
                <LayoutDashboard size={20} />
              </div>
              <span className="text-[10px] uppercase font-bold tracking-tighter">Admin</span>
            </button>
          )}
        </nav>

        <div className="mt-auto flex flex-col items-center space-y-6 pb-4">
          <button className="w-10 h-10 bg-slate-800 text-slate-400 hover:text-white rounded-lg flex items-center justify-center transition-colors">
            <Settings size={20} />
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Header */}
        <header className="h-16 px-6 border-b border-gray-200 bg-white flex items-center justify-between shrink-0">
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
          
          <div className="flex items-center space-x-6">
             <div className="hidden sm:flex bg-green-100 text-green-700 px-3 py-1 rounded-md text-[10px] font-black border border-green-200 tracking-wider">SYSTEM ONLINE</div>
             <div className="flex items-center gap-4 border-l border-slate-100 pl-6">
                <div className="text-right hidden sm:block">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date().toLocaleDateString()}</p>
                  <p className="text-sm font-black text-slate-900 font-mono">
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                  </p>
                </div>
                {currentUser && (
                  <button onClick={logout} className="p-2 bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Logout">
                    <LogOut size={20} />
                  </button>
                )}
             </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-hidden flex bg-[#F9FAFB]">
        <AnimatePresence mode="wait">
            {activeTab === 'order' && (
              <motion.div 
                key="order"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex"
              >
                {/* Menu Area */}
                <div className="flex-1 flex flex-col">
                   {/* Sub-Header / Search & Categories */}
                   <div className="p-4 bg-white border-b border-gray-200 flex items-center gap-4">
                      <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                          type="text" 
                          placeholder="Search items..."
                          className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                        {CATEGORIES.map(cat => (
                          <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border ${
                              activeCategory === cat 
                              ? 'bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-500/20' 
                              : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                   </div>

                   {/* Products Grid */}
                   <div className="flex-1 overflow-y-auto p-6">
                      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                        {filteredMenuItems.map(item => (
                          <motion.div
                            whileHover={{ y: -4, shadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)" }}
                            key={item.id}
                            className="bg-white p-4 rounded-2xl border border-slate-100 hover:border-orange-200 transition-all text-left flex flex-col justify-between h-48 group relative cursor-pointer"
                            onClick={() => setShowItemDetail(item)}
                          >
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                               <div className="bg-slate-900 text-white p-1 rounded-md">
                                 <Plus size={14} onClick={(e) => { e.stopPropagation(); addToCart(item); }} />
                               </div>
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
                              <span className={`font-black text-lg tracking-tighter ${item.isAvailable ? 'text-orange-600' : 'text-slate-300 line-through'}`}>{CURRENCY}{item.price.toFixed(2)}</span>
                              {item.isAvailable ? (
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-orange-500 transition-colors">Details →</div>
                              ) : (
                                <div className="text-[10px] font-black text-red-400 uppercase tracking-widest">Unavailable</div>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                   </div>

                   {/* Footer Info */}
                   <footer className="h-14 bg-white border-t border-gray-200 px-6 flex items-center justify-between shrink-0">
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
                          <div className="flex gap-2 mr-4">
                            {parkedOrders.map((_, idx) => (
                              <button 
                                key={idx} 
                                onClick={() => retrieveParkedOrder(idx)}
                                className="bg-orange-100 text-orange-600 px-2 py-1 rounded text-[9px] font-black uppercase hover:bg-orange-200 transition-colors"
                              >
                                Retrieve #{idx + 1}
                              </button>
                            ))}
                          </div>
                        )}
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-sm shadow-green-400/50"></div>
                        <span className="text-slate-500 font-bold text-[10px] uppercase tracking-wider">System Ready</span>
                      </div>
                   </footer>
                </div>

                {/* Cart Area */}
                <div className="w-80 bg-white border-l border-gray-200 flex flex-col shrink-0 sm:w-96">
                   <div className="p-4 border-b border-gray-100 bg-slate-50 flex items-center justify-between shrink-0">
                      <h2 className="font-black text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2">
                        <ShoppingBag size={16} />
                        Current Order
                        {cart.length > 0 && <span className="bg-orange-500 text-white text-[10px] px-2 py-0.5 rounded-full">{cart.reduce((s, i) => s + i.quantity, 0)}</span>}
                      </h2>
                      <button onClick={resetOrder} className="text-red-500 text-[10px] font-black uppercase hover:underline">Clear All</button>
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
                              <div className="flex items-center gap-2 mt-1">
                                <div className="flex items-center bg-slate-100 rounded-md p-0.5">
                                  <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-slate-200 rounded transition-colors"><Minus size={10} /></button>
                                  <span className="px-2 text-[11px] font-mono font-black">{item.quantity}</span>
                                  <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-slate-200 rounded transition-colors"><Plus size={10} /></button>
                                </div>
                                <span className="text-[10px] text-slate-400 font-bold">× {CURRENCY}{item.price.toFixed(2)}</span>
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
              </motion.div>
            )}

            {activeTab === 'history' && (
              <motion.div 
                key="history"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 p-6 overflow-y-auto"
              >
                <div className="max-w-4xl mx-auto space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-black tracking-tight text-slate-900 uppercase">My Order History</h2>
                  </div>

                  <div className="space-y-4">
                    {orders.filter(o => currentUser?.role === 'admin' ? true : o.userId === currentUser?.id).length === 0 ? (
                      <div className="bg-white p-12 text-center rounded-[32px] border border-slate-100">
                        <ShoppingBag size={48} className="mx-auto text-slate-200 mb-4" />
                        <p className="text-slate-400 font-black uppercase text-sm">No orders found yet</p>
                      </div>
                    ) : (
                      orders
                        .filter(o => currentUser?.role === 'admin' ? true : o.userId === currentUser?.id)
                        .map(order => (
                        <div key={order.id} className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex items-center justify-between">
                          <div className="flex items-center gap-6">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black ${
                              order.status === 'completed' ? 'bg-green-50 text-green-600' : 
                              order.status === 'pending' ? 'bg-orange-50 text-orange-600' : 'bg-slate-50 text-slate-400'
                            }`}>
                              {order.items.length}
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{order.id}</p>
                              <p className="text-sm font-black text-slate-900 uppercase tracking-tight">
                                {order.items.map(i => i.name).join(', ')}
                              </p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">
                                {new Date(order.timestamp).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          
                          <div className="text-right">
                             <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full border ${
                               order.status === 'completed' ? 'bg-green-50 text-green-600 border-green-100' : 
                               order.status === 'ready' ? 'bg-green-100 text-green-700 border-green-200 animate-bounce' :
                               order.status === 'cancelled' ? 'bg-red-50 text-red-600 border-red-100' :
                               'bg-orange-50 text-orange-600 border-orange-100 animate-pulse'
                             }`}>
                               {order.status}
                             </span>
                             <p className="text-lg font-black text-slate-900 mt-2">{CURRENCY}{order.total.toFixed(2)}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'menu' && (
              <motion.div 
                key="menu"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 p-6 overflow-y-auto"
              >
                <div className="max-w-7xl mx-auto space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-black tracking-tight text-slate-900 uppercase">Menu Management</h2>
                    <button 
                      onClick={() => {
                        setEditingItem(null);
                        resetMenuForm();
                        setShowMenuModal(true);
                      }}
                      className="bg-orange-500 text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-orange-500/20"
                    >
                      Add New Item
                    </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-4">
                      <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
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
                                        setEditingItem(item);
                                        setMenuForm({ ...item });
                                        setShowMenuModal(true);
                                      }}
                                      className="p-2 text-slate-400 hover:text-blue-500 transition-colors"
                                    >
                                      <Settings size={16} />
                                    </button>
                                    <button 
                                      onClick={() => deleteMenuItem(item.id)}
                                      className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm relative overflow-hidden">
                        <h3 className="font-black text-slate-900 text-sm tracking-tight uppercase mb-4 flex items-center gap-2">
                          <History size={16} className="text-orange-500" />
                          Activity Log
                        </h3>
                        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                          {auditLogs.length === 0 ? (
                            <p className="text-slate-300 text-xs text-center py-10 font-bold italic">No changes recorded yet</p>
                          ) : (
                            auditLogs.map(log => (
                              <div key={log.id} className="border-l-2 border-orange-100 pl-4 py-1">
                                <p className="text-[10px] font-black text-slate-800 uppercase leading-none">
                                  {log.userName}
                                </p>
                                <p className="text-[11px] text-slate-500 mt-1">
                                  <span className="font-black text-orange-500 uppercase">{log.action}</span> {log.itemName}
                                </p>
                                <p className="text-[9px] text-slate-400 italic mt-0.5 truncate">{log.changes}</p>
                                <p className="text-[8px] text-slate-300 font-bold mt-1">
                                  {new Date(log.timestamp).toLocaleTimeString()}
                                </p>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'kitchen' && (
              <motion.div 
                key="kitchen"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 p-6 overflow-y-auto"
              >
                <div className="max-w-6xl mx-auto space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-black tracking-tight text-slate-900">KITCHEN MONITOR</h2>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                        <span className="text-[10px] font-black uppercase text-slate-500">Live Updates</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {orders.filter(o => ['pending', 'accepted', 'preparing'].includes(o.status)).length === 0 ? (
                      <div className="col-span-full py-20 text-center text-slate-300">
                        <CheckCircle2 size={48} className="mx-auto opacity-20 mb-4" strokeWidth={1} />
                        <p className="font-black uppercase tracking-widest text-sm">All orders cleared! Waiting for customers... 🍖</p>
                      </div>
                    ) : (
                      orders.filter(o => ['pending', 'accepted', 'preparing'].includes(o.status)).reverse().map(order => (
                        <div key={order.id} className={`bg-white rounded-2xl border-t-4 border border-slate-200 shadow-sm overflow-hidden flex flex-col transition-all ${
                          order.status === 'pending' ? 'border-t-orange-500 shadow-orange-500/5' :
                          order.status === 'accepted' ? 'border-t-blue-500 shadow-blue-500/5' :
                          'border-t-yellow-500 shadow-yellow-500/5 animate-pulse'
                        }`}>
                          <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                            <div>
                               <div className="flex items-center gap-2">
                                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{order.id}</div>
                                  <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${
                                    order.status === 'pending' ? 'bg-orange-100 text-orange-600' :
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
              </motion.div>
            )}

            {activeTab === 'admin' && (
              <motion.div 
                key="admin"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 p-6 overflow-y-auto"
              >
                <div className="max-w-7xl mx-auto space-y-6">
                  {/* Dashboard Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm flex items-center gap-8 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><TrendingUp size={80} /></div>
                      <div className="w-16 h-16 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center shadow-inner italic font-black text-2xl">R</div>
                      <div className="relative z-10">
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Gross Revenue (Today)</p>
                        <p className="text-4xl font-black text-slate-900 tracking-tighter">{CURRENCY}{dailyStats.revenue.toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm flex items-center gap-8 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><TrendingUp size={80} /></div>
                      <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner">
                        <CreditCard size={32} />
                      </div>
                      <div className="relative z-10">
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Estimated Net Profit</p>
                        <p className="text-4xl font-black text-green-600 tracking-tighter">{CURRENCY}{dailyStats.profit.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Orders Table */}
                  <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                      <h3 className="font-black text-slate-900 text-lg tracking-tight uppercase">Order Management System</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
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
                                  <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-md tracking-widest ${
                                    order.status === 'completed' ? 'bg-green-100 text-green-700' :
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
              </motion.div>
            )}
        </AnimatePresence>
      </main>

      {/* Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPaymentModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              layoutId="payment-modal"
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl relative z-10"
            >
              <div className="p-8 space-y-8">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">PAYMENT SETTLEMENT</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Transaction ID: TXN-{Date.now().toString().slice(-6)}</p>
                  </div>
                  <button onClick={() => setShowPaymentModal(false)} className="bg-slate-100 p-2 rounded-xl text-slate-400 hover:text-slate-900 transition-colors">
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <div className="flex justify-between items-center mb-1">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Balance Due</span>
                       <span className="bg-orange-100 text-orange-600 px-2 py-0.5 rounded text-[9px] font-black">CASH ONLY</span>
                    </div>
                    <div className="text-4xl font-black text-slate-900 font-mono tracking-tighter">
                      {CURRENCY}{cartTotal.toFixed(2)}
                    </div>
                  </div>

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

                  <AnimatePresence>
                    {parseFloat(cashPaid) > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className={`p-6 rounded-2xl border-2 flex justify-between items-center ${
                          parseFloat(cashPaid) >= cartTotal 
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

                <button
                  disabled={!cashPaid || parseFloat(cashPaid) < cartTotal}
                  onClick={submitOrder}
                  className="w-full bg-slate-900 hover:bg-black text-white py-5 rounded-2xl font-black flex items-center justify-center gap-3 transition-all shadow-xl active:scale-[0.98] disabled:opacity-20 disabled:cursor-not-allowed uppercase tracking-widest text-sm"
                >
                  Confirm & Send to Kitchen
                  <ChefHat size={20} />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Order Detail Modal (Admin) */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOrder(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, x: 50 }}
              animate={{ scale: 1, opacity: 1, x: 0 }}
              exit={{ scale: 0.95, opacity: 0, x: 50 }}
              className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl relative z-10 flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-4">
                  <div className="bg-slate-900 text-white p-3 rounded-xl">
                    <History size={24} />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 uppercase tracking-tight">Order Details</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{selectedOrder.id}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-slate-900">
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                 <div className="grid grid-cols-2 gap-8">
                   <div className="space-y-4">
                      <div className="bg-slate-50 p-4 rounded-xl">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Status</label>
                        <select 
                          value={selectedOrder.status}
                          onChange={(e) => updateOrderStatus(selectedOrder.id, e.target.value as Order['status'])}
                          className="bg-transparent font-black text-sm uppercase text-slate-900 w-full focus:outline-none"
                        >
                          <option value="pending">Pending</option>
                          <option value="accepted">Accepted</option>
                          <option value="preparing">Preparing</option>
                          <option value="ready">Ready</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Timestamp</label>
                        <p className="font-black text-sm text-slate-900">{new Date(selectedOrder.timestamp).toLocaleString()}</p>
                      </div>
                   </div>
                   <div className="space-y-4">
                      <div className="bg-slate-50 p-4 rounded-xl">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Cash Paid</label>
                        <p className="font-black text-sm text-slate-900 font-mono italic">{CURRENCY}{selectedOrder.cashPaid.toFixed(2)}</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Change Given</label>
                        <p className="font-black text-sm text-green-600 font-mono italic">{CURRENCY}{selectedOrder.change.toFixed(2)}</p>
                      </div>
                   </div>
                 </div>

                 <div className="space-y-4">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Line Items</h4>
                    <div className="space-y-3">
                      {selectedOrder.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center group">
                          <div className="flex items-center gap-4">
                            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center font-black text-xs text-slate-600 italic">
                              {item.quantity}
                            </div>
                            <span className="font-black text-slate-800 text-sm">{item.name}</span>
                          </div>
                          <span className="font-mono font-black text-slate-900 text-sm">{CURRENCY}{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                 </div>
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-between items-center shrink-0">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Grand Total</span>
                  <span className="text-2xl font-black text-slate-900 font-mono tracking-tighter">{CURRENCY}{selectedOrder.total.toFixed(2)}</span>
                </div>
                <div className="flex gap-2">
                  <button className="bg-white border border-slate-200 text-slate-600 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-sm">
                    <Printer size={16} />
                    Receipt
                  </button>
                  <button className="bg-orange-500 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20">
                    Re-Order
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSuccessToast && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 text-white px-8 py-4 rounded-2xl flex items-center gap-4 shadow-2xl border-t-2 border-orange-500"
          >
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <CheckCircle2 size={20} />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-sm uppercase tracking-tight">Order Dispatched</span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Sent to Kitchen Monitor</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notifications */}
      <div className="fixed top-20 right-6 z-[120] space-y-4 pointer-events-none">
        <AnimatePresence>
          {notifications.map(n => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-slate-900 text-white p-5 rounded-2xl shadow-2xl border-l-4 border-orange-500 flex items-center gap-4 pointer-events-auto min-w-[300px]"
            >
              <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shrink-0">
                <ChefHat size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-orange-500 tracking-widest mb-0.5">Order Update</p>
                <p className="text-sm font-black tracking-tight">{n.message}</p>
              </div>
              <button 
                onClick={() => setNotifications(prev => prev.filter(nn => nn.id !== n.id))}
                className="ml-auto text-slate-500 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Item Detail Modal */}
      <AnimatePresence>
        {showItemDetail && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowItemDetail(null)}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-lg rounded-[40px] overflow-hidden shadow-2xl relative z-10 p-10"
            >
              <div className="flex justify-between items-start mb-8">
                <div>
                   <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">{showItemDetail.category}</span>
                   <h2 className="text-3xl font-black text-slate-900 mt-4 leading-tight uppercase tracking-tighter">{showItemDetail.name}</h2>
                </div>
                <button onClick={() => setShowItemDetail(null)} className="bg-slate-100 p-3 rounded-2xl text-slate-400 hover:text-slate-900 transition-all">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="bg-slate-50 p-6 rounded-[28px] border border-slate-100 text-slate-600 leading-relaxed font-medium text-base">
                  {showItemDetail.description || "No detailed description available for this item."}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="text-[10px] font-black uppercase bg-white border border-slate-200 px-3 py-1 rounded-md text-slate-400">Fresh Ingredients</span>
                    <span className="text-[10px] font-black uppercase bg-white border border-slate-200 px-3 py-1 rounded-md text-slate-400">Halal Friendly</span>
                    <span className="text-[10px] font-black uppercase bg-white border border-slate-200 px-3 py-1 rounded-md text-slate-400">Witbank's Favorite</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-6">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Price Unit</span>
                    <span className="text-4xl font-black text-slate-900 font-mono tracking-tighter">{CURRENCY}{showItemDetail.price.toFixed(2)}</span>
                  </div>
                  
                  <button 
                    onClick={() => { addToCart(showItemDetail); setShowItemDetail(null); }}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-5 rounded-[24px] font-black uppercase tracking-widest text-xs flex items-center gap-3 shadow-xl shadow-orange-500/20 active:scale-95 transition-all"
                  >
                    Add to Order
                    <Plus size={20} />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

        {/* Menu Item Modal */}
        <AnimatePresence>
          {showMenuModal && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowMenuModal(false)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl relative z-10 overflow-hidden flex flex-col"
              >
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-black text-slate-900 uppercase tracking-tight text-lg">
                    {editingItem ? 'Edit Menu Item' : 'New Menu Item'}
                  </h3>
                  <button onClick={() => setShowMenuModal(false)} className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400">
                    <X size={20} />
                  </button>
                </div>
                
                <form onSubmit={handleMenuSubmit} className="p-8 space-y-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-1 block">Item Name</label>
                      <input 
                        required
                        type="text" 
                        value={menuForm.name}
                        onChange={e => setMenuForm({...menuForm, name: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 font-bold"
                        placeholder="e.g. Extra Russian"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-1 block">Category</label>
                        <select 
                          value={menuForm.category}
                          onChange={e => setMenuForm({...menuForm, category: e.target.value})}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 font-bold"
                        >
                          {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-1 block">Selling Price ({CURRENCY})</label>
                        <input 
                          required
                          type="number" 
                          step="0.01"
                          value={menuForm.price}
                          onChange={e => setMenuForm({...menuForm, price: parseFloat(e.target.value)})}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 font-bold font-mono"
                        />
                      </div>
                    </div>

                    {currentUser?.role === 'admin' && (
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-1 block">Cost Price ({CURRENCY})</label>
                        <input 
                          type="number" 
                          step="0.01"
                          value={menuForm.costPrice}
                          onChange={e => setMenuForm({...menuForm, costPrice: parseFloat(e.target.value)})}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 font-bold font-mono"
                        />
                      </div>
                    )}

                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-1 block">Description</label>
                      <textarea 
                        value={menuForm.description}
                        onChange={e => setMenuForm({...menuForm, description: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 font-bold h-24 resize-none"
                        placeholder="Brief description of the item..."
                      />
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-orange-500 text-white font-black py-4 rounded-2xl shadow-xl shadow-orange-500/20 uppercase tracking-widest text-xs"
                  >
                    {editingItem ? 'Save Changes' : 'Create Item'}
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      {/* Success Toast */}
      <AnimatePresence>
        {showAuthModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900">
             {/* Background Pattern */}
             <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
             
             <motion.div 
               initial={{ opacity: 0, scale: 0.9, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               className="bg-white w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl relative z-10"
             >
                <div className="p-8 pb-4 text-center">
                  <div className="w-16 h-16 bg-orange-500 text-white rounded-2xl flex items-center justify-center font-black text-3xl mx-auto shadow-xl shadow-orange-500/20 mb-6">W</div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Witbank Express</h2>
                  <p className="text-slate-400 text-xs font-black uppercase tracking-widest mt-1">Management System v1.0</p>
                </div>

                <div className="p-8 pt-4">
                  <div className="flex bg-slate-100 p-1 rounded-xl mb-8">
                    <button 
                      onClick={() => { setAuthMode('login'); setAuthError(''); }}
                      className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${authMode === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
                    >
                      Login
                    </button>
                    <button 
                      onClick={() => { setAuthMode('signup'); setAuthError(''); }}
                      className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${authMode === 'signup' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
                    >
                      Sign Up
                    </button>
                  </div>

                  <form onSubmit={authMode === 'login' ? handleLogin : handleSignup} className="space-y-4">
                    {authMode === 'signup' && (
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                        <div className="relative">
                          <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                          <input 
                            required
                            type="text" 
                            className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl py-3 pl-12 pr-4 text-sm font-bold focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all"
                            placeholder="John Doe"
                            value={authForm.name}
                            onChange={e => setAuthForm({...authForm, name: e.target.value})}
                          />
                        </div>
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                        <input 
                          required
                          type="email" 
                          className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl py-3 pl-12 pr-4 text-sm font-bold focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all"
                          placeholder="name@company.com"
                          value={authForm.email}
                          onChange={e => setAuthForm({...authForm, email: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                        <input 
                          required
                          type="password" 
                          className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl py-3 pl-12 pr-4 text-sm font-bold focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all"
                          placeholder="••••••••"
                          value={authForm.password}
                          onChange={e => setAuthForm({...authForm, password: e.target.value})}
                        />
                      </div>
                    </div>

                    {authError && (
                      <div className="bg-red-50 border border-red-100 p-3 rounded-xl mb-2">
                        <p className="text-red-500 text-[10px] font-black uppercase text-center animate-shake leading-tight">{authError}</p>
                        {authError.toLowerCase().includes('network-request-failed') && (
                          <p className="text-red-400 text-[9px] font-bold text-center mt-1 leading-tight">
                            Troubleshooting: An Ad-blocker or firewall may be blocking the connection. Try disabling Ad-blockers or checking your signal.
                          </p>
                        )}
                      </div>
                    )}

                    <button 
                      type="submit"
                      className="w-full bg-slate-900 text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-black transition-all shadow-xl active:scale-95"
                    >
                      {authMode === 'login' ? 'Access System' : 'Create Account'}
                    </button>
                    
                    {authMode === 'signup' && (
                      <p className="text-[9px] text-slate-400 text-center font-bold uppercase mt-4">
                        Staff? Email including "admin" or "staff" grants permissions.
                      </p>
                    )}
                  </form>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}
